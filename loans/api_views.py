import json
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import UserLoan, LoanPayment
from .engine import calculate_planner_summary, generate_amortization_schedule, round_money, solve_loan
from accounts.models import CreditApplication

def _parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return None

def _get_loan_reminders(loan):
    today = date.today()
    
    past_due = loan.payments.filter(status='UPCOMING', due_date__lt=today)
    if past_due.exists():
        past_due.update(status='OVERDUE')
        
    next_payment = loan.payments.exclude(status='PAID').order_by('due_date').first()
    overdue_payments = loan.payments.filter(status='OVERDUE', due_date__lt=today).count()
    
    reminder_status = 'NONE'
    days_until_due = 0
    days_overdue = 0
    amount_due = 0
    due_date_val = None
    
    reminders_on = True
    reminder_window = 5
    try:
        if hasattr(loan.user, 'profile'):
            reminders_on = loan.user.profile.loan_reminders_on
            reminder_window = loan.user.profile.reminder_window
    except Exception:
        pass
    
    if next_payment:
        due_date_val = next_payment.due_date
        amount_due = float(next_payment.scheduled_payment)
        delta = (due_date_val - today).days
        
        if next_payment.status == 'OVERDUE' or delta < 0:
            reminder_status = 'OVERDUE'
            days_overdue = -delta
        elif delta == 0:
            reminder_status = 'DUE_TODAY'
        elif delta <= reminder_window:
            reminder_status = 'UPCOMING'
            days_until_due = delta
        else:
            reminder_status = 'NONE'
            
    if not reminders_on:
        reminder_status = 'NONE'
        
    return {
        'status': reminder_status,
        'days_until_due': days_until_due,
        'days_overdue': days_overdue,
        'amount_due': amount_due,
        'due_date': due_date_val.isoformat() if due_date_val else None,
        'has_overdue': overdue_payments > 0,
        'overdue_count': overdue_payments,
    }

def _serialize_loan(loan):
    return {
        "id": loan.id,
        "name": loan.name,
        "original_principal": float(loan.original_principal),
        "outstanding_principal": float(loan.outstanding_principal),
        "annual_interest_rate": float(loan.annual_interest_rate),
        "interest_type": loan.interest_type,
        "repayment_frequency": loan.repayment_frequency,
        "scheduled_payment_amount": float(loan.scheduled_payment_amount),
        "start_date": loan.start_date.isoformat(),
        "first_payment_date": loan.first_payment_date.isoformat(),
        "expected_payoff_date": loan.expected_payoff_date.isoformat() if loan.expected_payoff_date else None,
        "processing_fee": float(loan.processing_fee),
        "other_fees": float(loan.other_fees),
        "status": loan.status,
        "created_at": loan.created_at.isoformat(),
        "reminders": _get_loan_reminders(loan),
    }

def _serialize_payment(payment):
    return {
        "id": payment.id,
        "loan_id": payment.loan.id,
        "due_date": payment.due_date.isoformat(),
        "scheduled_payment": float(payment.scheduled_payment),
        "principal_component": float(payment.principal_component),
        "interest_component": float(payment.interest_component),
        "remaining_balance": float(payment.remaining_balance),
        "status": payment.status,
        "actual_paid_date": payment.actual_paid_date.isoformat() if payment.actual_paid_date else None,
        "actual_paid_amount": float(payment.actual_paid_amount) if payment.actual_paid_amount else None,
    }

