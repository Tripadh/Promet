import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/ui/Sidebar';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth <= 960);

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

  return (
    <div className={`app-layout${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
      {isMobileViewport && !isSidebarOpen ? (
        <button
          type="button"
          className="mobile-sidebar-open-btn"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
        </button>
      ) : null}

      {isMobileViewport && isSidebarOpen ? (
        <button
          type="button"
          className="mobile-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="main-content">
        <div className="settings-page">
          <header className="settings-header">
            <h1>Settings</h1>
          </header>

          <div className="settings-content">
            <div className="settings-sidebar">
              <div className="settings-card profile-summary-card">
                <div className="profile-avatar">
                  <span>{initial}</span>
                </div>
                <h2>{username}</h2>
                <p className="profile-email">{email}</p>
                <div className="profile-badge">Free</div>
                <button className="set-title-btn">
                  🏆 Set title
                </button>

                <div className="credits-section">
                  <div className="credits-header">
                    <span>Credits</span>
                    <span className="status-active"><span className="dot"></span> Active</span>
                  </div>
                  <div className="credits-amount">
                    <strong>6</strong> remaining
                  </div>
                  <div className="credits-subtext">1 daily + 5 bonus</div>
                </div>

                <div className="model-usage-section">
                  <div className="model-usage-header">Model Usage</div>
                  <div className="model-row">
                    <span className="model-name"><span className="dot primer"></span> Primer</span>
                    <span className="model-count">0</span>
                  </div>
                  <div className="model-row">
                    <span className="model-name"><span className="dot amplifier"></span> AI Amplifier</span>
                    <span className="model-count">0</span>
                  </div>
                  <div className="model-row">
                    <span className="model-name"><span className="dot mastermind"></span> Mastermind</span>
                    <span className="model-count">2</span>
                  </div>
                  <div className="model-row total">
                    <span>Total</span>
                    <span>2</span>
                  </div>
                </div>
              </div>

              <div className="settings-card shortcuts-card">
                <h3>⌨️ Shortcuts</h3>
                <div className="shortcut-row">
                  <span>Toggle Sidebar</span>
                  <kbd>Ctrl+B</kbd>
                </div>
              </div>
            </div>

            <div className="settings-main-panel">
              <div className="settings-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  👤 Profile
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('billing')}
                >
                  💳 Billing
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'context' ? 'active' : ''}`}
                  onClick={() => setActiveTab('context')}
                >
                  📄 Context
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'customize' ? 'active' : ''}`}
                  onClick={() => setActiveTab('customize')}
                >
                  🎨 Customize
                </button>
              </div>

              {activeTab === 'profile' && (
                <div className="tab-pane">
                  <div className="settings-card">
                    <h3>Profile Settings</h3>
                    <div className="form-group-row">
                      <div className="form-group">
                        <label>Username</label>
                        <input type="text" defaultValue={username} />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" defaultValue={email} disabled />
                        <span className="help-text">Cannot be changed</span>
                      </div>
                    </div>
                  </div>

                  <div className="settings-card">
                    <h3>🔒 Change Password</h3>
                    <div className="google-auth-box">
                      <div className="google-logo">G</div>
                      <div className="google-auth-text">
                        <h4>Password Managed by Google</h4>
                        <p>Managed through your Google Account</p>
                        <button className="google-change-btn">
                          ↗️ Change on Google
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="settings-card danger-card">
                    <div className="danger-content">
                      <div>
                        <h3>Delete Account</h3>
                        <p>Permanently delete your account and all data</p>
                      </div>
                      <button className="delete-btn">
                        🗑️ Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;