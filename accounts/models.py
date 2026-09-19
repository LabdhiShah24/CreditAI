from django.db import models
from django.contrib.auth.models import User

class CreditApplication(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='credit_applications')
    
    # User Inputs
    age_years = models.FloatField()
    education_level = models.CharField(max_length=100)
    family_member_count = models.FloatField()
    employment_years = models.FloatField()
    income_type = models.CharField(max_length=100)
    income_monthly = models.FloatField()
    loan_credit_amount = models.FloatField()
    loan_annuity_emi = models.FloatField()
    goods_price = models.FloatField(null=True, blank=True)
    
    # ML Outputs
    calibrated_pd = models.FloatField(null=True, blank=True)
    creditai_score = models.IntegerField(null=True, blank=True)
    risk_band = models.CharField(max_length=50, null=True, blank=True)
    shap_explanations = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Application by {self.user.username} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"
