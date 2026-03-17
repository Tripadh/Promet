import React, { useState } from 'react';
import { usePrompt } from '../../hooks/usePrompt';
import promptService from '../../services/promptService';

const FEEDBACK_TAGS = [
  "Incorrect or incomplete",
  "Not what I asked for",
  "Slow or buggy",
  "Style or tone",
  "Safety or legal concern",
  "Other"
];

const PromptResult = () => {
  const { result, error, activePromptId, isPinned, isFavorite, toggleActiveFavorite, toggleActivePin, selectedMode, currentPrompt } = usePrompt();
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null); // 1, -1, or null
  
  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedbackDetails, setFeedbackDetails] = useState('');
  
  // Toast State
  const [showToast, setShowToast] = useState(false);

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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

  const handleFeedback = async (value) => {
    if (!activePromptId || feedbackGiven !== null) return;
    
    if (value === -1) {
      // Open modal for dislike
      setShowFeedbackModal(true);
      return;
    }

    // Immediate submit for like
    try {
      setFeedbackGiven(value);
      await promptService.submitFeedback(activePromptId, value);
      triggerToast();
    } catch (err) {
      console.error('Failed to submit feedback', err);
      setFeedbackGiven(null);
    }
  };

  const submitDislikeFeedback = async () => {
    if (!activePromptId || feedbackGiven !== null) return;

    try {
      setFeedbackGiven(-1);
      setShowFeedbackModal(false);
      await promptService.submitFeedback(activePromptId, -1, selectedTags, feedbackDetails);
      // Reset modal state & trigger toast
      setSelectedTags([]);
      setFeedbackDetails('');
      triggerToast();
    } catch (err) {
      console.error('Failed to submit dislike feedback', err);
      setFeedbackGiven(null);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
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
                  <div style={{ width: '1px', height: '18px', backgroundColor: '#45475a', margin: '0 4px' }}></div>
                  <button 
                    onClick={() => handleFeedback(1)} 
                    disabled={feedbackGiven !== null}
                    style={{ background: 'none', border: 'none', cursor: feedbackGiven === null ? 'pointer' : 'default', padding: '2px', color: feedbackGiven === 1 ? '#a6e3a1' : '#6c7086', opacity: feedbackGiven === -1 ? 0.3 : 1, transition: 'all 0.2s' }} 
                    title="Good Prompt"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={feedbackGiven === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                  </button>
                  <button 
                    onClick={() => handleFeedback(-1)} 
                    disabled={feedbackGiven !== null}
                    style={{ background: 'none', border: 'none', cursor: feedbackGiven === null ? 'pointer' : 'default', padding: '2px', color: feedbackGiven === -1 ? '#f38ba8' : '#6c7086', opacity: feedbackGiven === 1 ? 0.3 : 1, transition: 'all 0.2s' }} 
                    title="Bad Prompt"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={feedbackGiven === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
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

      {/* Dislike Feedback Modal */}
      {showFeedbackModal && (
        <div className="feedback-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="feedback-modal-card" onClick={e => e.stopPropagation()}>
            <div className="feedback-modal-header">
              <h3>Share feedback</h3>
              <button className="feedback-modal-close" onClick={() => setShowFeedbackModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="feedback-tags">
              {FEEDBACK_TAGS.map(tag => (
                <div 
                  key={tag} 
                  className={`feedback-tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </div>
              ))}
            </div>

            <textarea 
              className="feedback-textarea"
              placeholder="Share details (optional)"
              value={feedbackDetails}
              onChange={(e) => setFeedbackDetails(e.target.value)}
            />

            <div className="feedback-footer">
              <div className="feedback-disclaimer">
                Your conversation will be included with your feedback to help improve the AI model.
              </div>
              <button 
                className="feedback-submit"
                onClick={submitDislikeFeedback}
                disabled={selectedTags.length === 0 && feedbackDetails.trim() === ''}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {showToast && (
        <div className="feedback-toast">
          <div className="feedback-toast-dot"></div>
          <span>Feedback noted. We will improve this output.</span>
          <button className="feedback-toast-close" onClick={() => setShowToast(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default PromptResult;
