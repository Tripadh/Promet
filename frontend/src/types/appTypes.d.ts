export interface AuthUser {
  name?: string;
  username?: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<unknown>;
  sendOtp: (email: string, captchaToken?: string) => Promise<unknown>;
  verifyOtpLogin: (email: string, otp: string) => Promise<unknown>;
  register: (payload: Record<string, unknown>) => Promise<unknown>;
  logout: () => void;
}

export interface PromptHistoryItem {
  _id: string;
  title?: string;
  originalPrompt?: string;
  improvedPrompt?: string;
  mode?: string;
  pinned?: boolean;
  favorite?: boolean;
  conversationId?: string;
}

export interface PromptContextValue {
  deleteAllChats: () => Promise<boolean>;
  loadHistoryItem: (item: PromptHistoryItem) => void;
  clearPrompt: () => void;
  historyRefreshTrigger: number;
}

export interface TransitionContextValue {
  isTransitioning: boolean;
  setIsTransitioning: (value: boolean) => void;
  showFor: (duration?: number) => Promise<void>;
  withTransition: <T>(action: () => Promise<T> | T, minDuration?: number) => Promise<T>;
}

export interface ApiLikeError {
  message?: string;
}
