import math
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from dateutil.relativedelta import relativedelta
from datetime import date

def round_money(val: Decimal) -> Decimal:
    """Rounds to 2 decimal places using standard half-up rounding."""
    return val.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def calculate_monthly_rate(annual_rate: Decimal) -> Decimal:
    """Converts annual interest rate percentage to a monthly decimal rate."""
    return (annual_rate / Decimal('100')) / Decimal('12')

def solve_loan(principal: Decimal, annual_rate: Decimal, tenure_months: int = None, emi: Decimal = None):
    """
    Solves for the missing loan parameter (EMI or tenure).
    Must provide exactly one of (tenure_months, emi) along with principal and rate.
    """
    if tenure_months is None and emi is None:
        raise ValueError("Must provide either tenure_months or emi.")
    if tenure_months is not None and emi is not None:
        # If both are provided, we'll assume tenure is the authoritative one and recalculate EMI
        pass

    if emi is not None:
        emi = Decimal(str(emi))

    principal = Decimal(str(principal))
    annual_rate = Decimal(str(annual_rate))
    if principal < 0 or annual_rate < 0:
        raise ValueError("Principal and rate must be non-negative.")

    r = calculate_monthly_rate(annual_rate)

    if r == 0:
        if tenure_months is not None:
            if tenure_months <= 0:
                raise ValueError("Tenure must be positive.")
            calc_emi = principal / Decimal(tenure_months)
            return round_money(calc_emi), tenure_months
        else:
            if emi <= 0:
                raise ValueError("EMI must be positive.")
            calc_tenure = math.ceil(principal / emi)
            return emi, calc_tenure

    # r > 0
    if tenure_months is not None:
        if tenure_months <= 0:
            raise ValueError("Tenure must be positive.")
        # EMI = P * r * (1+r)^N / ((1+r)^N - 1)
        r_float = float(r)
        p_float = float(principal)
        n = tenure_months
        numerator = p_float * r_float * math.pow(1 + r_float, n)
        denominator = math.pow(1 + r_float, n) - 1
        calc_emi = Decimal(str(numerator / denominator))
        return round_money(calc_emi), n
    else:
        # Solve for N
        if emi <= 0:
            raise ValueError("EMI must be positive.")
        
        r_float = float(r)
        p_float = float(principal)
        emi_float = float(emi)
        
        if emi_float <= p_float * r_float:
            raise ValueError("EMI is too low to cover interest. Loan will never be paid off.")
            
        n = -math.log(1 - (p_float * r_float) / emi_float) / math.log(1 + r_float)
        calc_tenure = math.ceil(n)
        
        # We should recalculate the EXACT EMI for the ceiling tenure, or keep the user EMI
        # The prompt says: "MODE B: Principal + interest rate + payment -> calculate number of periods"
        # Often the final payment is just smaller. We will keep the given EMI and return the tenure.
        return round_money(emi), calc_tenure

def generate_amortization_schedule(principal: Decimal, annual_rate: Decimal, emi: Decimal, tenure_months: int, first_payment_date: date):
    """
    Generates the amortization schedule.
    Returns a list of dicts with payment details.
    """
    principal = Decimal(str(principal))
    annual_rate = Decimal(str(annual_rate))
    emi = round_money(Decimal(str(emi)))
    r = calculate_monthly_rate(annual_rate)

    schedule = []
    balance = principal
    total_interest = Decimal('0.00')
    total_principal = Decimal('0.00')

    current_date = first_payment_date

    for period in range(1, tenure_months + 1):
        if balance <= 0:
            break

        # Calculate interest for the period
        interest = round_money(balance * r)
        
        # Final period adjustment
        if period == tenure_months or balance + interest <= emi:
            payment = balance + interest
            principal_comp = balance
        else:
            payment = emi
            principal_comp = payment - interest

        # Just in case rounding makes principal component larger than balance
        if principal_comp > balance:
            principal_comp = balance
            payment = principal_comp + interest

        balance -= principal_comp
        total_interest += interest
        total_principal += principal_comp

        schedule.append({
            'period': period,
            'due_date': current_date,
            'payment': payment,
            'principal': principal_comp,
            'interest': interest,
            'balance': balance
        })

        # Increment date safely by 1 month
        current_date += relativedelta(months=1)

    return {
        'schedule': schedule,
        'total_interest': total_interest,
        'total_principal': total_principal,
        'total_repayment': total_principal + total_interest,
        'final_payoff_date': schedule[-1]['due_date'] if schedule else first_payment_date
    }

def calculate_planner_summary(principal, annual_rate, processing_fee, other_fees, tenure_months=None, emi=None, first_payment_date=None):
    """
    High-level API for the loan planner.
    """
    principal = Decimal(str(principal))
    processing_fee = Decimal(str(processing_fee))
    other_fees = Decimal(str(other_fees))
    total_fees = processing_fee + other_fees

    calc_emi, calc_tenure = solve_loan(principal, annual_rate, tenure_months, emi)
    
    if first_payment_date is None:
        raise ValueError("first_payment_date is required for planner schedule.")
        
    sched_info = generate_amortization_schedule(principal, annual_rate, calc_emi, calc_tenure, first_payment_date)

    return {
        'principal': principal,
        'emi': calc_emi,
        'tenure_months': calc_tenure,
        'total_interest': sched_info['total_interest'],
        'total_repayment': sched_info['total_repayment'],
        'processing_fee': processing_fee,
        'other_fees': other_fees,
        'total_cost': sched_info['total_interest'] + total_fees,
        'schedule': sched_info['schedule']
    }
