import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { TextField } from '../components/ui/Field';
import { Button } from '../components/ui/Button';

import { fetchApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function Register() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    try {
      await fetchApi('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData))
      });
      // After registering, log them in automatically
      await fetchApi('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ 
          username: formData.get('username'), 
          password 
        })
      });
      await checkAuth();
      navigate('/dashboard', { state: { isNewUser: true } });
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create Your CreditAI Profile"
      subtitle="It takes a minute. You can run your first assessment straight after."
      asideTitle="Start with an assessment you can actually read."
      asidePoints={[
      'No documents and no bureau pull to get your first result.',
      'Every score comes with the factors behind it.',
      'Your assessments are saved so you can track changes over time.']
      }
      footer={
      <>
          Already have an account?{' '}
          <Link
          to="/login"
          className="font-semibold text-ai-600 underline-offset-4 hover:underline">
          
            Login
          </Link>
        </>
      }>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="firstName"
            label="First Name"
            name="firstName"
            autoComplete="given-name"
            placeholder="Labdhi"
            required />
          
          <TextField
            id="lastName"
            label="Last Name"
            name="lastName"
            autoComplete="family-name"
            placeholder="Shah"
            required />
          
        </div>
        <TextField
          id="username"
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="labdhi.shah"
          required />
        
        <TextField
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required />
        
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="password"
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            helper="At least 8 characters."
            required />
          
          <TextField
            id="confirmPassword"
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required />
          
        </div>
        
        {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
        
        <Button type="submit" size="lg" className="mt-1 w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
    </AuthLayout>);

}