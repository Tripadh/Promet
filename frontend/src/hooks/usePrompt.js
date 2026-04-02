import { useContext } from 'react';
import { PromptContext } from '../context/PromptContext';

/** @returns {import('../types/appTypes').PromptContextValue} */
export const usePrompt = () => {
  /** @type {import('../types/appTypes').PromptContextValue | null} */
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('usePrompt must be used within a PromptProvider');
  }
  return context;
};
