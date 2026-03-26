import './PromptInputBar.css';
import React, { useEffect, useRef, useState } from 'react';
import DropdownMenu from './DropdownMenu';
import PromptModeSelector from './PromptModeSelector';

const MENU_ITEMS = [
  { id: 'download_pdf', label: 'Download Chat PDF', icon: '📄' }
];

const PROMPT_MODES = [
  { id: 'quick', label: 'Quick', description: 'Fast short rewrite' },
  { id: 'auto', label: 'Auto', description: 'Chooses complexity automatically' },
  { id: 'balanced', label: 'Balanced', description: 'Clear structure with moderate detail' },
  { id: 'expert', label: 'Expert', description: 'Detailed professional prompt' },
];

const DOMAIN_CHIPS = [
  { id: 'tech', label: 'Tech / Code', emoji: '💻' },
  { id: 'social', label: 'Social Media', emoji: '📱' },
  { id: 'marketing', label: 'Marketing', emoji: '📣' },
  { id: 'creative', label: 'Creative', emoji: '✍️' },
  { id: 'email', label: 'Email', emoji: '📧' },
  { id: 'education', label: 'Education', emoji: '🎓' },
];

const PROMPT_CARDS = [
  {
    id: 'tech',
    label: 'Tech / Code',
    emoji: '💻',
    color: '#6366f1',
    examples: [
      'Explain this Python function and suggest optimizations',
      'Write unit tests for a REST API endpoint',
    ],
  },
  {
    id: 'social',
    label: 'Social Media',
    emoji: '📱',
    color: '#ec4899',
    examples: [
      'Write a viral Instagram caption for a product launch',
      'Create a LinkedIn post showcasing a career milestone',
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    emoji: '📣',
    color: '#f97316',
    examples: [
      'Write a compelling product description for an e-commerce site',
      'Create a call-to-action for a SaaS landing page',
    ],
  },
  {
    id: 'creative',
    label: 'Creative',
    emoji: '✍️',
    color: '#a855f7',
    examples: [
      'Write the opening paragraph of a thriller short story',
      'Brainstorm 5 unique concepts for a sci-fi novel',
    ],
  },
  {
    id: 'email',
    label: 'Email',
    emoji: '📧',
    color: '#14b8a6',
    examples: [
      'Write a professional follow-up email after an interview',
      'Draft a cold outreach email to a potential client',
    ],
  },
  {
    id: 'education',
    label: 'Education',
    emoji: '🎓',
    color: '#eab308',
    examples: [
      'Explain the concept of machine learning in simple terms',
      'Create a study plan for learning JavaScript in 30 days',
    ],
  },
];

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" />
    <path d="M8 12H16" />
    <path d="M12 16V8" />
  </svg>
);

const MicIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
    <path d="M19 11a7 7 0 0 1-14 0" />
    <path d="M12 18v3" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 12 14-7-4 7 4 7-14-7Z" />
  </svg>
);

