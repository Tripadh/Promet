import React, { useState, useEffect, useContext, useRef, useLayoutEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { PromptContext } from '../../context/PromptContext';
import { promptService } from '../../services/promptService';
import Sidebar from '../../components/ui/Sidebar';
import { useLocation } from 'react-router-dom';
import './Settings.css';

// FIX: Narrow unknown errors safely for strict TS/checkJs.
/** @param {unknown} error */
const getErrorMessage = (error) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

const Settings = () => {
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  // FIX: Guard nullable context value before destructuring to satisfy strict null checks.
  const promptContext = useContext(PromptContext);
  if (!promptContext) {
    throw new Error('Settings must be used within PromptProvider');
  }
  const { deleteAllChats } = promptContext;
  const [activeTab, setActiveTab] = useState('profile');
  // FIX: Keep sidebar closed by default on mobile to avoid initial body scroll lock.
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 960);
  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth <= 960);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [usageSummary, setUsageSummary] = useState({
    month: null,
    quick: 0,
    balanced: 0,
    auto: 0,
    expert: 0,
    totalPrompts: 0,
    dailyCount: 0,
  });

  const [showAccountDeleteModal, setShowAccountDeleteModal] = useState(false);
  const [deleteAccountStep, setDeleteAccountStep] = useState('confirm');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  // FIX: Type ref target so scrollTo/scrollTop are available.
  const mainContentRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 960;
      setIsMobileViewport(isMobile);
      if (isMobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // FIX: Lock both body and html only while mobile drawer is open, then restore exactly.
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const shouldLockScroll = isMobileViewport && isSidebarOpen;

    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isMobileViewport, isSidebarOpen]);

  useEffect(() => {
    let mounted = true;

    const fetchUsageSummary = async () => {
      try {
        const summary = await promptService.getMonthlyUsageSummary();
        if (!mounted) return;

        setUsageSummary({
          month: summary?.month || null,
          quick: summary?.byMode?.quick || 0,
          balanced: summary?.byMode?.balanced || 0,
          auto: summary?.byMode?.auto || 0,
          expert: summary?.byMode?.expert || 0,
          totalPrompts: summary?.totalPrompts || 0,
          dailyCount: summary?.dailyCount || 0,
        });
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to fetch monthly usage summary:', error);
      }
    };

    fetchUsageSummary();

    return () => {
      mounted = false;
    };
  }, []);

  useLayoutEffect(() => {
    const resetScrollPosition = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        mainContentRef.current.scrollTop = 0;
      }

      // FIX: querySelector returns Element; narrow to HTMLElement for scroll APIs.
      const settingsScroller = /** @type {HTMLElement | null} */ (document.querySelector('.settings-main-content'));
      if (settingsScroller) {
        settingsScroller.scrollTop = 0;
      }
    };

    // Run immediately, then re-assert after layout settles.
    resetScrollPosition();
    const rafId = requestAnimationFrame(resetScrollPosition);
    const timerId = setTimeout(resetScrollPosition, 120);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [location.key]);

  const username = user?.name || user?.username || 'Tripadh';
  const email = user?.email || 'vtripadh@gmail.com';
  const initial = username.charAt(0).toUpperCase();

  const usageMonthLabel = usageSummary.month
    ? new Date(usageSummary.month).toLocaleString([], { month: 'long', year: 'numeric' })
    : 'This month';

  const modeStats = [
    { label: 'Quick', value: usageSummary.quick },
    { label: 'Balanced', value: usageSummary.balanced },
    { label: 'Auto', value: usageSummary.auto },
    { label: 'Expert', value: usageSummary.expert },
  ];

  const topModeEntry = [...modeStats].sort((a, b) => b.value - a.value)[0];
  const topModeLabel = topModeEntry && topModeEntry.value > 0 ? topModeEntry.label : 'None yet';
  const activeModesCount = modeStats.filter((mode) => mode.value > 0).length;
  const avgPerDay = (usageSummary.totalPrompts / Math.max(new Date().getDate(), 1)).toFixed(1);

  const handleDeleteAllChats = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAllChats = async () => {
    const success = await deleteAllChats();
    setShowDeleteConfirm(false);
    
    if (success) {
      // Optional: non-intrusive notification instead of alert, or just let it passively succeed
      console.log("All chats have been deleted.");
    } else {
      alert("Failed to delete chats. Please try again.");
    }
  };

  return (
    <>
      <div className={`app-layout settings-layout${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <div className="app-body settings-body">
        {isMobileViewport && isSidebarOpen && (
          <button
            type="button"
            className="mobile-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} onBeforeHistoryLoad={() => Promise.resolve(true)} />

        <div ref={mainContentRef} className="settings-main-content padding-container settings-main-container">
        <div className="settings-page">
          <header className="settings-header">
            {isMobileViewport && (
              <button
                type="button"
                className="mobile-hamburger-btn"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            )}
            <div>
              <h1>Settings</h1>
              <p className="settings-subtitle">Manage your account settings and preferences.</p>
            </div>
          </header>

          <div className="settings-content">
            {/* LEFT COLUMN: User Profile Card */}
            <aside className="settings-sidebar">
              <div className="settings-card profile-summary-card">
                <div className="profile-header-group">
                  <div className="profile-avatar">
                    {initial}
                  </div>
                  <div className="profile-info-text">
                    <h2>{username}</h2>
                    <p className="profile-email">{email}</p>
                  </div>
                </div>

                <div className="credits-section-premium">
                  <div className="credits-premium-header">
                    <span className="credits-premium-title">Credits</span>
                    <span className="credits-premium-status">
                      <span className="status-dot-active" /> Active
                    </span>
                  </div>
                  
                  <div className="credits-premium-main">
                    <span className="credits-remaining-num">{Math.max(0, 25 - usageSummary.dailyCount)}</span>
                    <span className="credits-total">/ 25</span>
                    <span className="credits-remaining-text">remaining</span>
                  </div>
                  
                  <div className="credits-premium-footer">
                    25 daily limit
                  </div>
                </div>

                <div className="credits-section" style={{ borderTop: 'none', paddingTop: '0' }}>
                  <div className="credits-header">
                    <span className="credits-title" style={{ fontSize: '12px', opacity: 0.6 }}>Monthly Activity</span>
                  </div>
                  <div className="activity-stats-grid">
                    <div className="activity-stat-card">
                      <span className="activity-stat-label">Top Mode</span>
                      <span className="activity-stat-value">{topModeLabel}</span>
                    </div>
                    <div className="activity-stat-card">
                      <span className="activity-stat-label">Active Modes</span>
                      <span className="activity-stat-value">{activeModesCount}</span>
                    </div>
                    <div className="activity-stat-card">
                      <span className="activity-stat-label">Avg / Day</span>
                      <span className="activity-stat-value">{avgPerDay}</span>
                    </div>
                  </div>
                </div>

                <div className="model-usage-section">
                  <div className="model-usage-header">Monthly Prompts Usage</div>
                  
                  <div className="model-usage-item">
                    <div className="model-usage-info">
                      <span className="dot quick" />
                      <span className="model-name">Quick</span>
                    </div>
                    <span className="model-count">{usageSummary.quick}</span>
                  </div>

                  <div className="model-usage-item">
                    <div className="model-usage-info">
                      <span className="dot balanced" />
                      <span className="model-name">Balanced</span>
                    </div>
                    <span className="model-count">{usageSummary.balanced}</span>
                  </div>
                  
                  <div className="model-usage-item">
                    <div className="model-usage-info">
                      <span className="dot auto" />
                      <span className="model-name">Auto</span>
                    </div>
                    <span className="model-count">{usageSummary.auto}</span>
                  </div>

                  <div className="model-usage-item">
                    <div className="model-usage-info">
                      <span className="dot expert" />
                      <span className="model-name">Expert</span>
                    </div>
                    <span className="model-count">{usageSummary.expert}</span>
                  </div>
                  
                  <div className="model-usage-total">
                    <span>Total Prompts Generated</span>
                    <span className="total-highlight">{usageSummary.totalPrompts}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* RIGHT COLUMN: Settings Panels */}
            <main className="settings-main-panel">
              <nav className="settings-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'customize' ? 'active' : ''}`}
                  onClick={() => setActiveTab('customize')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                  Customize
                </button>
              </nav>

              {activeTab === 'profile' && (
                <div className="tab-pane">
                  {/* General Profile Settings */}
                  <section className="settings-card">
                    <div className="card-header">
                      <h3>Profile Identity</h3>
                      <p>Update your basic profile information.</p>
                    </div>
                    
                    <div className="form-group-row">
                      <div className="form-group">
                        <label>Username</label>
                        <input type="text" defaultValue={username} />
                        <span className="help-text">Your public display name.</span>
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" defaultValue={email} disabled />
                        <span className="help-text">Email cannot be changed directly.</span>
                      </div>
                    </div>
                  </section>

                  {/* Clear History Settings */}
                  <section className="settings-card">
                    <div className="card-header password-header">
                      <div className="header-text">
                        <h3>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                          Delete All Chats
                        </h3>
                        <p>Clear your entire conversation history.</p>
                      </div>
                      <div className="header-action">
                        <button className="secondary-btn" onClick={handleDeleteAllChats}>Clear History</button>
                      </div>
                    </div>
                  </section>

                  {/* Danger Zone */}
                  <section className="settings-card">
                    <div className="card-header password-header">
                      <div className="header-text">
                        <h3>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                          Danger Zone
                        </h3>
                        <p>Permanently delete your account and all associated data. This action is irreversible.</p>
                      </div>
                      <div className="header-action">
                        <button 
                          className="secondary-btn"
                          onClick={() => {
                            setShowAccountDeleteModal(true);
                            setDeleteAccountStep('confirm');
                            setDeleteOtp('');
                            setDeleteAccountError('');
                          }}
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'customize' && (
                <div className="tab-pane">
                  <section className="settings-card">
                    <div className="card-header">
                      <h3>Customization & Preferences</h3>
                    </div>
                    
                    {/* Appearance */}
                    <div className="settings-section">
                      <h4 className="section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="section-icon"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                        Appearance
                      </h4>
                      
                      <div className="settings-list">
                        <div className="setting-item">
                          <div className="setting-info">
                            <div className="setting-label">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="item-icon"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                              <span>Light Mode</span>
                            </div>
                            <span className="setting-description">Light color scheme</span>
                          </div>
                          <div className="setting-action">
                            <label className="toggle-switch">
                              <input className="checkbox" type="checkbox" checked={theme === 'light'} onChange={toggleTheme} />
                              <span className="slider toggle-slider"></span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interface */}
                    <div className="settings-section">
                      <h4 className="section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="section-icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        Interface
                      </h4>
                      
                      <div className="settings-list">
                        <div className="setting-item">
                          <div className="setting-info">
                            <div className="setting-label">
                              <span>Beta Features</span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            </div>
                            <span className="setting-description">Early access to experimental features</span>
                          </div>
                          <div className="setting-action">
                            <label className="toggle-switch">
                              <input className="checkbox" type="checkbox" defaultChecked />
                              <span className="slider toggle-slider"></span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      </div>
      </div>

      {showDeleteConfirm && (
        <div className="settings-confirm-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="settings-confirm-modal-card" onClick={e => e.stopPropagation()}>
            <h3>Delete all chats?</h3>
            <p>
              Are you sure you want to delete <strong>all your chats</strong>? This action cannot be undone.
            </p>
            <div className="settings-confirm-modal-actions">
              <button type="button" className="settings-confirm-modal-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="settings-confirm-modal-delete" onClick={confirmDeleteAllChats}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccountDeleteModal && (
        <div className="settings-confirm-modal-overlay" onClick={() => !isDeletingLoading && setShowAccountDeleteModal(false)}>
          <div className="settings-confirm-modal-card" onClick={e => e.stopPropagation()}>
            <h3>Delete Account</h3>
            
            {deleteAccountError && (
              <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '15px' }}>{deleteAccountError}</div>
            )}

            {deleteAccountStep === 'confirm' ? (
              <>
                <p>
                  Permanently delete your account and all associated data. This action is irreversible.
                </p>
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#a1a1aa' }}>
                  We will send a 6-digit verification code to <strong>{email}</strong> to confirm your identity.
                </p>
                <div className="settings-confirm-modal-actions">
                  <button 
                    type="button" 
                    className="settings-confirm-modal-cancel" 
                    onClick={() => setShowAccountDeleteModal(false)}
                    disabled={isDeletingLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="settings-confirm-modal-delete" 
                    onClick={async () => {
                      try {
                        setIsDeletingLoading(true);
                        setDeleteAccountError('');
                        const res = await api.post('/auth/delete-account/send-otp');
                        const data = res.data;
                        
                        setDeleteAccountStep('otp');
                      } catch (err) {
                        setDeleteAccountError(getErrorMessage(err));
                      } finally {
                        setIsDeletingLoading(false);
                      }
                    }}
                    disabled={isDeletingLoading}
                  >
                    {isDeletingLoading ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Enter the 6-digit code sent to your email to confirm deletion.</p>
                
                <div className="form-group" style={{ marginTop: '15px', marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={isDeletingLoading}
                    style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem', padding: '10px', width: '100%', backgroundColor: '#18181b', color: '#fff', border: '1px solid #3f3f46', borderRadius: '4px' }}
                  />
                </div>

                <div className="settings-confirm-modal-actions">
                  <button 
                    type="button" 
                    className="settings-confirm-modal-cancel" 
                    onClick={() => setShowAccountDeleteModal(false)}
                    disabled={isDeletingLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="settings-confirm-modal-delete" 
                    onClick={async () => {
                      if (deleteOtp.length !== 6) {
                        setDeleteAccountError('Please enter a valid 6-digit OTP');
                        return;
                      }
                      
                      try {
                        setIsDeletingLoading(true);
                        setDeleteAccountError('');
                        
                        const res = await api.delete('/auth/delete-account', {
                          data: { otp: deleteOtp }
                        });
                        
                        const data = res.data;
                        
                        setShowAccountDeleteModal(false);
                        logout();
                      } catch (err) {
                        setDeleteAccountError(getErrorMessage(err));
                      } finally {
                        setIsDeletingLoading(false);
                      }
                    }}
                    disabled={isDeletingLoading || deleteOtp.length !== 6}
                  >
                    {isDeletingLoading ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;