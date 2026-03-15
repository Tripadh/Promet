import React, { useState } from 'react';
import { usePrompt } from '../../hooks/usePrompt';

const PromptInput = () => {
  const [text, setText] = useState('');
  const { improvePrompt, loading, selectedMode, setSelectedMode } = usePrompt();

  const modes = [
    { id: 'quick', label: 'Quick', icon: '⚡' },
    { id: 'balanced', label: 'Balanced', icon: '⚖' },
    { id: 'expert', label: 'Expert', icon: '🧠' },
    { id: 'auto', label: 'Auto', icon: '🤖' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    await improvePrompt(text);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: '#cdd6f4', fontSize: '14px', fontWeight: '500' }}>Enter Prompt:</label>
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="What would you like to improve?"
            style={{ 
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#1e1e2e',
              border: '1px solid #313244',
              color: '#cdd6f4',
              fontSize: '16px',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '120px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#cba6f7'}
            onBlur={(e) => e.target.style.borderColor = '#313244'}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ color: '#cdd6f4', fontSize: '14px', fontWeight: '500' }}>Prompt Mode</label>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            backgroundColor: '#181825', 
            padding: '4px', 
            borderRadius: '12px',
            border: '1px solid #313244'
          }}>
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedMode(mode.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: selectedMode === mode.id ? '#313244' : 'transparent',
                  color: selectedMode === mode.id ? '#cba6f7' : '#bac2de',
                  boxShadow: selectedMode === mode.id ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
                }}
              >
                <span style={{ fontSize: '16px' }}>{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            backgroundColor: loading ? '#313244' : '#cba6f7',
            color: '#11111b',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s, background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
              Improving...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg>
              Improve Prompt
            </>
          )}
        </button>
      </form>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PromptInput;
