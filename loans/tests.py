import json
from decimal import Decimal
from datetime import date
from dateutil.relativedelta import relativedelta
from django.test import TestCase, Client
from django.contrib.auth.models import User

from .models import UserLoan, LoanPayment
from .engine import solve_loan, generate_amortization_schedule, calculate_planner_summary

class LoanEngineTests(TestCase):
    def test_solve_loan_mode_a(self):
        # Principal + Rate + Tenure -> EMI
        emi, tenure = solve_loan(10000, 5.0, tenure_months=12)
        self.assertEqual(tenure, 12)
        # 10000 at 5% over 12 mo -> EMI is approx 856.07
        self.assertAlmostEqual(float(emi), 856.07, places=2)

    def test_solve_loan_mode_b(self):
        # Principal + Rate + EMI -> Tenure
        emi, tenure = solve_loan(10000, 5.0, emi=856.08)
        self.assertEqual(tenure, 12)

    def test_zero_interest(self):
        emi, tenure = solve_loan(12000, 0.0, tenure_months=12)
        self.assertEqual(float(emi), 1000.00)
        self.assertEqual(tenure, 12)
        
        emi2, tenure2 = solve_loan(12000, 0.0, emi=1000)
        self.assertEqual(tenure2, 12)
        self.assertEqual(float(emi2), 1000.00)

    def test_insufficient_inputs(self):
        with self.assertRaises(ValueError):
            solve_loan(10000, 5.0)

    def test_invalid_inputs(self):
        with self.assertRaises(ValueError):
            solve_loan(-10000, 5.0, tenure_months=12)
        with self.assertRaises(ValueError):
            solve_loan(10000, -5.0, tenure_months=12)
        with self.assertRaises(ValueError):
            solve_loan(10000, 5.0, tenure_months=0)

    def test_amortization_schedule(self):
        first_date = date(2023, 1, 31)
        sched_info = generate_amortization_schedule(10000, 5.0, 856.07, 12, first_date)
        
        self.assertEqual(len(sched_info['schedule']), 12)
        self.assertEqual(sched_info['schedule'][0]['due_date'], date(2023, 1, 31))
        # Add 1 month to Jan 31 -> Feb 28
        self.assertEqual(sched_info['schedule'][1]['due_date'], date(2023, 2, 28))
        
        # Balance should be 0 at the end
        self.assertEqual(sched_info['schedule'][-1]['balance'], Decimal('0.00'))
        
        # Check totals
        self.assertGreater(sched_info['total_interest'], Decimal('0'))
        self.assertAlmostEqual(float(sched_info['total_principal']), 10000.00, places=2)

    def test_planner_summary(self):
        first_date = date(2023, 1, 31)
        summary = calculate_planner_summary(10000, 5.0, 100, 50, tenure_months=12, first_payment_date=first_date)
        self.assertEqual(float(summary['principal']), 10000.00)
        self.assertEqual(float(summary['processing_fee']), 100.00)
        self.assertEqual(float(summary['other_fees']), 50.00)
        self.assertGreater(float(summary['total_cost']), 150.00) # fees + interest
        
class LoanAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user1 = User.objects.create_user(username='user1', password='pw1')
        self.user2 = User.objects.create_user(username='user2', password='pw2')
        
    def test_user_isolation(self):
        self.client.login(username='user1', password='pw1')
        
        # Create loan for user 1
        res = self.client.post('/api/loans/', json.dumps({
            'name': 'Test Loan',
            'original_principal': 10000,
            'annual_interest_rate': 5.0,
            'scheduled_payment_amount': 856.07,
            'tenure_months': 12,
            'start_date': '2023-01-01',
            'first_payment_date': '2023-01-31'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        loan_id = res.json()['loan']['id']
        
        # Switch to user 2
        self.client.login(username='user2', password='pw2')
        
        # user2 should not see user1's loan
        res_list = self.client.get('/api/loans/')
        self.assertEqual(len(res_list.json()['loans']), 0)
        
        # user2 should not be able to fetch user1's loan
        res_detail = self.client.get(f'/api/loans/{loan_id}/')
        self.assertEqual(res_detail.status_code, 404)
        
        # user2 should not be able to delete it
        res_del = self.client.delete(f'/api/loans/{loan_id}/')
        self.assertEqual(res_del.status_code, 404)
        
    def test_tracker_emi_validation_correct(self):
        self.client.login(username='user1', password='pw1')
        
        # Test Case: Principal = 100000, Annual rate = 12%, Tenure = 12 months
        # Mathematically correct EMI ≈ 8884.88
        res = self.client.post('/api/loans/', json.dumps({
            'name': 'Test Correct EMI',
            'original_principal': 100000,
            'annual_interest_rate': 12.0,
            'scheduled_payment_amount': 8884.88,
            'tenure_months': 12,
            'start_date': '2023-01-01',
            'first_payment_date': '2023-01-31'
        }), content_type='application/json')
        
        self.assertEqual(res.status_code, 201)
        loan_id = res.json()['loan']['id']
        
        # Verify amortization schedule
        sched_res = self.client.get(f'/api/loans/{loan_id}/schedule/')
        payments = sched_res.json()['schedule']
        
        self.assertEqual(len(payments), 12)
        # Final balance should be exactly 0
        self.assertAlmostEqual(payments[-1]['remaining_balance'], 0.0, places=2)

    def test_tracker_emi_validation_incorrect(self):
        self.client.login(username='user1', password='pw1')
        
        # Test Case: Intentionally incorrect EMI (8848.88 instead of 8884.88)
        res = self.client.post('/api/loans/', json.dumps({
            'name': 'Test Incorrect EMI',
            'original_principal': 100000,
            'annual_interest_rate': 12.0,
            'scheduled_payment_amount': 8848.88,
            'tenure_months': 12,
            'start_date': '2023-01-01',
            'first_payment_date': '2023-01-31'
        }), content_type='application/json')
        
        # Should return 400 Bad Request due to mismatch
        self.assertEqual(res.status_code, 400)
        self.assertIn('materially differs', res.json()['error'])
        
    def test_tracker_emi_validation_zero_interest(self):
        self.client.login(username='user1', password='pw1')
        
        res = self.client.post('/api/loans/', json.dumps({
            'name': 'Test Zero Interest',
            'original_principal': 12000,
            'annual_interest_rate': 0.0,
            'scheduled_payment_amount': 1000.00,
            'tenure_months': 12,
            'start_date': '2023-01-01',
            'first_payment_date': '2023-01-31'
        }), content_type='application/json')
        
        self.assertEqual(res.status_code, 201)

    def test_mark_payment_paid(self):
        self.client.login(username='user1', password='pw1')
        res = self.client.post('/api/loans/', json.dumps({
            'original_principal': 10000,
            'annual_interest_rate': 5.0,
            'scheduled_payment_amount': 856.07,
            'tenure_months': 12,
            'start_date': '2023-01-01',
            'first_payment_date': '2023-01-31'
        }), content_type='application/json')
        loan_id = res.json()['loan']['id']
        
        # Get schedule
        sched_res = self.client.get(f'/api/loans/{loan_id}/schedule/')
        payments = sched_res.json()['schedule']
        first_payment_id = payments[0]['id']
        
        # Pay
        pay_res = self.client.post(f'/api/loans/payments/{first_payment_id}/pay/', json.dumps({
            'paid_amount': 856.07,
            'paid_date': '2023-01-31'
        }), content_type='application/json')
        
        self.assertEqual(pay_res.status_code, 200)
        self.assertEqual(pay_res.json()['payment']['status'], 'PAID')
        
        # Check loan balance
        loan_res = self.client.get(f'/api/loans/{loan_id}/')
        outstanding = loan_res.json()['loan']['outstanding_principal']
        # It should have reduced by the principal component, not full EMI
        self.assertLess(outstanding, 10000)
        self.assertGreater(outstanding, 10000 - 856.07)

    def test_planner_calculate(self):
        self.client.login(username='user1', password='pw1')
        res = self.client.post('/api/loans/planner/calculate/', json.dumps({
            'principal': 10000,
            'annual_rate': 5.0,
            'tenure_months': 12,
            'monthly_income': 5000,
            'processing_fee': 100,
            'other_fees': 50
        }), content_type='application/json')
        
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertAlmostEqual(data['emi'], 856.07, places=2)
        self.assertEqual(data['tenure_months'], 12)
        self.assertEqual(data['processing_fee'], 100.0)
        self.assertGreater(data['total_cost'], 150.0)
        self.assertIsNotNone(data['affordability_info'])
        self.assertEqual(data['affordability_info']['monthly_income'], 5000.0)

    def test_invalid_planner_calculate(self):
        self.client.login(username='user1', password='pw1')
        res = self.client.post('/api/loans/planner/calculate/', json.dumps({
            'principal': -1000,
            'annual_rate': 5.0,
            'tenure_months': 12
        }), content_type='application/json')
        self.assertEqual(res.status_code, 400)
