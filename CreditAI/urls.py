from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from accounts.views import home, register, user_login, user_logout, dashboard, credit_form, history, assessment_detail, profile_view, ai_assistant_chat
from accounts import api_views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # --- LEGACY DJANGO UI (Keep for rollback) ---
    path('old/', home, name="home"),
    path("old/register/", register, name="register"),
    path("old/login/", user_login, name="login"),
    path("old/logout/", user_logout, name="logout"),
    path("old/dashboard/", dashboard, name="dashboard"),
    path('old/credit-form/', credit_form, name="credit_form"),
    path('old/history/', history, name="history"),
    path('old/history/<int:pk>/', assessment_detail, name="assessment_detail"),
    path('old/profile/', profile_view, name="profile"),
    path('old/assistant/', ai_assistant_chat, name="ai_assistant_chat"),
    
    # --- NEW JSON API ---
    path('api/csrf/', api_views.get_csrf, name="api_csrf"),
    path('api/auth/login/', api_views.api_login, name="api_login"),
    path('api/auth/register/', api_views.api_register, name="api_register"),
    path('api/auth/logout/', api_views.api_logout, name="api_logout"),
    path('api/user/me/', api_views.api_user_me, name="api_user_me"),
    path('api/user/preferences/', api_views.api_preferences, name="api_preferences"),
    path('api/user/password/', api_views.api_password, name="api_password"),
    path('api/user/security-history/', api_views.api_security_history, name="api_security_history"),
    path('api/assessments/', api_views.api_assessments, name="api_assessments"),
    path('api/assessments/<str:pk>/', api_views.api_assessment_detail, name="api_assessment_detail"),
    path('api/assistant/', api_views.api_assistant, name="api_assistant"),
    path('api/loans/', include('loans.urls')),
]

from django.conf import settings
from django.conf.urls.static import static
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    # --- REACT SPA CATCH-ALL ---
    # We serve the React app at the root. All unmatched routes go to React's index.html.
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]