@login_required
def api_planner_calculate(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        
        try:
            principal = Decimal(str(data.get('principal', 0)))
            annual_rate = Decimal(str(data.get('annual_rate', 0)))
            processing_fee = Decimal(str(data.get('processing_fee', 0)))
            other_fees = Decimal(str(data.get('other_fees', 0)))
            
            tenure_months = data.get('tenure_months')
            if tenure_months is not None:
                tenure_months = int(tenure_months)
                
            emi = data.get('emi')
            if emi is not None:
                emi = Decimal(str(emi))
                
            first_payment_date_str = data.get('first_payment_date')
            first_payment_date = _parse_date(first_payment_date_str) if first_payment_date_str else date.today()
                
        except (InvalidOperation, ValueError, TypeError):
            return JsonResponse({"error": "Invalid numeric inputs."}, status=400)
            
        if principal <= 0:
            return JsonResponse({"error": "Principal must be positive."}, status=400)
        if annual_rate < 0:
            return JsonResponse({"error": "Interest rate cannot be negative."}, status=400)
        if processing_fee < 0 or other_fees < 0:
            return JsonResponse({"error": "Fees cannot be negative."}, status=400)
            
        summary = calculate_planner_summary(
            principal=principal,
            annual_rate=annual_rate,
            processing_fee=processing_fee,
            other_fees=other_fees,
            tenure_months=tenure_months,
            emi=emi,
            first_payment_date=first_payment_date
        )
        
        monthly_income = data.get('monthly_income')
        if monthly_income is None:
            latest_app = request.user.credit_applications.order_by('-created_at').first()
            if latest_app:
                monthly_income = latest_app.income_monthly
                
        affordability = None
        if monthly_income:
            monthly_income_dec = Decimal(str(monthly_income))
            if monthly_income_dec > 0:
                proposed_payment = summary['emi']
                pti = proposed_payment / monthly_income_dec
                income_remaining = monthly_income_dec - proposed_payment
                
                affordability = {
                    "monthly_income": float(monthly_income_dec),
                    "proposed_payment": float(proposed_payment),
                    "payment_to_income_ratio": float(pti),
                    "income_remaining": float(income_remaining),
                }

        response_data = {
            "principal": float(summary['principal']),
            "emi": float(summary['emi']),
            "tenure_months": summary['tenure_months'],
            "total_interest": float(summary['total_interest']),
            "total_repayment": float(summary['total_repayment']),
            "processing_fee": float(summary['processing_fee']),
            "other_fees": float(summary['other_fees']),
            "total_cost": float(summary['total_cost']),
            "affordability_info": affordability,
            "amortization_schedule": [
                {
                    "period": s['period'],
                    "due_date": s['due_date'].isoformat(),
                    "payment": float(s['payment']),
                    "principal": float(s['principal']),
                    "interest": float(s['interest']),
                    "balance": float(s['balance'])
                }
                for s in summary['schedule']
            ]
        }
        return JsonResponse(response_data)
        
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)

