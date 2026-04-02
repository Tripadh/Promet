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

export interface PromptContextValue {
  deleteAllChats: () => Promise<boolean>;
  [key: string]: unknown;
}

export interface ApiLikeError {
  message?: string;
}
