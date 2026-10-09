import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3Icon,
  HistoryIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  SparklesIcon,
  XIcon } from
'lucide-react';
import { Logo } from '../ui/Logo';
import { cx } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';

export const NAV_ITEMS = [
{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
{ to: '/analyze', label: 'Analyze Credit', icon: BarChart3Icon },
{ to: '/loans', label: 'Loans', icon: LandmarkIcon },
{ to: '/assistant', label: 'AI Assistant', icon: SparklesIcon },
{ to: '/history', label: 'History', icon: HistoryIcon }];

function UserAvatar({ onClick }: { onClick?: () => void }) {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  
  useEffect(() => {
    setImgError(false);
  }, [user?.profile_picture]);
  
  const initials = user?.first_name ? user.first_name[0].toUpperCase() : user?.username?.[0]?.toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open profile settings"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[1rem] font-bold text-navy-700 overflow-hidden transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:outline-none border border-navy-200"
    >
      {user?.profile_picture && !imgError ? (
        <img 
          src={user.profile_picture} 
          alt="" 
          onError={() => setImgError(true)} 
          className="h-full w-full object-cover" 
        />
      ) : (
        initials
      )}
    </button>
  );
}

export function AppNav({ onOpenProfile }: { onOpenProfile?: () => void }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full items-center justify-between gap-6 px-4 sm:px-6 lg:h-[72px]">
        <Link to="/dashboard" aria-label="CreditAI dashboard">
          <Logo size={34} />
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation">
          
          {NAV_ITEMS.map((item) =>
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
            cx(
              'rounded-pill px-4 py-2 text-[1rem] font-semibold transition-[background-color,color] duration-150 ease-out',
              isActive ?
              'bg-navy-900 text-white' :
              'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
            )
            }>
            
              {item.label}
            </NavLink>
          )}

          <div className="ml-4 flex items-center gap-4 border-l border-navy-200 pl-4">
            <UserAvatar onClick={() => { setOpen(false); onOpenProfile?.(); }} />
            
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-pill border border-navy-200 px-4 py-2 text-[1rem] font-semibold text-navy-600 transition-[background-color,border-color,color] duration-150 ease-out hover:border-coral-200 hover:bg-coral-50 hover:text-coral-700">
              
              <LogOutIcon size={17} aria-hidden="true" />
              Logout
            </button>
          </div>
        </nav>

        <div className="flex items-center gap-3 lg:hidden">
          <UserAvatar onClick={() => { setOpen(false); onOpenProfile?.(); }} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-navy-200 bg-white text-navy-900 transition-colors duration-150 ease-out hover:bg-navy-50">
            
            <MenuIcon size={22} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ?
        <motion.div
          className="fixed inset-0 z-50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>
          
            <div
            className="absolute inset-0 bg-navy-900/45"
            onClick={() => setOpen(false)}
            aria-hidden="true" />
          
            <motion.div
            role="dialog"
            aria-label="Navigation menu"
            className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-canvas shadow-lift"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}>
            
              <div className="flex h-16 items-center justify-between border-b border-navy-100 px-4">
                <Logo size={32} />
                <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-navy-200 bg-white text-navy-900 transition-colors duration-150 ease-out hover:bg-navy-50">
                
                  <XIcon size={22} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile navigation">
                <ul className="flex flex-col gap-2">
                  {NAV_ITEMS.map((item) =>
                <li key={item.to}>
                      <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                    cx(
                      'flex min-h-[56px] items-center gap-3 rounded-2xl px-4 text-[1.08rem] font-semibold transition-colors duration-150 ease-out',
                      isActive ?
                      'bg-navy-900 text-white' :
                      'bg-white text-navy-800 hover:bg-navy-50'
                    )
                    }>
                    
                        <item.icon size={20} aria-hidden="true" />
                        {item.label}
                      </NavLink>
                    </li>
                )}
                  <li className="pt-2">
                    <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-coral-200 bg-coral-50 px-4 text-[1.08rem] font-semibold text-coral-700">
                    
                      <LogOutIcon size={20} aria-hidden="true" />
                      Logout
                    </button>
                  </li>
                </ul>
              </nav>
            </motion.div>
          </motion.div> :
        null}
      </AnimatePresence>
    </header>
  );
}