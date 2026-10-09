import React, { useState } from 'react';
import { AppNav } from './AppNav';
import { SettingsDrawer } from '../settings/SettingsDrawer';
import { cx } from '../../utils/format';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'menu' | 'profile' | 'appearance' | 'notifications' | 'security'>('menu');

  const toggleSettings = () => {
    if (!isSettingsOpen) {
      setSettingsView('menu');
    }
    setIsSettingsOpen(!isSettingsOpen);
  };
  const closeSettings = () => setIsSettingsOpen(false);

  const openProfile = () => {
    setSettingsView('profile');
    setIsSettingsOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-canvas overflow-hidden">
      <SettingsDrawer isOpen={isSettingsOpen} defaultView={settingsView} onToggle={toggleSettings} onClose={closeSettings} />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <AppNav onOpenProfile={openProfile} />
        <div className="flex-1 overflow-y-auto">
          <main
            className={cx(
              'mx-auto w-full max-w-shell px-4 py-6 sm:px-6 sm:py-8 lg:py-10 transition-all duration-300',
              className
            )}>
            
            {children}
          </main>
        </div>
      </div>
    </div>);
}

export function PageHeader({
  title,
  subtitle,
  action




}: {title: string;subtitle?: string;action?: React.ReactNode;}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-display-md font-extrabold text-navy-900">
          {title}
        </h1>
        {subtitle ?
        <p className="mt-2 text-[1.08rem] leading-relaxed text-navy-500">
            {subtitle}
          </p> :
        null}
      </div>
      {action}
    </div>);

}