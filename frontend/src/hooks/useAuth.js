import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// FIX: Explicit return type prevents downstream user fields from becoming never/unknown.
/** @returns {import('../types/appTypes').AuthContextValue} */
export const useAuth = () => {
  /** @type {import('../types/appTypes').AuthContextValue | null} */
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
