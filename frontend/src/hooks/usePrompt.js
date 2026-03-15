import { useContext } from 'react';
import { PromptContext } from '../context/PromptContext';

export const usePrompt = () => {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('usePrompt must be used within a PromptProvider');
  }
  return context;
};
