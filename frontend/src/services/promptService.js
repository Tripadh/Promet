import api, { API_BASE_URL } from '../api';

export const promptService = {

  /* ================= ANALYZE PROMPT ================= */

  analyzePrompt: async (prompt) => {
    const response = await api.post('/prompts/analyze', { prompt });
    return response.data;
  },

  /* ================= STREAM IMPROVED PROMPT ================= */

  improvePromptStream: async (prompt, mode, isRetry, onToken, onDone, conversationId = null) => {

    const response = await fetch(`${API_BASE_URL}/prompts/improve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ prompt, mode, isRetry, conversationId })
    });

    if (!response.ok) {
      let errorMessage = "Failed to improve prompt";

      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
      } catch (error) {
        // Keep fallback message when response body is not JSON.
      }

      throw new Error(errorMessage);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");

      for (let i = 0; i < lines.length - 1; i++) {

        const line = lines[i].replace("data: ", "").trim();

        if (!line) continue;

        try {
          const parsed = JSON.parse(line);
          if (parsed.done) {
            onToken(parsed); // Return the final data object with ID/flags
            onDone();
            return;
          }
          onToken(parsed.text);
        } catch (err) {
          console.error("Stream parse error:", err);
        }

      }

      buffer = lines[lines.length - 1];
    }

  },

  /* ================= GET HISTORY ================= */

  getHistory: async (page = 1) => {
    const response = await api.get(`/prompts/history?page=${page}`);
    return response.data;
  },

  getConversationHistory: async (conversationId) => {
    const response = await api.get(`/prompts/history/conversation/${conversationId}`);
    return response.data;
  },

  /* ================= GET PINNED/FAVORITES ================= */

  getPinned: async () => {
    const response = await api.get('/prompts/pinned');
    return response.data;
  },

  getFavorites: async () => {
    const response = await api.get('/prompts/favorites');
    return response.data;
  },

  deletePrompt: async (id) => {
    const response = await api.delete(`/prompts/history/${id}`);
    return response.data;
  },

  deleteAllPrompts: async () => {
    const response = await api.delete(`/prompts/history`);
    return response.data;
  },

  /* ================= TOGGLE FAVORITE ================= */

  toggleFavorite: async (id) => {
    const response = await api.patch(`/prompts/${id}/favorite`);
    return response.data;
  },

  /* ================= TOGGLE PIN ================= */

  togglePin: async (id) => {
    const response = await api.patch(`/prompts/${id}/pin`);
    return response.data;
  },

  /* ================= SUBMIT FEEDBACK ================= */

  submitFeedback: async (id, value, tags = [], details = "") => {
    const response = await api.post(`/prompts/${id}/feedback`, { value, tags, details });
    return response.data;
  },

};