@login_required
def api_planner_handoff(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    latest_app = request.user.credit_applications.order_by('-created_at').first()
    if not latest_app:
        return JsonResponse({"error": "No assessments found"}, status=404)
        
    return JsonResponse({
        "loan_amount": float(latest_app.loan_credit_amount),
        "emi": float(latest_app.loan_annuity_emi),
        "monthly_income": float(latest_app.income_monthly),
        "goods_price": float(latest_app.goods_price) if latest_app.goods_price else None,
        "existing_debt_sum": float(latest_app.bureau_total_debt_sum) if latest_app.bureau_total_debt_sum else 0.0,
    })

@login_required
def api_loan_list_create(request):
    if request.method == "GET":
        loans = UserLoan.objects.filter(user=request.user).order_by('-created_at')
        return JsonResponse({"loans": [_serialize_loan(l) for l in loans]})
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            principal = Decimal(str(data['original_principal']))
            annual_rate = Decimal(str(data['annual_interest_rate']))
            emi = Decimal(str(data['scheduled_payment_amount']))
            processing_fee = Decimal(str(data.get('processing_fee', 0)))
            other_fees = Decimal(str(data.get('other_fees', 0)))
            
            start_date = _parse_date(data['start_date'])
            first_payment_date = _parse_date(data['first_payment_date'])
            
            if not start_date or not first_payment_date:
                return JsonResponse({"error": "Invalid dates"}, status=400)
                
            tenure_months = int(data['tenure_months'])
            
            if principal <= 0 or annual_rate < 0 or emi <= 0 or tenure_months <= 0:
                return JsonResponse({"error": "Invalid loan parameters"}, status=400)
                
            # Design B: Validate user-entered EMI against mathematically expected EMI
            expected_emi, _ = solve_loan(principal, annual_rate, tenure_months=tenure_months)
            
            # Allow a strict tolerance (e.g. ₹2.00) for banking rounding variations
            tolerance = Decimal('2.00')
            if abs(emi - expected_emi) > tolerance:
                return JsonResponse({
                    "error": f"The entered EMI (₹{emi}) materially differs from the expected EMI (₹{expected_emi}). Please check your inputs."
                }, status=400)
                
            with transaction.atomic():
                loan = UserLoan.objects.create(
                    user=request.user,
                    name=data.get('name', 'My Loan'),
                    original_principal=principal,
                    outstanding_principal=principal,
                    annual_interest_rate=annual_rate,
                    scheduled_payment_amount=emi,
                    start_date=start_date,
                    first_payment_date=first_payment_date,
                    processing_fee=processing_fee,
                    other_fees=other_fees,
                    status='ACTIVE'
                )
                
                sched_info = generate_amortization_schedule(
                    principal, annual_rate, emi, tenure_months, first_payment_date
                )
                
                loan.expected_payoff_date = sched_info['final_payoff_date']
                loan.save()
                
                payments_to_create = []
                for s in sched_info['schedule']:
                    payments_to_create.append(LoanPayment(
                        loan=loan,
                        due_date=s['due_date'],
                        scheduled_payment=s['payment'],
                        principal_component=s['principal'],
                        interest_component=s['interest'],
                        remaining_balance=s['balance'],
                        status='UPCOMING'
                    ))
                LoanPayment.objects.bulk_create(payments_to_create)
                
            return JsonResponse({"message": "Loan created", "loan": _serialize_loan(loan)}, status=201)
            
        except (KeyError, ValueError, InvalidOperation) as e:
            return JsonResponse({"error": "Invalid request data: " + str(e)}, status=400)

@login_required
def api_loan_detail(request, loan_id):
    loan = get_object_or_404(UserLoan, pk=loan_id, user=request.user)
    
    if request.method == "GET":
        data = _serialize_loan(loan)
        return JsonResponse({"loan": data})
        
    elif request.method == "DELETE":
        loan.status = 'ARCHIVED'
        loan.save()
        return JsonResponse({"message": "Loan archived"})
        
    return JsonResponse({"error": "Method not allowed"}, status=405)

@login_required
def api_loan_schedule(request, loan_id):
    loan = get_object_or_404(UserLoan, pk=loan_id, user=request.user)
    
    if request.method == "GET":
        payments = loan.payments.all().order_by('due_date')
        return JsonResponse({
            "schedule": [_serialize_payment(p) for p in payments]
        })
    return JsonResponse({"error": "Method not allowed"}, status=405)

@login_required
def api_payment_mark_paid(request, payment_id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    payment = get_object_or_404(LoanPayment, pk=payment_id, loan__user=request.user)
    
    if payment.status == 'PAID':
        return JsonResponse({"error": "Payment is already paid"}, status=400)
        
    try:
        data = json.loads(request.body)
        paid_amount_val = data.get('paid_amount')
        
        if paid_amount_val is not None:
            paid_amount = Decimal(str(paid_amount_val))
        else:
            paid_amount = payment.scheduled_payment
            
        if paid_amount <= 0:
            return JsonResponse({"error": "Paid amount must be positive"}, status=400)
            
        paid_date_str = data.get('paid_date')
        if paid_date_str:
            paid_date = _parse_date(paid_date_str)
            if not paid_date:
                return JsonResponse({"error": "Invalid date"}, status=400)
        else:
            paid_date = date.today()
            
        with transaction.atomic():
            payment.status = 'PAID'
            payment.actual_paid_amount = paid_amount
            payment.actual_paid_date = paid_date
            payment.save()
            
            loan = payment.loan
            loan.outstanding_principal -= payment.principal_component
            
            if loan.outstanding_principal <= 0:
                loan.status = 'PAID_OFF'
                loan.outstanding_principal = Decimal('0.00')
                
            loan.save()
            
        return JsonResponse({"message": "Payment marked as paid", "payment": _serialize_payment(payment)})
        
    except (ValueError, InvalidOperation):
        return JsonResponse({"error": "Invalid numeric input"}, status=400)
