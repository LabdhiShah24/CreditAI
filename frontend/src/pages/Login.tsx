import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { TextField } from '../components/ui/Field';
import { Button } from '../components/ui/Button';

import { fetchApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      await fetchApi('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      await checkAuth();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to see your latest CreditAI assessment."
      asideTitle="Your credit picture, explained in plain language."
      asidePoints={[
      'A single CreditAI Score with a clear presentation band.',
      'Risk factors ranked by how much they influenced your result.',
      'An assistant that can answer questions about your assessment.']
      }
      footer={
      <>
          Don&rsquo;t have an account?{' '}
          <Link
          to="/register"
          className="font-semibold text-ai-600 underline-offset-4 hover:underline">
          
            Create your account
          </Link>
        </>
      }>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          id="username"
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="labdhi.shah"
          required />
        
        <TextField
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required />
          
        {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
        
        <Button type="submit" size="lg" className="mt-1 w-full" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Login'}
        </Button>
      </form>
    </AuthLayout>);

}