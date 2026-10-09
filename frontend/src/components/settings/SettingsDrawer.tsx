import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon, PaletteIcon, BellIcon, ShieldIcon, XIcon, ChevronLeftIcon, CameraIcon, UploadIcon, CheckIcon, RefreshCwIcon, CheckCircle2Icon, MenuIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { fetchApi } from '../../services/api';
import { cx } from '../../utils/format';

export function SettingsDrawer({ isOpen, defaultView = 'menu', onToggle, onClose }: { isOpen: boolean; defaultView?: 'menu' | 'profile' | 'appearance' | 'notifications' | 'security'; onToggle: () => void; onClose: () => void }) {
  const [view, setView] = useState<'menu' | 'profile' | 'appearance' | 'notifications' | 'security'>(defaultView);
  const { user, checkAuth } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setView(defaultView);
    }
  }, [isOpen, defaultView]);
  
  // Profile State
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  
  // Camera/Image State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.profile_picture]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  // Appearance State
  const [theme, setTheme] = useState('light');
  const [reduceMotion, setReduceMotion] = useState('system');

  // Notifications State
  const [loanRemindersOn, setLoanRemindersOn] = useState(true);
  const [reminderWindow, setReminderWindow] = useState(5);

  // Security State
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passMsg, setPassMsg] = useState('');
  const [securityHistory, setSecurityHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      });
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && view === 'appearance') {
      fetchApi('/user/preferences/').then(res => {
        setTheme(res.theme || 'light');
        setReduceMotion(res.reduce_motion || 'system');
      }).catch(() => {});
    }
    if (isOpen && view === 'notifications') {
      fetchApi('/user/preferences/').then(res => {
        setLoanRemindersOn(res.loan_reminders_on !== false);
        setReminderWindow(res.reminder_window || 5);
      }).catch(() => {});
    }
    if (isOpen && view === 'security') {
      fetchApi('/user/security-history/').then(res => {
        setSecurityHistory(res.history || []);
      }).catch(() => {});
    }
  }, [isOpen, view]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert('Camera access denied or unavailable.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            setCapturedBlob(blob);
            setPreviewImage(URL.createObjectURL(blob));
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setCapturedBlob(file);
        setPreviewImage(URL.createObjectURL(file));
      } else {
        alert('Please select an image file (JPEG, PNG, WebP).');
      }
    }
  };

  const uploadProfilePicture = async () => {
    if (!capturedBlob) return;
    const formData = new FormData();
    formData.append('profile_picture', capturedBlob, 'avatar.jpg');
    try {
      await fetchApi('/user/me/', {
        method: 'POST',
        body: formData,
        // Let browser set Content-Type with boundary
      });
      await checkAuth();
      setPreviewImage(null);
      setCapturedBlob(null);
      setProfileMsg('Profile picture updated!');
    } catch (err: any) {
      setProfileMsg(err.message || 'Error updating picture');
    }
  };

  const saveProfile = async () => {
    try {
      await fetchApi('/user/me/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      await checkAuth();
      setProfileMsg('Profile updated successfully!');
    } catch (err: any) {
      setProfileMsg(err.message || 'Error updating profile');
    }
  };

  const savePreferences = async (updates: any) => {
    try {
      await fetchApi('/user/preferences/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error('Failed to save preferences');
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    savePreferences({ theme: newTheme });
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg('');
    try {
      await fetchApi('/user/password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm)
      });
      setPassMsg('Password changed successfully.');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPassMsg(err.message || 'Error changing password.');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-navy-900/40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      <motion.div
        className={cx(
          "flex flex-col shrink-0 border-r border-navy-100 bg-canvas transition-all duration-300 z-50 overflow-hidden",
          isOpen ? "fixed inset-y-0 left-0 w-[86%] max-w-sm shadow-xl lg:static lg:w-80 lg:shadow-none" : "static w-16"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-navy-100 px-4 lg:h-[72px] lg:px-4">
          {isOpen && (
            view === 'menu' ? (
              <h2 className="text-lg font-bold text-navy-900 whitespace-nowrap">Settings</h2>
            ) : (
              <button 
                onClick={() => { setView('menu'); stopCamera(); setPreviewImage(null); }}
                className="flex items-center gap-2 text-sm font-semibold text-navy-600 hover:text-navy-900 whitespace-nowrap"
              >
                <ChevronLeftIcon size={18} /> Back
              </button>
            )
          )}
          <button 
            onClick={onToggle}
            aria-label="Toggle Settings sidebar"
            className={cx(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-navy-500 transition-colors hover:bg-navy-50 hover:text-navy-900",
              !isOpen && "mx-auto"
            )}
          >
            <MenuIcon size={22} />
          </button>
        </div>

        <div className={cx("flex-1 overflow-y-auto overflow-x-hidden", isOpen ? "p-4 lg:p-6" : "p-0")}>
          <AnimatePresence mode="wait">
            {isOpen && (
              <>
                {view === 'menu' && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-1"
                  >
                    <MenuButton icon={UserIcon} label="Profile" onClick={() => setView('profile')} />
                    <MenuButton icon={PaletteIcon} label="Appearance" onClick={() => setView('appearance')} />
                    <MenuButton icon={BellIcon} label="Notifications" onClick={() => setView('notifications')} />
                    <MenuButton icon={ShieldIcon} label="Security" onClick={() => setView('security')} />
                  </motion.div>
                )}

                {view === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex flex-col space-y-6"
                  >
                    <h3 className="font-display text-xl font-bold text-navy-900">Profile</h3>
                    
                    <div className="flex flex-col items-center gap-4">
                      {showCamera ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={capturePhoto}>Capture Photo</Button>
                            <Button variant="secondary" size="sm" onClick={stopCamera}>Cancel</Button>
                          </div>
                        </div>
                      ) : previewImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={previewImage} alt="Preview" className="h-24 w-24 rounded-full object-cover border-2 border-navy-200" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={uploadProfilePicture}>Use Photo</Button>
                            <Button variant="secondary" size="sm" onClick={() => { setPreviewImage(null); setCapturedBlob(null); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-navy-100 text-3xl font-bold text-navy-700 overflow-hidden cursor-pointer">
                            {user?.profile_picture && !imgError ? (
                              <img src={user.profile_picture} alt="" onError={() => setImgError(true)} className="h-full w-full object-cover" />
                            ) : (
                              user?.first_name ? user.first_name[0].toUpperCase() : user?.username?.[0]?.toUpperCase()
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <CameraIcon className="text-white" size={24} aria-label="Change profile picture" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="file" 
                              accept="image/jpeg,image/png,image/webp" 
                              className="hidden" 
                              ref={fileInputRef} 
                              onChange={handleFileUpload} 
                            />
                            <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                              <UploadIcon size={16} /> Upload
                            </Button>
                            <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={startCamera}>
                              <CameraIcon size={16} /> Capture
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-4">
                      {profileMsg && <div className="text-sm text-coral-600 font-semibold">{profileMsg}</div>}
                      <div>
                        <label className="block text-sm font-semibold text-navy-900">Username</label>
                        <input 
                          type="text" 
                          className="mt-1 block w-full rounded-xl border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500" 
                          value={profileForm.username} 
                          onChange={e => setProfileForm({...profileForm, username: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-navy-900">Email</label>
                        <input 
                          type="email" 
                          className="mt-1 block w-full rounded-xl border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500" 
                          value={profileForm.email}
                          onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-navy-900">First Name</label>
                          <input 
                            type="text" 
                            className="mt-1 block w-full rounded-xl border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500" 
                            value={profileForm.first_name}
                            onChange={e => setProfileForm({...profileForm, first_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-navy-900">Last Name</label>
                          <input 
                            type="text" 
                            className="mt-1 block w-full rounded-xl border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500" 
                            value={profileForm.last_name}
                            onChange={e => setProfileForm({...profileForm, last_name: e.target.value})}
                          />
                        </div>
                      </div>
                      <Button className="w-full mt-2" onClick={saveProfile}>Save Changes</Button>
                    </div>
                  </motion.div>
                )}

                {view === 'appearance' && (
                  <motion.div key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <h3 className="font-display text-xl font-bold text-navy-900 mb-6">Appearance</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-navy-900 mb-2">Theme</label>
                        <select 
                          className="block w-full rounded-xl border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500"
                          value={theme}
                          onChange={e => handleThemeChange(e.target.value)}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-navy-900 mb-2">Reduce Motion</label>
                        <select 
                          className="block w-full rounded-xl border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500"
                          value={reduceMotion}
                          onChange={e => { setReduceMotion(e.target.value); savePreferences({ reduce_motion: e.target.value }); }}
                        >
                          <option value="system">System</option>
                          <option value="on">On</option>
                          <option value="off">Off</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === 'notifications' && (
                  <motion.div key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <h3 className="font-display text-xl font-bold text-navy-900 mb-6">Notifications</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-navy-900">Loan Payment Reminders</p>
                          <p className="text-sm text-navy-500">Show in-app reminders for upcoming payments</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input type="checkbox" className="peer sr-only" checked={loanRemindersOn} onChange={e => {
                            setLoanRemindersOn(e.target.checked);
                            savePreferences({ loan_reminders_on: e.target.checked });
                          }} />
                          <div className="h-6 w-11 rounded-full bg-navy-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-coral-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300"></div>
                        </label>
                      </div>
                      
                      {loanRemindersOn && (
                        <div>
                          <label className="block text-sm font-semibold text-navy-900 mb-2">Reminder Window</label>
                          <select 
                            className="block w-full rounded-xl border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500"
                            value={reminderWindow}
                            onChange={e => {
                              setReminderWindow(parseInt(e.target.value, 10));
                              savePreferences({ reminder_window: parseInt(e.target.value, 10) });
                            }}
                          >
                            <option value={1}>1 day before</option>
                            <option value={3}>3 days before</option>
                            <option value={5}>5 days before</option>
                            <option value={7}>7 days before</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {view === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <h3 className="font-display text-xl font-bold text-navy-900 mb-6">Security</h3>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4 mb-8">
                      <h4 className="font-semibold text-navy-900">Change Password</h4>
                      {passMsg && <div className="text-sm font-semibold text-coral-600">{passMsg}</div>}
                      <div>
                        <label className="block text-sm font-semibold text-navy-900">Current Password</label>
                        <input 
                          type="password" required
                          className="mt-1 block w-full rounded-xl border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500" 
                          value={passwordForm.current_password} onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-navy-900">New Password</label>
                        <input 
                          type="password" required
                          className="mt-1 block w-full rounded-xl border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500" 
                          value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-navy-900">Confirm New Password</label>
                        <input 
                          type="password" required
                          className="mt-1 block w-full rounded-xl border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500" 
                          value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                        />
                      </div>
                      <Button type="submit" className="w-full">Change Password</Button>
                    </form>

                    <div>
                      <h4 className="font-semibold text-navy-900 mb-4">Security History</h4>
                      <div className="space-y-3">
                        {securityHistory.length === 0 ? (
                          <p className="text-sm text-navy-500">No recent security events.</p>
                        ) : (
                          securityHistory.map((event, i) => (
                            <div key={i} className="flex justify-between items-start text-sm border-b border-navy-100 pb-2">
                              <div>
                                <p className="font-medium text-navy-900">{event.event_type}</p>
                                <p className="text-navy-500 text-xs">{new Date(event.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      {isOpen && <div className="w-16 shrink-0 lg:hidden" aria-hidden="true" />}
    </>
  );
}

function MenuButton({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-navy-50"
    >
      <Icon size={20} className="text-navy-500" />
      <span className="font-semibold text-navy-900">{label}</span>
    </button>
  );
}
