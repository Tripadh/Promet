import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/ui/Sidebar';
import PromptInputBar from '../../components/prompt/PromptInputBar';
import { usePrompt } from '../../hooks/usePrompt';
import { promptService } from '../../services/promptService';
import logo from '../../assets/logo.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const FEEDBACK_TAGS = [
  "Incorrect or incomplete",
  "Not what I asked for",
  "Slow or buggy",
  "Style or tone",
  "Safety or legal concern",
  "Other"
];

const Dashboard = () => {
  const { token, loading, user } = useAuth();
  const {
    improvePrompt,
    loading: promptLoading,
    result,
    promptAnalysis,
    currentPrompt,
    selectedMode,
    activeResultMode,
    activeConversationId,
    activePromptId,
    loadHistoryItem,
    loadConversationThread,
    setSelectedMode,
  } = usePrompt();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [isDockingComposer, setIsDockingComposer] = useState(false);
  const [messages, setMessages] = useState([]);
  const [activePromptTimestamp, setActivePromptTimestamp] = useState(null);
  const [draftPayload, setDraftPayload] = useState(null);
  const [copiedInputKey, setCopiedInputKey] = useState(null);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);
  const [shareStatusKey, setShareStatusKey] = useState(null);
  const [outputFeedback, setOutputFeedback] = useState({});
  const [chatNotice, setChatNotice] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 960 : false
  );

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [feedbackTargetKey, setFeedbackTargetKey] = useState(null);

  const hasContentRef = useRef(false);
  const skipDockingOnNextLoadRef = useRef(false);
  const chatEndRef = useRef(null);

  const formatModeLabel = (mode) => {
    const normalized = String(mode || 'balanced').toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const displayName = user?.name || 'there';

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

  // Auto-scroll to the bottom of the chat when loading history or sending a new message
  useEffect(() => {
    if (chatEndRef.current && hasStartedConversation) {
      const scrollTimer = setTimeout(() => {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(scrollTimer);
    }
  }, [messages, currentPrompt, hasStartedConversation]);

  useEffect(() => {
    if (!loading && !token) {
      navigate('/login');
    }
  }, [token, loading, navigate]);

  useEffect(() => {
    if (!chatNotice) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setChatNotice(null);
    }, 3600);

    return () => clearTimeout(timer);
  }, [chatNotice]);

  useEffect(() => {
    const syncViewport = () => {
      const isMobile = window.innerWidth <= 960;
      setIsMobileViewport(isMobile);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);

    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const showChatNotice = (message, tone = 'info') => {
    setChatNotice({
      id: Date.now(),
      message,
      tone,
    });
  };

  const handlePromptSubmit = async (payload) => {
    const MAX_PROMPTS_PER_CHAT = 10;

    if (!payload?.prompt?.trim()) {
      return;
    }

    const activeConversationPromptCount = messages.length + (currentPrompt ? 1 : 0);
    if (activeConversationId && activeConversationPromptCount >= MAX_PROMPTS_PER_CHAT) {
      showChatNotice(`This chat reached the ${MAX_PROMPTS_PER_CHAT}-prompt limit. Start a new chat to continue.`, 'warning');
      return;
    }

    if (result && currentPrompt) {
      setMessages((prev) => {
        const nextIdx = prev.length;
        setOutputFeedback((fbPrev) => {
          if (!fbPrev.active) return fbPrev;
          const newFb = { ...fbPrev };
          newFb[`msg-${nextIdx}`] = newFb.active;
          delete newFb.active;
          return newFb;
        });
        return [
          ...prev,
          {
            id: activePromptId,
            prompt: currentPrompt,
            result,
            analysis: promptAnalysis,
            mode: activeResultMode,
            timestamp: activePromptTimestamp || new Date(),
          },
        ];
      });
    }

    setSelectedMode(payload.mode);
    setActivePromptTimestamp(payload.timestamp || new Date());
    try {
      await improvePrompt(payload.prompt, payload.mode, payload.isRetry, payload.domain || null);
    } catch (error) {
      showChatNotice(error?.message || 'Failed to improve prompt', 'error');
    }
  };

  const resetConversationView = () => {
    setMessages([]);
    setCopiedMsgIdx(null);
    setCopiedInputKey(null);
    setActivePromptTimestamp(null);
    setDraftPayload(null);
    setOutputFeedback({});
    skipDockingOnNextLoadRef.current = true;
    hasContentRef.current = false;
  };

  const handleBeforeHistoryLoad = async (item) => {
    if (!item) {
      resetConversationView();
      return true;
    }

    resetConversationView();

    if (!item.conversationId) {
      loadHistoryItem(item);
      setActivePromptTimestamp(item.createdAt || item.updatedAt || new Date());
      return true;
    }

    try {
      const data = await promptService.getConversationHistory(item.conversationId);
      const conversationItems = Array.isArray(data?.prompts) ? data.prompts : [];

      if (conversationItems.length === 0) {
        loadHistoryItem(item);
        setActivePromptTimestamp(item.createdAt || item.updatedAt || new Date());
        return true;
      }

      const previousMessages = loadConversationThread(conversationItems);
      setMessages(previousMessages);

      const latestItem = conversationItems[conversationItems.length - 1];
      setActivePromptTimestamp(latestItem?.createdAt || latestItem?.updatedAt || new Date());
      return true;
    } catch (error) {
      loadHistoryItem(item);
      setActivePromptTimestamp(item.createdAt || item.updatedAt || new Date());
      return true;
    }
  };

  const formatUserTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const handleCopyInputPrompt = async (promptText, key) => {
    if (!promptText) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(promptText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = promptText;
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

      setCopiedInputKey(key);
      setTimeout(() => setCopiedInputKey((prev) => (prev === key ? null : prev)), 1400);
    } catch (err) {
      console.error('Failed to copy input prompt: ', err);
    }
  };

  const handleRetryInputPrompt = async (promptText, mode) => {
    if (!promptText || promptLoading) return;
    await handlePromptSubmit({
      prompt: promptText,
      mode: mode || selectedMode,
      timestamp: new Date(),
      isRetry: true,
    });
  };

  const handleEditInputPrompt = (promptText) => {
    if (!promptText) return;

    setDraftPayload({
      text: promptText,
      key: Date.now(),
    });

    const composerNode = document.querySelector('.input-container');
    composerNode?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const handleOutputReaction = async (key, reaction) => {
    let promptIdToRate = null;
    if (key === 'active') {
      promptIdToRate = activePromptId;
    } else if (key.startsWith('msg-')) {
      const idx = parseInt(key.replace('msg-', ''), 10);
      promptIdToRate = messages[idx]?.id;
    }

    if (reaction === 'down') {
      setFeedbackTargetKey({ key, id: promptIdToRate });
      setShowFeedbackModal(true);
      return;
    }

    setOutputFeedback((prev) => ({
      ...prev,
      [key]: reaction,
    }));

    if (promptIdToRate) {
      try {
        await promptService.submitFeedback(promptIdToRate, 1);
      } catch (err) {
        console.error('Failed to submit like', err);
      }
    }

    showChatNotice('Thanks for the feedback.', 'info');
  };

  const submitDislikeFeedback = async () => {
    if (!feedbackTargetKey) return;

    const { key, id } = feedbackTargetKey;

    setOutputFeedback((prev) => ({
      ...prev,
      [key]: 'down',
    }));

    setShowFeedbackModal(false);

    if (id) {
      try {
        await promptService.submitFeedback(id, -1, selectedTags, feedbackDetails);
      } catch (err) {
        console.error('Failed to submit dislike', err);
      }
    }

    setSelectedTags([]);
    setFeedbackDetails('');
    setFeedbackTargetKey(null);
    showChatNotice('Feedback noted. We will improve this output.', 'info');
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const copyMessage = async (messageResult, idx) => {
    if (!messageResult) return;

    let textToCopy = typeof messageResult === 'string' ? messageResult : JSON.stringify(messageResult);

    const improvedPromptMatch = textToCopy.match(/#*\s*Improved Prompt/i);
    const whyBetterMatch = textToCopy.match(/#*\s*Why This Is Better/i);
    const improvedPromptIndex = improvedPromptMatch ? improvedPromptMatch.index : -1;
    const whyBetterIndex = whyBetterMatch ? whyBetterMatch.index : -1;

    if (improvedPromptIndex !== -1 && whyBetterIndex !== -1) {
      textToCopy = textToCopy.substring(improvedPromptIndex + improvedPromptMatch[0].length, whyBetterIndex).trim();
    } else if (improvedPromptIndex !== -1) {
      textToCopy = textToCopy.substring(improvedPromptIndex + improvedPromptMatch[0].length).trim();
    } else if (whyBetterIndex !== -1) {
      textToCopy = textToCopy.substring(0, whyBetterIndex).trim();
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

    const improvedPromptMatch = textToCopy.match(/#*\s*Improved Prompt/i);
    const whyBetterMatch = textToCopy.match(/#*\s*Why This Is Better/i);
    const improvedPromptIndex = improvedPromptMatch ? improvedPromptMatch.index : -1;
    const whyBetterIndex = whyBetterMatch ? whyBetterMatch.index : -1;

    if (improvedPromptIndex !== -1 && whyBetterIndex !== -1) {
      textToCopy = textToCopy.substring(improvedPromptIndex + improvedPromptMatch[0].length, whyBetterIndex).trim();
    } else if (improvedPromptIndex !== -1) {
      textToCopy = textToCopy.substring(improvedPromptIndex + improvedPromptMatch[0].length).trim();
    } else if (whyBetterIndex !== -1) {
      textToCopy = textToCopy.substring(0, whyBetterIndex).trim();
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

  const shouldShowPromptAnalysis = Boolean(promptAnalysis) && Boolean(result) && !promptLoading;

  const downloadFullChatAsPDF = () => {
    if (!messages.length && !result) {
      showChatNotice('No conversation history to download.', 'warning');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text('Promet Conversation Export', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`User: ${displayName}`, 14, 35);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 40, pageWidth - 14, 40);

      const tableData = [];

      // Add past messages
      messages.forEach((msg) => {
        tableData.push([
          { content: 'USER PROMPT', styles: { fontStyle: 'bold', textColor: [80, 80, 80] } },
          msg.prompt
        ]);
        
        const cleanResult = typeof msg.result === 'string' ? msg.result : JSON.stringify(msg.result);
        tableData.push([
          { content: 'IMPROVED PROMPT', styles: { fontStyle: 'bold', textColor: [16, 163, 127] } },
          cleanResult
        ]);
      });

      // Add current result if exists
      if (result && currentPrompt) {
        tableData.push([
          { content: 'USER PROMPT', styles: { fontStyle: 'bold', textColor: [80, 80, 80] } },
          currentPrompt
        ]);
        
        const cleanActiveResult = typeof result === 'string' ? result : JSON.stringify(result);
        tableData.push([
          { content: 'IMPROVED PROMPT', styles: { fontStyle: 'bold', textColor: [16, 163, 127] } },
          cleanActiveResult
        ]);
      }

      autoTable(doc, {
        startY: 45,
        head: [['Role', 'Content']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [33, 33, 33], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 'auto' }
        },
        styles: { fontSize: 10, cellPadding: 6 },
        alternateRowStyles: { fillColor: [250, 250, 250] }
      });

      doc.save(`Promet-Chat-${Date.now()}.pdf`);
      showChatNotice('PDF downloaded successfully.', 'info');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      showChatNotice('Failed to generate PDF.', 'error');
    }
  };

  const shareConversation = async (statusKey = 'active') => {
    if (!activeConversationId) {
      showChatNotice('No active chat to share yet.', 'warning');
      return;
    }

    let promptIdToShare = null;
    if (statusKey === 'active') {
      promptIdToShare = activePromptId;
    } else if (statusKey.startsWith('msg-')) {
      const idx = parseInt(statusKey.replace('msg-', ''), 10);
      promptIdToShare = messages[idx]?.id;
    }

    try {
      const share = await promptService.createConversationShare(activeConversationId, promptIdToShare);
      const shareUrl = `${window.location.origin}/shared/${share.shareId}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: share.title || 'Shared chat',
            text: 'Take a look at this shared Promet chat.',
            url: shareUrl,
          });
        } catch (shareError) {
          // Fall back to clipboard below if native share is canceled or unavailable.
        }
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.prepend(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setShareStatusKey(statusKey);
      setTimeout(() => setShareStatusKey((prev) => (prev === statusKey ? null : prev)), 1800);
      showChatNotice('Share link copied to clipboard.', 'info');
    } catch (err) {
      showChatNotice(err?.message || 'Failed to create share link.', 'error');
    }
  };

  if (loading || !token) return <div style={{ color: 'var(--text-main)', padding: '20px' }}>Loading...</div>;

  return (
    <div className={`app-layout${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
      {isMobileViewport && !isSidebarOpen ? (
        <button
          type="button"
          className="mobile-sidebar-open-btn"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></svg>
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

      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((open) => !open)} onBeforeHistoryLoad={handleBeforeHistoryLoad} />

      <div className="main-content">
        <div className={`content-container${hasStartedConversation ? ' conversation-started' : ' pre-conversation'}${isDockingComposer ? ' is-docking' : ''}`}>
          <div className={`chat-container${hasStartedConversation ? ' chat-active' : ' chat-welcome'}`}>
            {/* Output Area */}
            {!hasStartedConversation ? (
              <div className="welcome-hero">
                <div className="welcome-kicker">
                  <svg className="welcome-kicker-spark" viewBox="0 0 24 24" aria-hidden="true" width="28" height="28">
                    <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" fill="url(#gemini-gradient)" />
                    <defs>
                      <linearGradient id="gemini-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="50%" stopColor="#F5E171" />
                        <stop offset="100%" stopColor="#C0C0C0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="welcome-kicker-name">Hi {displayName}</span>
                </div>
                <h1>Where should we start?</h1>
              </div>
            ) : null}

            {messages.map((msg, idx) => {
              const msgText = typeof msg.result === 'string' ? msg.result : JSON.stringify(msg.result);

              const whyMatch = msgText.match(/#*\s*Why This Is Better/i);
              const whyIdx = whyMatch ? whyMatch.index : -1;

              let msgPromptPart = whyIdx !== -1 ? msgText.substring(0, whyIdx).trim() : msgText;

              const impMatch = msgPromptPart.match(/#*\s*Improved Prompt/i);
              if (impMatch && impMatch.index === 0) {
                msgPromptPart = msgPromptPart.substring(impMatch[0].length).trim();
              }
              if (msgPromptPart.startsWith('```')) {
                const nl = msgPromptPart.indexOf('\n');
                if (nl !== -1) msgPromptPart = msgPromptPart.substring(nl + 1).trim();
                if (msgPromptPart.endsWith('```')) msgPromptPart = msgPromptPart.substring(0, msgPromptPart.length - 3).trim();
              }
              return (
                <React.Fragment key={idx}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ alignSelf: 'flex-end', backgroundColor: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-panel)', padding: '15px 20px', borderRadius: '18px 18px 0 18px', maxWidth: '80%' }}>
                      <p>{msg.prompt}</p>
                    </div>
                    <div className="user-prompt-meta-row">
                      <span className="user-prompt-time">{formatUserTime(msg.timestamp)}</span>
                      <button type="button" className="user-prompt-action" onClick={() => handleRetryInputPrompt(msg.prompt, msg.mode)} title="Retry">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3.2-6.9" /><path d="M21 3v6h-6" /></svg>
                      </button>
                      <button type="button" className="user-prompt-action" onClick={() => handleEditInputPrompt(msg.prompt)} title="Edit">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" /></svg>
                      </button>
                      <button type="button" className="user-prompt-action" onClick={() => handleCopyInputPrompt(msg.prompt, `message-${idx}`)} title="Copy">
                        {copiedInputKey === `message-${idx}` ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        )}
                      </button>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-panel)', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-panel)', padding: '12px 16px', borderBottom: '1px solid var(--border-panel)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Improved Prompt</span>
                          <span style={{ padding: '4px 10px', borderRadius: '999px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', border: '1px solid var(--border-panel)' }}>
                            {formatModeLabel(msg.mode)}
                          </span>
                        </div>
                        <button onClick={() => copyMessage(msg.result, idx)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', padding: '4px 8px', borderRadius: '4px' }}>
                          {copiedMsgIdx === idx ? (
                            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a6e3a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span style={{ color: '#a6e3a1' }}>Copied!</span></>
                          ) : (
                            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy</>
                          )}
                        </button>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'var(--font-mono)', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)' }}>{msgPromptPart}</pre>
                      </div>
                    </div>

                    <div className="output-message-actions">
                      <button
                        type="button"
                        className={`output-message-action${outputFeedback[`msg-${idx}`] === 'up' ? ' is-active' : ''}`}
                        title="Helpful"
                        onClick={() => handleOutputReaction(`msg-${idx}`, 'up')}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11" /><path d="M11 10V5.2A2.2 2.2 0 0 1 13.2 3a2 2 0 0 1 2 2v5h4.1a2 2 0 0 1 2 2.3l-1 7A2 2 0 0 1 18.3 21H7" /><path d="M7 10H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3" /></svg>
                      </button>
                      <button
                        type="button"
                        className={`output-message-action${outputFeedback[`msg-${idx}`] === 'down' ? ' is-active' : ''}`}
                        title="Not helpful"
                        onClick={() => handleOutputReaction(`msg-${idx}`, 'down')}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14V3" /><path d="M11 14v4.8A2.2 2.2 0 0 0 13.2 21a2 2 0 0 0 2-2v-5h4.1a2 2 0 0 0 2-2.3l-1-7A2 2 0 0 0 18.3 3H7" /><path d="M7 14H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" /></svg>
                      </button>
                      <button type="button" className="output-message-action" title="Retry" onClick={() => handleRetryInputPrompt(msg.prompt, msg.mode)}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3.2-6.9" /><path d="M21 3v6h-6" /></svg>
                      </button>
                      <button type="button" className="output-message-action" title="Copy" onClick={() => copyMessage(msg.result, idx)}>
                        {copiedMsgIdx === idx ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        )}
                      </button>
                      <button type="button" className="output-message-action" title="Share" onClick={() => shareConversation(`msg-${idx}`)}>
                        {shareStatusKey === `msg-${idx}` ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border-panel)', margin: '16px 0' }} />
                </React.Fragment>
              );
            })}

            {(result || promptLoading) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ alignSelf: 'flex-end', backgroundColor: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-panel)', padding: '15px 20px', borderRadius: '18px 18px 0 18px', maxWidth: '80%' }}>
                  <p>{currentPrompt}</p>
                </div>
                <div className="user-prompt-meta-row">
                  <span className="user-prompt-time">{formatUserTime(activePromptTimestamp)}</span>
                  <button type="button" className="user-prompt-action" onClick={() => handleRetryInputPrompt(currentPrompt, activeResultMode)} title="Retry">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3.2-6.9" /><path d="M21 3v6h-6" /></svg>
                  </button>
                  <button type="button" className="user-prompt-action" onClick={() => handleEditInputPrompt(currentPrompt)} title="Edit">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" /></svg>
                  </button>
                  <button type="button" className="user-prompt-action" onClick={() => handleCopyInputPrompt(currentPrompt, 'active')} title="Copy">
                    {copiedInputKey === 'active' ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    )}
                  </button>
                </div>
                <div className="result-box" style={{ alignSelf: 'flex-start', backgroundColor: 'transparent', padding: '0', maxWidth: '100%', marginTop: '0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {(() => {
                    const resultText = typeof result === 'string' ? result : JSON.stringify(result);
                    const whyMatch = resultText.match(/#*\s*Why This Is Better/i);
                    const whyBetterIndex = whyMatch ? whyMatch.index : -1;

                    let promptPart = resultText;
                    if (whyBetterIndex !== -1) {
                      promptPart = resultText.substring(0, whyBetterIndex).trim();
                    }

                    const impMatch = promptPart.match(/#*\s*Improved Prompt/i);
                    if (impMatch && impMatch.index === 0) {
                      promptPart = promptPart.substring(impMatch[0].length).trim();
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
                        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-panel)', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-panel)', padding: '12px 16px', borderBottom: '1px solid var(--border-panel)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Improved Prompt</span>
                              <span style={{ padding: '4px 10px', borderRadius: '999px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', border: '1px solid var(--border-panel)' }}>
                                {formatModeLabel(activeResultMode)}
                              </span>
                            </div>
                            <button onClick={copyPrompt} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', padding: '4px 8px', borderRadius: '4px', transition: 'color 0.2s' }}>
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
                            <div className="prompt-output-content">
                              {!promptPart && promptLoading ? (
                                <span className="thinking-indicator">
                                  Thinking<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span>
                                </span>
                              ) : null}
                              {promptPart}
                              {promptLoading && promptPart ? <span className="streaming-cursor" /> : null}
                            </div>
                          </div>
                        </div>


                      </div>
                    );
                  })()}

                  {shouldShowPromptAnalysis ? (
                    <div className="prompt-analyzer-card">
                      <div className="prompt-analyzer-header">
                        <h3 className="prompt-analyzer-title">
                          Prompt Analyzer
                        </h3>
                        <span className="prompt-analyzer-score">
                          Prompt Score: {promptAnalysis.score}/100
                        </span>
                      </div>

                      <div className="prompt-analyzer-grid">
                        <div className="prompt-analyzer-section-card">
                          <h4 style={{ margin: '0 0 8px 0', color: '#a6e3a1', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Strengths</h4>
                          {promptAnalysis.strengths?.length ? (
                            <ul className="prompt-analyzer-list">
                              {promptAnalysis.strengths.map((item, index) => (
                                <li key={`strength-${index}`} style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>No major strengths detected yet.</p>
                          )}
                        </div>

                        <div className="prompt-analyzer-section-card">
                          <h4 style={{ margin: '0 0 8px 0', color: '#f38ba8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Weaknesses</h4>
                          {promptAnalysis.weaknesses?.length ? (
                            <ul className="prompt-analyzer-list">
                              {promptAnalysis.weaknesses.map((item, index) => (
                                <li key={`weakness-${index}`} style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>No major weaknesses detected.</p>
                          )}
                        </div>

                        <div className="prompt-analyzer-section-card">
                          <h4 style={{ margin: '0 0 8px 0', color: '#f9e2af', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Suggestions</h4>
                          {promptAnalysis.suggestions?.length ? (
                            <ul className="prompt-analyzer-list">
                              {promptAnalysis.suggestions.map((item, index) => (
                                <li key={`suggestion-${index}`} style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>No additional suggestions.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div className="output-message-actions">
                    <button
                      type="button"
                      className={`output-message-action${outputFeedback.active === 'up' ? ' is-active' : ''}`}
                      title="Helpful"
                      onClick={() => handleOutputReaction('active', 'up')}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11" /><path d="M11 10V5.2A2.2 2.2 0 0 1 13.2 3a2 2 0 0 1 2 2v5h4.1a2 2 0 0 1 2 2.3l-1 7A2 2 0 0 1 18.3 21H7" /><path d="M7 10H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3" /></svg>
                    </button>
                    <button
                      type="button"
                      className={`output-message-action${outputFeedback.active === 'down' ? ' is-active' : ''}`}
                      title="Not helpful"
                      onClick={() => handleOutputReaction('active', 'down')}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14V3" /><path d="M11 14v4.8A2.2 2.2 0 0 0 13.2 21a2 2 0 0 0 2-2v-5h4.1a2 2 0 0 0 2-2.3l-1-7A2 2 0 0 0 18.3 3H7" /><path d="M7 14H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" /></svg>
                    </button>
                    <button type="button" className="output-message-action" title="Retry" onClick={() => handleRetryInputPrompt(currentPrompt, activeResultMode)}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3.2-6.9" /><path d="M21 3v6h-6" /></svg>
                    </button>
                    <button type="button" className="output-message-action" title="Copy" onClick={copyPrompt}>
                      {copied ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      )}
                    </button>
                    <button type="button" className="output-message-action" title="Share" onClick={() => shareConversation('active')}>
                      {shareStatusKey === 'active' ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-container">
            {chatNotice ? (
              <div className={`chat-notice toast-${chatNotice.tone}`} role="status" aria-live="polite" key={chatNotice.id}>
                <div className="chat-notice-dot" aria-hidden="true" />
                <p>{chatNotice.message}</p>
                <button type="button" className="chat-notice-close" onClick={() => setChatNotice(null)} aria-label="Dismiss message">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12" /><path d="m18 6-12 12" /></svg>
                </button>
              </div>
            ) : null}
            <PromptInputBar
              initialMode={selectedMode}
              draftPayload={draftPayload}
              loading={promptLoading}
              onModeChange={setSelectedMode}
              onSubmit={handlePromptSubmit}
              placeholder="Ask Promet AI"
              hasStartedConversation={hasStartedConversation}
              onMenuAction={(action) => {
                if (action === 'download_pdf') {
                  downloadFullChatAsPDF();
                }
              }}
            />
            {hasStartedConversation ? (
              <p className="chat-bottom-disclaimer">Promet can make mistakes. Double-check important details.</p>
            ) : null}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default Dashboard;
