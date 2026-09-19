from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class CustomUserCreationForm(UserCreationForm):
    first_name = forms.CharField(max_length=30, required=True, help_text='Required.')
    last_name = forms.CharField(max_length=30, required=True, help_text='Required.')

    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields + ('first_name', 'last_name')

class CreditApplicationForm(forms.Form):
    EDUCATION_CHOICES = [
        ('Secondary / secondary special', 'Secondary / secondary special'),
        ('Higher education', 'Higher education'),
        ('Incomplete higher', 'Incomplete higher'),
        ('Lower secondary', 'Lower secondary'),
        ('Academic degree', 'Academic degree')
    ]
    
    INCOME_TYPE_CHOICES = [
        ('Working', 'Working'),
        ('Commercial associate', 'Commercial associate'),
        ('Pensioner', 'Pensioner'),
        ('State servant', 'State servant'),
        ('Unemployed', 'Unemployed'),
        ('Student', 'Student'),
        ('Businessman', 'Businessman'),
        ('Maternity leave', 'Maternity leave')
    ]

    age_years = forms.FloatField(
        min_value=18.0, 
        max_value=120.0,
        label='Age (Years)',
        widget=forms.NumberInput(attrs={'placeholder': 'e.g., 35', 'step': '1'})
    )
    
    education_level = forms.ChoiceField(
        choices=EDUCATION_CHOICES,
        label='Education Level',
        widget=forms.Select()
    )
    
    family_member_count = forms.FloatField(
        min_value=1.0,
        label='Family Member Count',
        widget=forms.NumberInput(attrs={'placeholder': 'e.g., 3', 'step': '1'})
    )
    
    employment_years = forms.FloatField(
        min_value=0.0,
        label='Employment Length (Years)',
        help_text='Enter 0 if unemployed. Decimal values are allowed (e.g., 2.5 years).',
        widget=forms.NumberInput(attrs={'placeholder': 'e.g., 5', 'step': '0.1'})
    )
    
    income_type = forms.ChoiceField(
        choices=INCOME_TYPE_CHOICES,
        label='Income Type',
        widget=forms.Select()
    )
    
    income_monthly = forms.FloatField(
        min_value=0.0,
        label='Monthly Income (₹)',
        widget=forms.NumberInput(attrs={'placeholder': 'e.g., 50000'})
    )
    
    loan_credit_amount = forms.FloatField(
        min_value=1000.0,
        label='Requested Loan Amount (₹)',
        widget=forms.NumberInput(attrs={'placeholder': 'e.g., 200000'})
    )
    
    loan_annuity_emi = forms.FloatField(
        min_value=100.0,
        label='Monthly EMI Expected (₹)',
        widget=forms.NumberInput(attrs={'placeholder': 'e.g., 5000'})
    )
    
    goods_price = forms.FloatField(
        min_value=0.0,
        required=False,
        label='Price of Goods (If applicable) (₹)',
        widget=forms.NumberInput(attrs={'placeholder': 'e.g., 200000'})
    )
    
    def clean(self):
        cleaned_data = super().clean()
        loan_amount = cleaned_data.get('loan_credit_amount')
        goods_price = cleaned_data.get('goods_price')
        
        # If goods_price is provided, we might want to ensure it makes sense, but no strict rule is needed.
        # Just default it to loan_amount if not provided, to keep ratio at 1.0 (or we handle in view).
        
        return cleaned_data
