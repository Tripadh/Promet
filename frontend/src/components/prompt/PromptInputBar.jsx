import './PromptInputBar.css';
import React, { useEffect, useRef, useState } from 'react';
import DropdownMenu from './DropdownMenu';
import PromptModeSelector from './PromptModeSelector';

const MENU_ITEMS = [
  { id: 'save-prompt', label: 'Save Prompt' },
];

const PROMPT_MODES = [
  { id: 'quick', label: 'Quick', description: 'Fast short rewrite' },
  { id: 'auto', label: 'Auto', description: 'Chooses complexity automatically' },
  { id: 'balanced', label: 'Balanced', description: 'Clear structure with moderate detail' },
  { id: 'expert', label: 'Expert', description: 'Detailed professional prompt' },
];

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
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
  onMenuAction,
  onModeChange,
  onSubmit,
  placeholder = 'Message AI Prompt Improver...',
}) => {
  const [promptText, setPromptText] = useState('');
  const [selectedMode, setSelectedMode] = useState(initialMode);
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
      return undefined;
    }

    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      setSpeechSupported(false);
      return undefined;
    }

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

      if (!normalizedTranscript) {
        return;
      }

      const separator = speechBaseTextRef.current ? ' ' : '';
      setPromptText(`${speechBaseTextRef.current}${separator}${normalizedTranscript}`);
    };

    recognition.onerror = (event) => {
      speechHadErrorRef.current = true;

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setSpeechStatus('Microphone permission denied. Allow mic access and try again.');
      } else if (event.error === 'audio-capture') {
        setSpeechStatus('No microphone detected. Check your audio input device.');
      } else if (event.error === 'network') {
        setSpeechStatus('Speech service network error. Check internet and retry.');
      } else if (event.error === 'no-speech') {
        setSpeechStatus('No speech detected. Try speaking a bit louder.');
      } else if (event.error === 'aborted') {
        setSpeechStatus('');
      } else {
        setSpeechStatus('Voice input failed. Please try again.');
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
    setSpeechSupported(true);

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    };
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
      timestamp: new Date(),
    };

    await onSubmit?.(payload);
    setPromptText('');
    setIsDropdownOpen(false);
    setIsModeSelectorOpen(false);
    setSpeechStatus('');
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSubmit();
    }
  };

  const handleMicrophoneToggle = () => {
    if (!speechSupported || !recognitionRef.current) {
      setSpeechStatus('Speech recognition is not supported in this browser.');
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setSpeechStatus('Voice input needs HTTPS or localhost.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setSpeechStatus('');
      return;
    }

    speechBaseTextRef.current = promptText.trim();
    speechHadErrorRef.current = false;
    setSpeechStatus('');

    try {
      recognitionRef.current.start();
    } catch (error) {
      setSpeechStatus('Voice input could not start.');
    }
  };

  return (
    <div className="prompt-input-bar-wrapper" ref={wrapperRef}>
      {isDropdownOpen ? (
        <div className="prompt-overlay-panel prompt-menu-panel">
          <DropdownMenu items={MENU_ITEMS} onSelect={handleMenuSelect} />
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
              {speechStatus ? <span className="prompt-input-status">{speechStatus}</span> : null}
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
    </div>
  );
};

export default PromptInputBar;