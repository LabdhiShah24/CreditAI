export function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const csrfToken = getCookie('csrftoken');
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
    headers.set('X-CSRFToken', csrfToken);
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Unknown error';
    try {
      const errorData = await response.json();
      if (errorData.details && typeof errorData.details === 'object') {
        const messages = [];
        for (const [field, errs] of Object.entries(errorData.details)) {
          const fieldErrors = Array.isArray(errs) ? errs.map(e => e.message || e).join(', ') : errs;
          messages.push(`${field}: ${fieldErrors}`);
        }
        errorDetail = messages.join(' | ');
      } else {
        errorDetail = errorData.error || response.statusText;
      }
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  // Handle empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return response.json();
}

export function mapDjangoAssessment(app: any) {
  const factors = [
    ...(app.shap_explanations?.risk_increasing || []).map((f: any, i: number) => ({
      id: `inc-${i}`, label: f.name, detail: f.impact, influence: Math.max(0.1, 0.9 - (i * 0.2)), direction: 'higher' as const
    })),
    ...(app.shap_explanations?.risk_reducing || []).map((f: any, i: number) => ({
      id: `dec-${i}`, label: f.name, detail: f.impact, influence: Math.max(0.1, 0.9 - (i * 0.2)), direction: 'lower' as const
    }))
  ];

  return {
    id: app.id.toString(),
    date: new Date(app.created_at).toLocaleDateString(),
    score: app.creditai_score,
    paymentRisk: app.calibrated_pd,
    loanAmount: `₹${app.loan_credit_amount?.toLocaleString()}`,
    details: [
      { label: "Application ID", value: app.id.toString() },
      { label: "Assessment Date", value: new Date(app.created_at).toLocaleDateString() },
      { label: "Age", value: `${app.age_years} years` },
      { label: "Family Members", value: app.family_member_count.toString() },
      { label: "Income Type", value: app.income_type }
    ],
    factors,
    limitedHistory: app.employment_years === 0
  };
}
