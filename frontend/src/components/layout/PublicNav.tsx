import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { ButtonLink } from '../ui/Button';

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between px-4 sm:px-6 lg:h-[72px]">
        <Link to="/" aria-label="CreditAI home">
          <Logo size={34} />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="rounded-pill px-4 py-2.5 text-[1rem] font-semibold text-navy-700 transition-colors duration-150 ease-out hover:bg-navy-50 hover:text-navy-900">
            
            Login
          </Link>
          <ButtonLink to="/register" size="sm" variant="primary">
            Register
          </ButtonLink>
        </div>
      </div>
    </header>);

}