import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/ui/Sidebar';
import PromptInputBar from '../../components/prompt/PromptInputBar';
import { usePrompt } from '../../hooks/usePrompt';
import './Dashboard.css';

const Dashboard = () => {
  const { token, loading } = useAuth();
  const {
    improvePrompt,
    loading: promptLoading,
    result,
    promptAnalysis,
    currentPrompt,
    selectedMode,
    setSelectedMode,
  } = usePrompt();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [isDockingComposer, setIsDockingComposer] = useState(false);
  const [messages, setMessages] = useState([]);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);
  const hasContentRef = useRef(false);
  const skipDockingOnNextLoadRef = useRef(false);
  const chatEndRef = useRef(null);

  const formatModeLabel = (mode) => {
    const normalized = String(mode || 'balanced').toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  useEffect(() => {
    const hasContent = Boolean(result || currentPrompt);

    if (hasContent && !hasContentRef.current) {
      setHasStartedConversation(true);

      if (skipDockingOnNextLoadRef.current) {
        setIsDockingComposer(false);
        skipDockingOnNextLoadRef.current = false;
      } else {
        setIsDockingComposer(true);
      }

      hasContentRef.current = true;
    }

    if (!hasContent) {
      hasContentRef.current = false;
      setIsDockingComposer(false);
      setHasStartedConversation(false);
      setMessages([]);
      return;
    }

    hasContentRef.current = true;
  }, [result, currentPrompt]);

  useEffect(() => {
    if (!isDockingComposer) {
      return;
    }

    const transitionTimer = setTimeout(() => {
      setIsDockingComposer(false);
    }, 520);

    return () => clearTimeout(transitionTimer);
  }, [isDockingComposer]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, result]);

  useEffect(() => {
    if (!loading && !token) {
      navigate('/');
    }
  }, [token, loading, navigate]);

  const handlePromptSubmit = async (payload) => {
    if (!payload?.prompt?.trim()) {
      return;
    }

    if (result && currentPrompt) {
      setMessages((prev) => [
        ...prev,
        {
          prompt: currentPrompt,
          result,
          analysis: promptAnalysis,
          mode: selectedMode,
        },
      ]);
    }

    setSelectedMode(payload.mode);
    await improvePrompt(payload.prompt, payload.mode);
  };

  const handleBeforeHistoryLoad = () => {
    setMessages([]);
    setCopiedMsgIdx(null);
    skipDockingOnNextLoadRef.current = true;
    hasContentRef.current = false;
  };

  const copyMessage = async (messageResult, idx) => {
    if (!messageResult) return;

    let textToCopy = typeof messageResult === 'string' ? messageResult : JSON.stringify(messageResult);

    const improvedPromptIndex = textToCopy.indexOf('## Improved Prompt');
    const whyBetterIndex = textToCopy.indexOf('## Why This Is Better');

    if (improvedPromptIndex !== -1 && whyBetterIndex !== -1) {
      textToCopy = textToCopy.substring(improvedPromptIndex + 18, whyBetterIndex).trim();
    } else if (improvedPromptIndex !== -1) {
      textToCopy = textToCopy.substring(improvedPromptIndex + 18).trim();
    }

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
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
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

      setCopiedMsgIdx(idx);
      setTimeout(() => setCopiedMsgIdx(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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
        // Fallback
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

  if (loading || !token) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;

  return (
    <div className={`app-layout${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((open) => !open)} onBeforeHistoryLoad={handleBeforeHistoryLoad} />

      <div className="main-content">
        <div className={`content-container${hasStartedConversation ? ' conversation-started' : ' pre-conversation'}${isDockingComposer ? ' is-docking' : ''}`}>
          <div className={`chat-container${hasStartedConversation ? ' chat-active' : ' chat-welcome'}`}>
            {/* Output Area */}
            {!hasStartedConversation ? (
              <div className="welcome-hero">
                <h1>What&apos;s on the agenda today?</h1>
              </div>
            ) : null}

            {messages.map((msg, idx) => {
              const msgText = typeof msg.result === 'string' ? msg.result : JSON.stringify(msg.result);
              const whyIdx = msgText.indexOf('## Why This Is Better');
              let msgPromptPart = whyIdx !== -1 ? msgText.substring(0, whyIdx).trim() : msgText;
              const msgReasonPart = whyIdx !== -1 ? msgText.substring(whyIdx + 21).trim() : null;
              if (msgPromptPart.startsWith('## Improved Prompt')) msgPromptPart = msgPromptPart.substring(18).trim();
              if (msgPromptPart.startsWith('```')) {
                const nl = msgPromptPart.indexOf('\n');
                if (nl !== -1) msgPromptPart = msgPromptPart.substring(nl + 1).trim();
                if (msgPromptPart.endsWith('```')) msgPromptPart = msgPromptPart.substring(0, msgPromptPart.length - 3).trim();
              }
              return (
                <React.Fragment key={idx}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ alignSelf: 'flex-end', backgroundColor: '#2F2F2F', padding: '15px 20px', borderRadius: '18px 18px 0 18px', maxWidth: '80%' }}>
                      <p>{msg.prompt}</p>
                    </div>
                    <div style={{ backgroundColor: '#1e1e2e', borderRadius: '12px', border: '1px solid #313244', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2a2b3c', padding: '12px 16px', borderBottom: '1px solid #313244' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#a6adc8', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Improved Prompt</span>
                          <span style={{ padding: '4px 10px', borderRadius: '999px', backgroundColor: '#1b1c29', color: '#9ac6ff', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', border: '1px solid #3a3c52' }}>
                            {formatModeLabel(msg.mode)}
                          </span>
                        </div>
                        <button onClick={() => copyMessage(msg.result, idx)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a6adc8', cursor: 'pointer', fontSize: '14px', padding: '4px 8px', borderRadius: '4px' }}>
                          {copiedMsgIdx === idx ? (
                            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a6e3a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span style={{ color: '#a6e3a1' }}>Copied!</span></>
                          ) : (
                            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy</>
                          )}
                        </button>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '14px', lineHeight: '1.6', color: '#cdd6f4' }}>{msgPromptPart}</pre>
                      </div>
                    </div>
                    {msgReasonPart && (
                      <div style={{ padding: '20px', backgroundColor: '#181825', borderRadius: '12px', borderLeft: '4px solid #f9e2af', color: '#bac2de' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#f9e2af', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                          Why This Is Better
                        </h3>
                        <div style={{ fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{msgReasonPart}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />
                </React.Fragment>
              );
            })}

            {result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ alignSelf: 'flex-end', backgroundColor: '#2F2F2F', padding: '15px 20px', borderRadius: '18px 18px 0 18px', maxWidth: '80%' }}>
                  <p>{currentPrompt}</p>
                </div>
                <div className="result-box" style={{ alignSelf: 'flex-start', backgroundColor: 'transparent', padding: '0', maxWidth: '100%', marginTop: '0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {(() => {
                  const resultText = typeof result === 'string' ? result : JSON.stringify(result);
                  const whyBetterIndex = resultText.indexOf('## Why This Is Better');
                  
                  if (whyBetterIndex !== -1) {
                    let promptPart = resultText.substring(0, whyBetterIndex).trim();
                    const reasoningPart = resultText.substring(whyBetterIndex + 21).trim();

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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                        <div style={{ backgroundColor: '#1e1e2e', borderRadius: '12px', border: '1px solid #313244', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2a2b3c', padding: '12px 16px', borderBottom: '1px solid #313244' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#a6adc8', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Improved Prompt</span>
                              <span style={{ padding: '4px 10px', borderRadius: '999px', backgroundColor: '#1b1c29', color: '#9ac6ff', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', border: '1px solid #3a3c52' }}>
                                {formatModeLabel(selectedMode)}
                              </span>
                            </div>
                            <button onClick={copyPrompt} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a6adc8', cursor: 'pointer', fontSize: '14px', padding: '4px 8px', borderRadius: '4px', transition: 'color 0.2s' }}>
                              {copied ? (
                                <>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a6e3a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  <span style={{ color: '#a6e3a1' }}>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <div style={{ padding: '20px' }}>
                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '14px', lineHeight: '1.6', color: '#cdd6f4' }}>
                              {promptPart}
                            </pre>
                          </div>
                        </div>
                        
                        <div style={{ padding: '20px', backgroundColor: '#181825', borderRadius: '12px', borderLeft: '4px solid #f9e2af', color: '#bac2de', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                          <h3 style={{ margin: '0 0 16px 0', color: '#f9e2af', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            Why This Is Better
                          </h3>
                          <div style={{ fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                            {reasoningPart}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                      <div style={{ backgroundColor: '#1e1e2e', borderRadius: '12px', border: '1px solid #313244', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2a2b3c', padding: '12px 16px', borderBottom: '1px solid #313244' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#a6adc8', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Improved Prompt</span>
                            <span style={{ padding: '4px 10px', borderRadius: '999px', backgroundColor: '#1b1c29', color: '#9ac6ff', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', border: '1px solid #3a3c52' }}>
                              {formatModeLabel(selectedMode)}
                            </span>
                          </div>
                          <button onClick={copyPrompt} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a6adc8', cursor: 'pointer', fontSize: '14px', padding: '4px 8px', borderRadius: '4px', transition: 'color 0.2s' }}>
                            {copied ? (
                              <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a6e3a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span style={{ color: '#a6e3a1' }}>Copied!</span>
                              </>
                            ) : (
                              <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '14px', lineHeight: '1.6', color: '#cdd6f4' }}>
                            {resultText}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                  })()}

                  {promptAnalysis ? (
                    <div style={{ backgroundColor: '#15161c', borderRadius: '12px', border: '1px solid #303245', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, color: '#cdd6f4', fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Prompt Analyzer
                      </h3>
                      <span style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: '#24273a', color: '#89dceb', fontSize: '13px', fontWeight: '700' }}>
                        Prompt Score: {promptAnalysis.score}/100
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <div style={{ backgroundColor: '#1e2230', border: '1px solid #2c3245', borderRadius: '10px', padding: '12px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#a6e3a1', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Strengths</h4>
                        {promptAnalysis.strengths?.length ? (
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#d6f5dd', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                            {promptAnalysis.strengths.map((item, index) => (
                              <li key={`strength-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ margin: 0, color: '#9ba3b8', fontSize: '13px' }}>No major strengths detected yet.</p>
                        )}
                      </div>

                      <div style={{ backgroundColor: '#2a1f2a', border: '1px solid #46304b', borderRadius: '10px', padding: '12px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#f38ba8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Weaknesses</h4>
                        {promptAnalysis.weaknesses?.length ? (
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#ffd6e0', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                            {promptAnalysis.weaknesses.map((item, index) => (
                              <li key={`weakness-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ margin: 0, color: '#f2c1d1', fontSize: '13px' }}>No major weaknesses detected.</p>
                        )}
                      </div>

                      <div style={{ backgroundColor: '#1f2721', border: '1px solid #314438', borderRadius: '10px', padding: '12px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#f9e2af', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Suggestions</h4>
                        {promptAnalysis.suggestions?.length ? (
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#fbeac3', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                            {promptAnalysis.suggestions.map((item, index) => (
                              <li key={`suggestion-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ margin: 0, color: '#d8c99b', fontSize: '13px' }}>No additional suggestions.</p>
                        )}
                      </div>
                    </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-container">
            <PromptInputBar
              initialMode={selectedMode}
              loading={promptLoading}
              onModeChange={setSelectedMode}
              onSubmit={handlePromptSubmit}
              placeholder="Ask anything"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
