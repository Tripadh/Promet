import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { promptService } from '../../services/promptService';
import logo from '../../assets/logo.png';
import './SharedChat.css';

const SharedChat = () => {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadSharedConversation = async () => {
      try {
        const response = await promptService.getSharedConversation(shareId);
        if (!mounted) return;
        setData(response);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Failed to load shared chat');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSharedConversation();

    return () => {
      mounted = false;
    };
  }, [shareId]);

  if (loading) {
    return <div className="shared-chat-state">Loading shared chat...</div>;
  }

  if (error) {
    return <div className="shared-chat-state">{error}</div>;
  }

  const prompts = Array.isArray(data?.prompts) ? data.prompts : [];

  return (
    <div className="shared-chat-page">
      <div className="shared-chat-header">
        <div style={{ marginBottom: '12px' }}>
          <img src={logo} alt="Promet Logo" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
        </div>
        <h1>{data?.title || 'Shared Chat'}</h1>
        <p>Read-only shared conversation</p>
      </div>

      <div className="shared-chat-list">
        {prompts.map((item, index) => (
          <div className="shared-chat-item" key={`shared-item-${index}`}>
            <div className="shared-user-bubble">{item.originalPrompt}</div>
            <div className="shared-ai-card">
              <div className="shared-ai-card-top">
                <span>Improved Prompt</span>
                <span className="shared-mode-pill">{String(item.mode || 'balanced')}</span>
              </div>
              <pre>{item.improvedPrompt}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedChat;
