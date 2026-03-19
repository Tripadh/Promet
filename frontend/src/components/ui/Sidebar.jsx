import './Sidebar.css';
import React, { useEffect, useRef, useState } from 'react';
import { usePrompt } from '../../hooks/usePrompt';
import { useAuth } from '../../hooks/useAuth';
import { promptService } from '../../services/promptService';
import { useTransitionLoader } from '../../context/TransitionContext';
import './SidebarAccountMenu.css';
import { useNavigate } from 'react-router-dom';

const SIDEBAR_ACCOUNT_MENU_ITEMS = [
  { id: 'settings', label: 'Settings' },
  { id: 'help', label: 'Get help' },
  { id: 'divider-1', divider: true },
  { id: 'upgrade', label: 'Upgrade plan' },
  { id: 'divider-2', divider: true },
  { id: 'logout', label: 'Log out', danger: true },
];

const HELP_LINKS = [
  {
    id: 'help-center',
    label: 'Help center',
    href: 'https://github.com/Tripadh/Promet#readme',
  },
  {
    id: 'release-notes',
    label: 'Release notes',
    href: 'https://github.com/Tripadh/Promet/releases',
  },
  {
    id: 'terms-policies',
    label: 'Terms & policies',
    href: 'https://github.com/Tripadh/Promet',
  },
  {
    id: 'report-bug',
    label: 'Report a bug',
    href: 'https://github.com/Tripadh/Promet/issues/new',
  },
];

