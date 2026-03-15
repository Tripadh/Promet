import React, { useState } from 'react';
import { usePrompt } from '../../hooks/usePrompt';

const PromptResult = () => {
  const { result, error, activePromptId, isPinned, isFavorite, toggleActiveFavorite, toggleActivePin, selectedMode, currentPrompt } = usePrompt();
  const [copied, setCopied] = useState(false);

  const modeIcons = {
    quick: '⚡',
    balanced: '⚖',
    expert: '🧠',
    auto: '🤖'
  };

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#1e1e2e', 
        borderRadius: '12px', 
        border: '1px solid #f38ba8', 
        color: '#f38ba8',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '20px 0'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>Error: {error}</span>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const copyPrompt = async () => {
    if (!result) return;
    
    let textToCopy = typeof result === 'string' ? result : JSON.stringify(result);
    
    // Extract only the part between "Improved Prompt" and "Why This Is Better"
    const improvedPromptIndex = textToCopy.indexOf('## Improved Prompt');
    const whyBetterIndex = textToCopy.indexOf('## Why This Is Better');
    
    if (improvedPromptIndex !== -1 && whyBetterIndex !== -1) {
      textToCopy = textToCopy.substring(improvedPromptIndex + 18, whyBetterIndex).trim();
    } else if (improvedPromptIndex !== -1) {
      textToCopy = textToCopy.substring(improvedPromptIndex + 18).trim();
    }
    
    // Remove markdown code block symbols if they wrap the prompt
    if (textToCopy.startsWith('```')) {
      const firstNewline = textToCopy.indexOf('\n');
      if (firstNewline !== -1) {
        textToCopy = textToCopy.substring(firstNewline + 1).trim();
      }
      if (textToCopy.endsWith('```')) {
        textToCopy = textToCopy.substring(0, textToCopy.length - 3).trim();
      }
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error(error);
        } finally {
          textArea.remove();
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getResultUI = () => {
    const resultText = typeof result === 'string' ? result : JSON.stringify(result);
    const whyBetterIndex = resultText.indexOf('## Why This Is Better');
    
    let promptPart = resultText;
    let reasoningPart = "";

    if (whyBetterIndex !== -1) {
      promptPart = resultText.substring(0, whyBetterIndex).trim();
      reasoningPart = resultText.substring(whyBetterIndex + 21).trim();
    }

    // Strip ### Improved Prompt heading
    if (promptPart.startsWith('## Improved Prompt')) {
      promptPart = promptPart.substring(18).trim();
    }

    // Strip markdown blocks for display
    if (promptPart.startsWith('```')) {
      const firstNewline = promptPart.indexOf('\n');
      if (firstNewline !== -1) {
        promptPart = promptPart.substring(firstNewline + 1).trim();
      }
      if (promptPart.endsWith('```')) {
        promptPart = promptPart.substring(0, promptPart.length - 3).trim();
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        
        {/* Header Section with Original Prompt and Mode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ color: '#a6adc8', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Original Prompt</h3>
            <div style={{ padding: '16px', backgroundColor: '#181825', borderRadius: '12px', border: '1px solid #313244', color: '#bac2de', fontSize: '15px', lineHeight: '1.6' }}>
              {currentPrompt}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ color: '#a6adc8', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Prompt Mode</h3>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#313244', borderRadius: '10px', color: '#cba6f7', width: 'fit-content', fontWeight: '600' }}>
              <span>{modeIcons[selectedMode] || '✨'}</span>
              <span style={{ textTransform: 'capitalize' }}>{selectedMode}</span>
            </div>
          </div>
        </div>

        {/* Improved Prompt Section */}
        <div style={{ backgroundColor: '#1e1e2e', borderRadius: '12px', border: '1px solid #313244', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2a2b3c', padding: '12px 16px', borderBottom: '1px solid #313244' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: '#cba6f7', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Improved Prompt</span>
              {activePromptId && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={toggleActivePin} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isPinned ? '#f9e2af' : '#6c7086' }} title={isPinned ? 'Unpin' : 'Pin'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 10z"></path><path d="M11 22V11"></path></svg>
                  </button>
                  <button onClick={toggleActiveFavorite} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isFavorite ? '#fab387' : '#6c7086' }} title={isFavorite ? 'Unfavorite' : 'Favorite'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </button>
                </div>
              )}
            </div>
            <button onClick={copyPrompt} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#313244', border: 'none', color: '#cdd6f4', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: '6px 12px', borderRadius: '6px', transition: 'background-color 0.2s' }}>
              {copied ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a6e3a1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span style={{ color: '#a6e3a1' }}>Copied!</span></> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy</>}
            </button>
          </div>
          <div style={{ padding: '24px', backgroundColor: '#1e1e2e', maxHeight: '500px', overflowY: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: '"Fira Code", "JetBrains Mono", monospace', fontSize: '15px', lineHeight: '1.7', color: '#cdd6f4' }}>
              {promptPart}
            </pre>
          </div>
        </div>
        
        {reasoningPart && (
          <div style={{ padding: '24px', backgroundColor: '#181825', borderRadius: '12px', borderLeft: '4px solid #f9e2af', color: '#bac2de', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f9e2af', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Why This Is Better
            </h3>
            <div style={{ fontSize: '15px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              {reasoningPart}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px 0 40px 0' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#cba6f7', marginBottom: '30px', textAlign: 'center' }}>AI Improvement Result</h2>
      {getResultUI()}
    </div>
  );
};

export default PromptResult;
