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
    
    # V3 Credit History Features
    bureau_total_loans_count = models.IntegerField(null=True, blank=True)
    bureau_active_loans_count = models.IntegerField(null=True, blank=True)
    bureau_total_debt_sum = models.FloatField(null=True, blank=True)
    bureau_total_credit_limit = models.FloatField(null=True, blank=True)
    bureau_credit_history_length_years = models.FloatField(null=True, blank=True)
    prev_app_refused_count = models.IntegerField(null=True, blank=True)
    
    # ML Outputs
    calibrated_pd = models.FloatField(null=True, blank=True)
    creditai_score = models.IntegerField(null=True, blank=True)
    risk_band = models.CharField(max_length=50, null=True, blank=True)
    shap_explanations = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Application by {self.user.username} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    
    # Appearance Settings
    theme = models.CharField(max_length=20, default='light')
    reduce_motion = models.CharField(max_length=20, default='system')
    
    # Notification Settings
    loan_reminders_on = models.BooleanField(default=True)
    reminder_window = models.IntegerField(default=5)  # days before

    def __str__(self):
        return f"Profile of {self.user.username}"

class SecurityEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_events')
    event_type = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.event_type} - {self.user.username} at {self.created_at}"