const PromptInputBar = ({
  initialMode = 'balanced',
  draftPayload,
  loading = false,
  hasStartedConversation = false,
  onMenuAction,
  onModeChange,
  onSubmit,
  placeholder = 'Message AI Prompt Improver...',
}) => {
  const [promptText, setPromptText] = useState('');
  const [selectedMode, setSelectedMode] = useState(initialMode);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechStatus, setSpeechStatus] = useState('');
  const wrapperRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechBaseTextRef = useRef('');
  const speechHadErrorRef = useRef(false);

  useEffect(() => {
    setSelectedMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!draftPayload?.text) {
      return;
    }

    setPromptText(draftPayload.text);

    requestAnimationFrame(() => {
      if (!textareaRef.current) {
        return;
      }

      textareaRef.current.focus();
      const cursorPosition = draftPayload.text.length;
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
    });
  }, [draftPayload]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognitionApi);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
        setIsModeSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = '0px';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
  }, [promptText]);

  const handleDomainSelect = (domainId) => {
    setSelectedDomain((prev) => (prev === domainId ? null : domainId));
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setIsModeSelectorOpen(false);
    onModeChange?.(mode);
  };

  const handleMenuSelect = (action) => {
    setIsDropdownOpen(false);
    setIsModeSelectorOpen(false);
    onMenuAction?.(action);
  };

  const selectedModeLabel = PROMPT_MODES.find((mode) => mode.id === selectedMode)?.label || 'Balanced';
  const hasPromptText = promptText.trim().length > 0;

  const handleSubmit = async () => {
    const trimmedPrompt = promptText.trim();

    if (!trimmedPrompt || loading) {
      return;
    }

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    const payload = {
      prompt: trimmedPrompt,
      mode: selectedMode,
      domain: selectedDomain,
      timestamp: new Date(),
    };

    setPromptText('');
    setSelectedDomain(null);
    setIsDropdownOpen(false);
    setIsModeSelectorOpen(false);
    setSpeechStatus('');

    try {
      await onSubmit?.(payload);
    } catch (error) {
      // In a real app, you might want to restore the promptText here if it fails, 
      // but for now swallowing prevents unhandled rejections
      console.error('Submit failed', error);
    }
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSubmit();
    }
  };

  const handleMicrophoneToggle = () => {
    if (!speechSupported) {
      setSpeechStatus('Speech recognition is not supported in this browser.');
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setSpeechStatus('Voice input needs HTTPS or localhost.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    speechBaseTextRef.current = promptText.trim();
    speechHadErrorRef.current = false;
    setSpeechStatus('');

    try {
      const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionApi();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechStatus('Listening...');
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          transcript += event.results[index][0].transcript;
        }
        const normalizedTranscript = transcript.trim();
        if (!normalizedTranscript) return;
        
        const separator = speechBaseTextRef.current ? ' ' : '';
        setPromptText(`${speechBaseTextRef.current}${separator}${normalizedTranscript}`);
      };

      recognition.onerror = (event) => {
        speechHadErrorRef.current = true;
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechStatus('Microphone permission denied.');
        } else if (event.error === 'audio-capture') {
          setSpeechStatus('No microphone detected.');
        } else if (event.error === 'network') {
          setSpeechStatus('Speech network error. Try Chrome/Edge.');
        } else if (event.error === 'no-speech') {
          setSpeechStatus('No speech detected.');
        } else if (event.error === 'aborted') {
          setSpeechStatus('');
        } else {
          setSpeechStatus('Voice input failed.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (!speechHadErrorRef.current) {
          setSpeechStatus('');
        }
        speechHadErrorRef.current = false;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Speech start error:', error);
      setSpeechStatus('Voice input could not start.');
      setIsListening(false);
    }
  };

  return (
    <div className="prompt-input-bar-wrapper" ref={wrapperRef}>

      {isDropdownOpen ? (
        <div className="prompt-overlay-panel prompt-menu-panel">
          <DropdownMenu items={MENU_ITEMS} onSelect={handleMenuSelect}>
            <div className="prompt-menu-separator" />
            {hasStartedConversation ? (
              <div className="prompt-menu-domains">
                <div className="prompt-menu-domains-header">Context Domain</div>
                <div className="prompt-menu-domains-grid">
                  {DOMAIN_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      className={`prompt-menu-domain-btn${selectedDomain === chip.id ? ' is-selected' : ''}`}
                      onClick={() => {
                        handleDomainSelect(chip.id);
                        setIsDropdownOpen(false);
                      }}
                      title={chip.label}
                    >
                      <span className="domain-btn-icon">{chip.emoji}</span>
                      <span className="domain-btn-label">{chip.label}</span>
                      {selectedDomain === chip.id ? (
                        <svg className="domain-btn-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </DropdownMenu>
        </div>
      ) : null}

      {isModeSelectorOpen ? (
        <div className="prompt-overlay-panel prompt-mode-panel">
          <PromptModeSelector
            modes={PROMPT_MODES}
            selectedMode={selectedMode}
            onSelect={handleModeSelect}
          />
        </div>
      ) : null}

      <div className="prompt-input-bar">
        <div className="prompt-input-textarea-shell">
          <textarea
            ref={textareaRef}
            className="prompt-input-textarea"
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows="1"
          />
          <div className="prompt-input-bottom-row">
            <div className="prompt-input-left-actions">
              <button
                type="button"
                className="prompt-plus-inline"
                onClick={() => {
                  setIsModeSelectorOpen(false);
                  setIsDropdownOpen((open) => !open);
                }}
                aria-label="Open prompt actions"
                aria-expanded={isDropdownOpen}
              >
                <PlusIcon />
              </button>
              {speechStatus ? (
                <div className="prompt-input-status">
                  {speechStatus}
                  <button type="button" onClick={() => setSpeechStatus('')} className="prompt-status-close">×</button>
                </div>
              ) : null}
            </div>

            <div className="prompt-input-right-actions">
              <button
                type="button"
                className="prompt-input-mode-pill prompt-mode-trigger"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsModeSelectorOpen((open) => !open);
                }}
                aria-label="Select prompt mode"
                aria-expanded={isModeSelectorOpen}
              >
                <span>{selectedModeLabel}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {hasPromptText ? (
                <button
                  type="button"
                  className="prompt-send-button"
                  onClick={handleSubmit}
                  disabled={loading || !hasPromptText}
                  aria-label="Send prompt"
                >
                  <SendIcon />
                </button>
              ) : (
                <button
                  type="button"
                  className={`prompt-input-icon-button${isListening ? ' is-active' : ''}`}
                  onClick={handleMicrophoneToggle}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  title={speechSupported ? (isListening ? 'Stop voice input' : 'Start voice input') : 'Speech recognition unavailable'}
                >
                  <MicIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Cards — Only visible before conversation starts */}
      {!hasStartedConversation ? (
        <div className="prompt-cards-row">
          {PROMPT_CARDS.map((card) => (
            <div
              key={card.id}
              className={`prompt-card${selectedDomain === card.id ? ' is-selected' : ''}`}
              style={{ '--card-accent': card.color }}
            >
              <button
                type="button"
                className="prompt-card-header"
                onClick={() => handleDomainSelect(card.id)}
              >
                <span className="prompt-card-emoji">{card.emoji}</span>
                <span className="prompt-card-label">{card.label}</span>
                {selectedDomain === card.id ? (
                  <svg className="prompt-card-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : null}
              </button>
              <div className="prompt-card-examples">
                {card.examples.map((example, i) => (
                  <button
                    key={i}
                    type="button"
                    className="prompt-card-example"
                    onClick={() => {
                      handleDomainSelect(card.id);
                      const ta = document.querySelector('.prompt-input-textarea');
                      if (ta) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                        setter?.call(ta, example);
                        ta.dispatchEvent(new Event('input', { bubbles: true }));
                        ta.focus();
                      }
                    }}
                  >
                    <svg className="prompt-card-example-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    <span>{example}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default PromptInputBar;