const Sidebar = ({ isOpen, onToggle, onBeforeHistoryLoad }) => {
  const { token, user, logout } = useAuth();
  const { loadHistoryItem, clearPrompt, historyRefreshTrigger } = usePrompt();
  const { withTransition, showFor } = useTransitionLoader();
  const navigate = useNavigate();
  
  const [prompts, setPrompts] = useState([]);
  const [pinnedPrompts, setPinnedPrompts] = useState([]);
  const [favoritePrompts, setFavoritePrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [promptToDelete, setPromptToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);
  const searchInputRef = useRef(null);

  const fetchHistory = async (page = 1) => {
    if (!token) return;
    try {
      setLoading(true);
      const [historyData, pinnedData, favoriteData] = await Promise.all([
        promptService.getHistory(page),
        promptService.getPinned(),
        promptService.getFavorites()
      ]);
      
      setPrompts(historyData.prompts || []);
      setTotalPages(historyData.totalPages || 1);
      setCurrentPage(historyData.page || page);
      setPinnedPrompts(pinnedData || []);
      setFavoritePrompts(favoriteData || []);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(currentPage);
  }, [token, currentPage]);

  // Immediately refresh history and bound back to page 1 when an AI stream completes
  useEffect(() => {
    if (historyRefreshTrigger > 0) {
      if (currentPage !== 1) {
        setCurrentPage(1); // Changing this triggers the above useEffect
      } else {
        fetchHistory(1);
      }
    }
  }, [historyRefreshTrigger]);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
      setIsAccountMenuOpen(false);
      setIsHelpMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!promptToDelete) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setPromptToDelete(null);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [promptToDelete]);

  useEffect(() => {
    if (!isOpen || !shouldFocusSearch) {
      return;
    }

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
      setShouldFocusSearch(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, shouldFocusSearch]);

  const closeSidebarOnMobile = () => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth <= 960 && isOpen) {
      onToggle?.();
    }
  };

  const handleNewPrompt = async () => {
    await withTransition(async () => {
      await fetchHistory(1);
      clearPrompt();
      navigate('/dashboard');
      closeSidebarOnMobile();
    }, 280);
  };

  const handleCollapsedSearch = () => {
    if (!isOpen) {
      setShouldFocusSearch(true);
      onToggle?.();
      return;
    }

    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  };

  const handleAccountMenuAction = (id) => {
    if (id === 'help') {
      setIsHelpMenuOpen((open) => !open);
      return;
    }

    setIsAccountMenuOpen(false);
    setIsHelpMenuOpen(false);

    if (id === 'logout') {
      logout();
      closeSidebarOnMobile();
    } else if (id === 'settings') {
      showFor(220);
      navigate('/settings');
      closeSidebarOnMobile();
    }
  };

  const handleDelete = async () => {
    if (!promptToDelete?._id) return;

    try {
      await promptService.deletePrompt(promptToDelete._id);
      fetchHistory(currentPage);
      setPromptToDelete(null);
    } catch (err) {
      alert("Failed to delete prompt");
    }
  };

  const handleToggleFavorite = async (e, id) => {
    e.stopPropagation();
    try {
      await promptService.toggleFavorite(id);
      fetchHistory(currentPage);
    } catch (err) {
      alert("Failed to update favorite");
    }
  };

  const handleTogglePin = async (e, id) => {
    e.stopPropagation();
    try {
      await promptService.togglePin(id);
      fetchHistory(currentPage);
    } catch (err) {
      alert("Failed to update pin");
    }
  };

  const renderPromptItem = (item, type) => {
    const menuKey = `${type}-${item._id}`;
    const isActive = activeMenuId === menuKey;

    return (
      <li 
        key={menuKey} 
        className={`history-item ${isActive ? 'active' : ''}`}
        title={item.originalPrompt}
        onClick={() => withTransition(async () => {
          const handled = await onBeforeHistoryLoad?.(item);
          if (handled) {
            closeSidebarOnMobile();
            return;
          }
          loadHistoryItem(item);
          navigate('/dashboard');
          closeSidebarOnMobile();
        }, 300)}
      >
        <span className="history-item-text">
          {item.pinned && <span style={{ marginRight: '6px' }} title="Pinned">📌</span>}
          {item.favorite && <span style={{ marginRight: '6px' }} title="Favorite">⭐</span>}
          {item.originalPrompt}
        </span>
        <div style={{ position: 'relative' }}>
          <button 
            className="options-btn"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(isActive ? null : menuKey);
            }}
            title="Options"
          >
            •••
          </button>
          
          {isActive && (
            <div className="dropdown-menu" style={{ 
              position: 'absolute', 
              top: '100%', 
              right: 0, 
              marginTop: '5px',
              z_index: 1000,
              minWidth: '140px' 
            }}>
              <button className="dropdown-item" onClick={(e) => handleTogglePin(e, item._id)}>
                <span style={{ fontSize: '16px' }}>{item.pinned ? '📍' : '📌'}</span>
                {item.pinned ? 'Unpin' : 'Pin to Top'}
              </button>
              <button className="dropdown-item" onClick={(e) => handleToggleFavorite(e, item._id)}>
                <span style={{ fontSize: '16px' }}>{item.favorite ? '💔' : '⭐'}</span>
                {item.favorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button 
                className="dropdown-item delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(null);
                  setPromptToDelete({
                    _id: item._id,
                    originalPrompt: item.originalPrompt,
                  });
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </li>
    );
  };

  const normalize = (value) => String(value || '').toLowerCase();
  const searchText = normalize(searchQuery).trim();
  const filterBySearch = (items) => {
    if (!searchText) return items;

    return items.filter((item) => {
      const searchableFields = [
        item?.originalPrompt,
        item?.improvedPrompt,
        item?.mode,
      ];

      return searchableFields.some((field) => normalize(field).includes(searchText));
    });
  };

  const filteredPinnedPrompts = filterBySearch(pinnedPrompts);
  const filteredFavoritePrompts = filterBySearch(favoritePrompts);
  const filteredRecentPrompts = filterBySearch(prompts);
  const displayEmail = user?.email || 'account@promet.ai';
  const displayName = user?.name || 'Account';

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-topbar">
          <div className="sidebar-brand" aria-label="Prompt Improver">
            <span className="sidebar-brand-mark" aria-hidden="true">P</span>
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={onToggle}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
              <path d="M10 4v16"></path>
            </svg>
          </button>
        </div>

        {isOpen ? (
          <>
            <button className="logout-btn" onClick={handleNewPrompt}>
              + New Prompts
            </button>

            <div className="sidebar-search-shell">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search chats"
                aria-label="Search chats"
              />
            </div>

            {filteredPinnedPrompts.length > 0 && (
              <>
                <h2 style={{ fontSize: '14px', marginTop: '20px', color: '#f9e2af' }}>📌 Pinned Prompts</h2>
                <ul className="history-list" style={{ overflow: 'visible' }}>
                  {filteredPinnedPrompts.map(item => renderPromptItem(item, 'pinned'))}
                </ul>
              </>
            )}

            {filteredFavoritePrompts.length > 0 && (
              <>
                <h2 style={{ fontSize: '14px', marginTop: '20px', color: '#fab387' }}>⭐ Favorite Prompts</h2>
                <ul className="history-list" style={{ overflow: 'visible' }}>
                  {filteredFavoritePrompts.map(item => renderPromptItem(item, 'favorite'))}
                </ul>
              </>
            )}

            <h2 style={{ fontSize: '14px', marginTop: '20px' }}>Recent</h2>
            
            {error && <div style={{ color: 'red', padding: '10px' }}>{error}</div>}
            
            <ul className="history-list">
              {loading && (
                <li className="history-item loading-state">
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line detail"></div>
                </li>
              )}
              {!loading && prompts.length === 0 && (
                <li className="history-item" style={{ color: '#8E8EA0' }}>No history yet</li>
              )}
              {!loading && prompts.length > 0 && filteredRecentPrompts.length === 0 && (
                <li className="history-item" style={{ color: '#8E8EA0' }}>No chats match your search</li>
              )}
              {!loading && filteredRecentPrompts.map(item => renderPromptItem(item, 'recent'))}
            </ul>

            {totalPages > 1 && (
              <div className="sidebar-controls">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: '12px', color: '#8E8EA0' }}>
                  {currentPage} / {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}

            <div className="sidebar-account-shell">
              {isAccountMenuOpen ? (
                <div className="sidebar-account-menu" onClick={(event) => event.stopPropagation()}>
                  <div className="sidebar-account-header">
                    <p>{displayEmail}</p>
                  </div>
                  <ul className="sidebar-account-menu-list">
                    {SIDEBAR_ACCOUNT_MENU_ITEMS.map((item) => {
                      if (item.divider) {
                        return <li key={item.id} className="sidebar-account-divider" />;
                      }

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`sidebar-account-item${item.danger ? ' danger' : ''}${item.id === 'help' && isHelpMenuOpen ? ' is-open' : ''}`}
                            onClick={() => handleAccountMenuAction(item.id)}
                          >
                            <span>{item.label}</span>
                            {item.id === 'help' ? (
                              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {isHelpMenuOpen ? (
                    <aside className="sidebar-account-sidepanel" aria-label="Help links">
                      <ul className="sidebar-account-sidepanel-list">
                        {HELP_LINKS.map((link) => (
                          <li key={link.id}>
                            <a
                              className="sidebar-account-subitem"
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                setIsAccountMenuOpen(false);
                                setIsHelpMenuOpen(false);
                                closeSidebarOnMobile();
                              }}
                            >
                              <span>{link.label}</span>
                              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v7h-7"/><path d="M3 10v11h11"/></svg>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </aside>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                className="sidebar-account-trigger"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsAccountMenuOpen((open) => {
                    if (open) {
                      setIsHelpMenuOpen(false);
                    }
                    return !open;
                  });
                }}
                aria-label="Open account menu"
                aria-expanded={isAccountMenuOpen}
              >
                <span className="sidebar-account-avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>
                </span>
                <span className="sidebar-account-text">
                  <strong>{displayName}</strong>
                  <small>{displayEmail}</small>
                </span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
          </>
        ) : (
          <div className="sidebar-rail" aria-label="Collapsed sidebar actions">
            <button className="sidebar-rail-btn" onClick={handleNewPrompt} title="New chat" aria-label="New chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
            </button>
            <button className="sidebar-rail-btn" title="Search chats" aria-label="Search chats" onClick={handleCollapsedSearch}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            </button>

            <button 
              className="sidebar-rail-footer" 
              title={displayName}
              onClick={() => {
                onToggle();
                setIsAccountMenuOpen(true);
              }}
              aria-label="Account menu"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>
            </button>
          </div>
        )}
      </div>

      {promptToDelete && (
        <div className="confirm-modal-overlay" onClick={() => setPromptToDelete(null)}>
          <div className="confirm-modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Delete chat?</h3>
            <p>
              This will delete <strong>{promptToDelete.originalPrompt?.slice(0, 45) || 'this prompt'}</strong>.
            </p>
            <span>This action cannot be undone.</span>
            <div className="confirm-modal-actions">
              <button type="button" className="confirm-modal-cancel" onClick={() => setPromptToDelete(null)}>
                Cancel
              </button>
              <button type="button" className="confirm-modal-delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
