import { create } from 'zustand';

interface UserData {
  userId: string;
  email: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
}

interface UserStore {
  user: UserData | null;
  loading: boolean;
  setUser: (user: UserData | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user: UserData | null) => set({ user }),
  setLoading: (loading: boolean) => set({ loading }),
}));
