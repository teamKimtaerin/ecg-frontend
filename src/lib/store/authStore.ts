import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  AuthAPI,
  type User,
  type SignupRequest,
  type LoginRequest,
} from '@/lib/api/auth'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

interface AuthActions {
  signup: (data: SignupRequest) => Promise<void>
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
  getCurrentUser: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
  setAuthData: (user: User, token: string) => void
}

type AuthStore = AuthState & AuthActions

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      // Actions
      signup: async (data: SignupRequest) => {
        try {
          set({ isLoading: true, error: null })

          const response = await AuthAPI.signup(data)

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : '회원가입에 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      login: async (data: LoginRequest) => {
        try {
          set({ isLoading: true, error: null })

          const response = await AuthAPI.login(data)

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : '로그인에 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      getCurrentUser: async () => {
        const { token } = get()

        if (!token) {
          set({ isAuthenticated: false })
          return
        }

        try {
          set({ isLoading: true, error: null })

          const user = await AuthAPI.getCurrentUser(token)

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error:
              error instanceof Error
                ? error.message
                : '사용자 정보를 가져오는데 실패했습니다.',
            isLoading: false,
          })
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setAuthData: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      },
    }),
    {
      name: 'ecg-auth-storage',
      partialize: (state: AuthStore) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export { useAuthStore }
export type { AuthStore, User }
