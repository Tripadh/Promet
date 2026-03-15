import React from 'react';

const PromptModeSelector = ({ modes, selectedMode, onSelect }) => {
  return (
    <div className="prompt-mode-selector" role="dialog" aria-label="Select prompt mode">
      <div className="prompt-mode-selector-header">
        <span>Prompt Modes</span>
      </div>
      <div className="prompt-mode-selector-list">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`prompt-mode-option${selectedMode === mode.id ? ' active' : ''}`}
            onClick={() => onSelect(mode.id)}
          >
            <span className="prompt-mode-option-main">
              <strong>{mode.label}</strong>
              {mode.description ? <small>{mode.description}</small> : null}
            </span>
            {selectedMode === mode.id ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m20 6-11 11-5-5" />
              </svg>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptModeSelector;