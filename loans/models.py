from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

class UserLoan(models.Model):
    INTEREST_TYPE_CHOICES = [
        ('FIXED', 'Fixed Rate'),
    ]
    
    FREQUENCY_CHOICES = [
        ('MONTHLY', 'Monthly'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('PAID_OFF', 'Paid Off'),
        ('ARCHIVED', 'Archived'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loans')
    name = models.CharField(max_length=255, default='My Loan')
    
    original_principal = models.DecimalField(max_digits=12, decimal_places=2)
    outstanding_principal = models.DecimalField(max_digits=12, decimal_places=2)
    
    annual_interest_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage (e.g., 5.50 for 5.5%)")
    interest_type = models.CharField(max_length=50, choices=INTEREST_TYPE_CHOICES, default='FIXED')
    repayment_frequency = models.CharField(max_length=50, choices=FREQUENCY_CHOICES, default='MONTHLY')
    
    scheduled_payment_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    start_date = models.DateField()
    first_payment_date = models.DateField()
    expected_payoff_date = models.DateField(null=True, blank=True)
    
    processing_fee = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    other_fees = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='ACTIVE')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.name} - {self.user.username}"


class LoanPayment(models.Model):
    STATUS_CHOICES = [
        ('UPCOMING', 'Upcoming'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]

    loan = models.ForeignKey(UserLoan, on_delete=models.CASCADE, related_name='payments')
    due_date = models.DateField()
    
    scheduled_payment = models.DecimalField(max_digits=12, decimal_places=2)
    principal_component = models.DecimalField(max_digits=12, decimal_places=2)
    interest_component = models.DecimalField(max_digits=12, decimal_places=2)
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='UPCOMING')
    
    actual_paid_date = models.DateField(null=True, blank=True)
    actual_paid_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date']
        indexes = [
            models.Index(fields=['loan', 'status']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"Payment for {self.loan.name} due {self.due_date}"
