import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TransitionContext = createContext(null);

export const TransitionProvider = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const showFor = useCallback(async (duration = 280) => {
    setIsTransitioning(true);
    await new Promise((resolve) => setTimeout(resolve, duration));
    setIsTransitioning(false);
  }, []);

  const withTransition = useCallback(async (action, minDuration = 280) => {
    const startedAt = Date.now();
    setIsTransitioning(true);

    try {
      return await action();
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minDuration - elapsed);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setIsTransitioning(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      isTransitioning,
      setIsTransitioning,
      showFor,
      withTransition,
    }),
    [isTransitioning, showFor, withTransition]
  );

  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
};

export const useTransitionLoader = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransitionLoader must be used inside TransitionProvider');
  }
  return context;
};

export const TransitionOverlay = () => {
  const { isTransitioning } = useTransitionLoader();

  return (
    <div className={`transition-loader-overlay${isTransitioning ? ' visible' : ''}`} aria-hidden={!isTransitioning}>
      <div className="transition-loader-card">
        <span className="transition-loader-dot" />
        <span className="transition-loader-text">Loading</span>
      </div>
    </div>
  );
};
