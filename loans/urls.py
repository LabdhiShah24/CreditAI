from django.urls import path
from . import api_views

urlpatterns = [
    # Planner
    path('planner/calculate/', api_views.api_planner_calculate, name='api_planner_calculate'),
    path('planner/handoff/', api_views.api_planner_handoff, name='api_planner_handoff'),
    
    # Tracker
    path('', api_views.api_loan_list_create, name='api_loan_list_create'),
    path('<int:loan_id>/', api_views.api_loan_detail, name='api_loan_detail'),
    path('<int:loan_id>/schedule/', api_views.api_loan_schedule, name='api_loan_schedule'),
    path('payments/<int:payment_id>/pay/', api_views.api_payment_mark_paid, name='api_payment_mark_paid'),
]
