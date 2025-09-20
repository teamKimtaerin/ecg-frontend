import {
  AuthAPI,
  type LoginRequest,
  type SignupRequest,
  type User,
} from '@/lib/api/auth'
import { create } from 'zustand'

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
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
  setAuthData: (user: User, token: string | null) => void
  refreshAccessToken: () => Promise<string | null>
}

type AuthStore = AuthState & AuthActions

const useAuthStore = create<AuthStore>()((set, get) => ({
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
          error instanceof Error ? error.message : '회원가입에 실패했습니다.',
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

  logout: async () => {
    try {
      // 서버에 로그아웃 요청 (refresh token 쿠키 삭제)
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/logout`,
        {
          method: 'POST',
          credentials: 'include',
        }
      )
    } catch (error) {
      console.error('Logout API failed:', error)
    }

    // 클라이언트 상태 초기화
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    })
  },

  getCurrentUser: async () => {
    const { token } = get()

    try {
      set({ isLoading: true, error: null })

      // 토큰이 있으면 Bearer 인증, 없으면 쿠키 인증 시도
      const user = await AuthAPI.getCurrentUser(token || undefined)

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

  setAuthData: (user: User, token: string | null) => {
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })
  },

  // 새로운 토큰 갱신 기능
  refreshAccessToken: async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/refresh`,
        {
          method: 'POST',
          credentials: 'include', // 쿠키 포함
        }
      )

      if (response.ok) {
        const data = await response.json()
        set({ token: data.access_token })
        return data.access_token
      } else {
        // Refresh token 만료 시 로그아웃
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })

        return null
      }
    } catch {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: 'Token refresh failed',
      })
      return null
    }
  },
}))

export { useAuthStore }
export type { AuthStore, User }
