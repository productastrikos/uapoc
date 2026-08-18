import { create } from 'zustand';

export type UserRole = 'admin' | 'dock_zone_head' | 'security_head';

interface User {
  username: string;
  role: UserRole;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const credentials = {
  admin: { password: 'Astrikos2026', name: 'Administrator', role: 'admin' as UserRole }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (username: string, password: string) => {
    const cred = credentials[username as keyof typeof credentials];
    if (cred && cred.password === password) {
      set({ 
        user: { username, role: cred.role, name: cred.name },
        isAuthenticated: true 
      });
      return true;
    }
    return false;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  }
}));
