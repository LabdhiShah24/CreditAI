import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Analyze } from './pages/Analyze';
import { Result } from './pages/Result';
import { Loans } from './pages/loans/Loans';
import { History } from './pages/History';
import { AssessmentDetails } from './pages/AssessmentDetails';
import { Profile } from './pages/Profile';
import { Assistant } from './pages/Assistant';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/result" element={<Result />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<AssessmentDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>);

}