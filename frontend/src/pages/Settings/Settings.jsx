import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { PromptContext } from '../../context/PromptContext';
import { promptService } from '../../services/promptService';
import Sidebar from '../../components/ui/Sidebar';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { deleteAllChats } = useContext(PromptContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth <= 960);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [usageSummary, setUsageSummary] = useState({
    month: null,
    quick: 0,
    balanced: 0,
    auto: 0,
    expert: 0,
    totalPrompts: 0,
  });

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
                    <span className="credits-title">Monthly Activity</span>
                    <span className="credits-ratio">{usageMonthLabel}</span>
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
                  <div className="credits-subtext">Based on prompts generated this month.</div>
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
                  className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('billing')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  Billing
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
                        <button className="secondary-btn">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="tab-pane">
                  <section className="settings-card">
                    <div className="card-header">
                      <h3>Billing & Subscription</h3>
                    </div>
                    
                    <div className="billing-status">
                      <div className="billing-current">
                        <div className="plan-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div className="plan-details">
                          <h4>Free <span className="plan-badge">Active</span></h4>
                          <p>Limited daily prompts</p>
                        </div>
                      </div>
                      <button className="primary-brand-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16M22 4v16M4 8l8 4 8-4M12 12v8"/></svg>
                        Upgrade to Pro
                      </button>
                    </div>

                    <div className="upgrade-grid">
                      <div className="upgrade-pricing">
                        <h4>Upgrade to Pro</h4>
                        <div className="price">$9.99/month</div>
                        <p className="billing-cycle">Cancel anytime</p>
                        <button className="primary-brand-btn upgrade-btn-full">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 12 11 21 6"></polygon><path d="M3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6"></path><path d="M12 11v11"></path></svg>
                          Upgrade Now
                        </button>
                      </div>

                      <div className="upgrade-features">
                        <div className="feature-card">
                          <h5>
                            <svg className="feature-icon-orange" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            Unlimited Prompts
                          </h5>
                          <p>Generate as many as you need</p>
                        </div>
                        <div className="feature-card">
                          <h5>
                            <svg className="feature-icon-orange" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16M22 4v16M4 8l8 4 8-4M12 12v8"/></svg>
                            Premium AI Models
                          </h5>
                          <p>Claude, GPT-4, Gemini & more</p>
                        </div>
                        <div className="feature-card">
                          <h5>
                            <svg className="feature-icon-orange" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Save & Organize
                          </h5>
                          <p>Create prompt libraries</p>
                        </div>
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

      {showDeleteConfirm && (
        <div className="confirm-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-modal-card" onClick={e => e.stopPropagation()}>
            <h3>Delete all chats?</h3>
            <p>
              Are you sure you want to delete <strong>all your chats</strong>? This action cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button type="button" className="confirm-modal-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="confirm-modal-delete" onClick={confirmDeleteAllChats}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;