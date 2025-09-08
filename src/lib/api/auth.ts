interface SignupRequest {
  username: string
  email: string
  password: string
}

interface LoginRequest {
  email: string
  password: string
}

interface User {
  id: number
  username: string
  email: string
  auth_provider: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class AuthAPI {
  private static getHeaders(token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  static async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || '회원가입 중 오류가 발생했습니다.')
    }

    return response.json()
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || '로그인 중 오류가 발생했습니다.')
    }

    return response.json()
  }

  static async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(token),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        errorData.detail || '사용자 정보를 가져오는데 실패했습니다.'
      )
    }

    return response.json()
  }

  static getGoogleLoginUrl(): string {
    return `${BASE_URL}/api/auth/google/login`
  }
}

export type { SignupRequest, LoginRequest, User, AuthResponse }
