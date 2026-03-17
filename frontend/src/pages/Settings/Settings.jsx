import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/ui/Sidebar';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth <= 960);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  const username = user?.name || user?.username || 'Tripadh';
  const email = user?.email || 'vtripadh@gmail.com';
  const initial = username.charAt(0).toUpperCase();

  // Mocked credit values
  const totalCredits = 6;
  const maxCredits = 10;
  const creditPercentage = (totalCredits / maxCredits) * 100;

  return (
    <div className={`app-layout${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
      {isMobileViewport && !isSidebarOpen && (
        <button
          type="button"
          className="mobile-sidebar-open-btn"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
        </button>
      )}

      {isMobileViewport && isSidebarOpen && (
        <button
          type="button"
          className="mobile-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="main-content padding-container">
        <div className="settings-page">
          <header className="settings-header">
            <h1>Settings</h1>
            <p className="settings-subtitle">Manage your account settings and preferences.</p>
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
                    <span className="profile-badge">Free Plan</span>
                  </div>
                </div>

                <div className="credits-section">
                  <div className="credits-header">
                    <span className="credits-title">Credits Usage</span>
                    <span className="credits-ratio">{totalCredits} / {maxCredits}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${creditPercentage}%` }}
                    />
                  </div>
                  <div className="credits-subtext">1 daily + 5 bonus active</div>
                </div>

                <div className="model-usage-section">
                  <div className="model-usage-header">Monthly Model Usage</div>
                  
                  <div className="model-usage-item">
                    <div className="model-usage-info">
                      <span className="dot primer" />
                      <span className="model-name">Primer</span>
                    </div>
                    <span className="model-count">0</span>
                  </div>

                  <div className="model-usage-item">
                    <div className="model-usage-info">
                      <span className="dot amplifier" />
                      <span className="model-name">AI Amplifier</span>
                    </div>
                    <span className="model-count">0</span>
                  </div>

                  <div className="model-usage-item">
                    <div className="model-usage-info">
                      <span className="dot mastermind" />
                      <span className="model-name">Mastermind</span>
                    </div>
                    <span className="model-count">2</span>
                  </div>
                  
                  <div className="model-usage-total">
                    <span>Total Generates</span>
                    <span className="total-highlight">2</span>
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
                  className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('billing')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  Billing
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'context' ? 'active' : ''}`}
                  onClick={() => setActiveTab('context')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                  Context
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

                  {/* Security Settings */}
                  <section className="settings-card password-card">
                    <div className="card-header password-header">
                      <div className="header-text">
                        <h3>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          Security & Password
                        </h3>
                        <p>Change your account password.</p>
                      </div>
                      <div className="header-action">
                        {!isChangingPassword ? (
                          <button className="secondary-btn" onClick={() => setIsChangingPassword(true)}>Change Password</button>
                        ) : (
                          <button className="secondary-btn" onClick={() => setIsChangingPassword(false)}>Cancel</button>
                        )}
                      </div>
                    </div>

                    {isChangingPassword && (
                      <div className="password-form fade-in">
                        <div className="form-group">
                          <label>Current password</label>
                          <div className="input-with-icon">
                            <input type="password" placeholder="Enter current password" />
                            <button className="eye-btn" aria-label="Toggle visibility">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>New password</label>
                          <div className="input-with-icon">
                            <input type="password" placeholder="At least 8 characters" />
                            <button className="eye-btn" aria-label="Toggle visibility">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Confirm new password</label>
                          <div className="input-with-icon">
                            <input type="password" placeholder="Repeat new password" />
                            <button className="eye-btn" aria-label="Toggle visibility">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                          </div>
                        </div>
                        <div className="form-actions">
                          <button className="primary-btn">
                            Update Password
                          </button>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Danger Zone */}
                  <section className="settings-card danger-card">
                    <div className="danger-content">
                      <div className="danger-text">
                        <h3>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                          Danger Zone
                        </h3>
                        <p>Permanently delete your account and all associated data. This action is irreversible.</p>
                      </div>
                      <div className="danger-action">
                        <button className="delete-btn">
                          Delete Account
                        </button>
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
  );
};

export default Settings;