import React, { createContext, useState } from 'react';
import { promptService } from '../services/promptService';

export const PromptContext = createContext(null);

export const PromptProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [promptAnalysis, setPromptAnalysis] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [error, setError] = useState(null);
  const [selectedMode, setSelectedMode] = useState('balanced');
  const [activeResultMode, setActiveResultMode] = useState('balanced');
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState(null);

  // Metadata for the currently displayed result
  const [activePromptId, setActivePromptId] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const improvePrompt = async (promptText, modeOverride, isRetry = false) => {
    setLoading(true);
    setError(null);
    setCurrentPrompt(promptText);
    setResult(''); 
    setPromptAnalysis(null);
    setActivePromptId(null);
    setIsPinned(false);
    setIsFavorite(false);

    try {
      const modeToUse = modeOverride || selectedMode;
      setActiveResultMode(modeToUse);

      // Always analyze the original prompt before AI improvement.
      // This keeps the analyzer visible even if the stream metadata is unavailable.
      const analysis = await promptService.analyzePrompt(promptText);
      setPromptAnalysis(analysis || null);

      if (modeOverride && modeOverride !== selectedMode) {
        setSelectedMode(modeOverride);
      }

      let streamedResult = "";

      const conversationIdToUse = activeConversationId || null;

      await promptService.improvePromptStream(
        promptText,
        modeToUse,
        isRetry,
        (token) => {
          // Check if token is actually the final data object
          if (typeof token === 'object' && token.done) {
            setActivePromptId(token.id);
            setIsPinned(token.pinned);
            setIsFavorite(token.favorite);
            setPromptAnalysis(token.analysis || analysis || null);
            setActiveConversationId(token.conversationId || conversationIdToUse);
          } else {
            streamedResult += token;
            setResult(streamedResult);
          }
        },
        () => {
          setHistoryRefreshTrigger(prev => prev + 1);
        },
        conversationIdToUse
      );

      return streamedResult;
      
    } catch (err) {
      setError(err.message || 'Error improving prompt');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item) => {
    setCurrentPrompt(item.originalPrompt);
    setResult(item.improvedPrompt);
    setPromptAnalysis(null);
    setActivePromptId(item._id);
    setActiveConversationId(item.conversationId || null);
    setIsPinned(item.pinned);
    setIsFavorite(item.favorite);
    setSelectedMode(item.mode || 'balanced');
    setActiveResultMode(item.mode || 'balanced');
    setError(null);
  };

  const loadConversationThread = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const latestItem = items[items.length - 1];
    loadHistoryItem(latestItem);

    return items.slice(0, -1).map((item) => ({
      id: item._id,
      prompt: item.originalPrompt,
      result: item.improvedPrompt,
      analysis: null,
      mode: item.mode || 'balanced',
      timestamp: item.createdAt || item.updatedAt || new Date(),
    }));
  };

  const clearPrompt = () => {
    setCurrentPrompt('');
    setResult(null);
    setPromptAnalysis(null);
    setActivePromptId(null);
    setActiveConversationId(null);
    setIsPinned(false);
    setIsFavorite(false);
    setActiveResultMode(selectedMode || 'balanced');
    setError(null);
  };

  const toggleActiveFavorite = async () => {
    if (!activePromptId) return;
    try {
      const data = await promptService.toggleFavorite(activePromptId);
      setIsFavorite(data.favorite);
      setHistoryRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert("Failed to toggle favorite");
    }
  };

  const toggleActivePin = async () => {
    if (!activePromptId) return;
    try {
      const data = await promptService.togglePin(activePromptId);
      setIsPinned(data.pinned);
      setHistoryRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert("Failed to toggle pin");
    }
  };

  const deleteAllChats = async () => {
    try {
      await promptService.deleteAllPrompts();
      clearPrompt();
      setHistoryRefreshTrigger(prev => prev + 1);
      return true;
    } catch (err) {
      console.error("Failed to delete all chats:", err);
      return false;
    }
  };

  return (
    <PromptContext.Provider value={{ 
      improvePrompt, loading, result, setResult, 
      promptAnalysis, setPromptAnalysis,
      currentPrompt, setCurrentPrompt, error, 
      loadHistoryItem, loadConversationThread, clearPrompt,
      historyRefreshTrigger,
      activePromptId, isPinned, isFavorite,
      toggleActiveFavorite, toggleActivePin,
      deleteAllChats,
      selectedMode, setSelectedMode,
      activeResultMode,
      activeConversationId
    }}>
      {children}
    </PromptContext.Provider>
  );
};
