'use client'

import { useAuth } from './useAuth'

export const useAuthStatus = () => {
  const {
    user,
    token,
    isLoading,
    logout: authLogout,
    isAuthenticated,
  } = useAuth()

  console.log('Auth status check:', {
    token: !!token,
    user: !!user,
    isAuthenticated,
  })

  const logout = () => {
    authLogout()
  }

  return {
    isLoggedIn: isAuthenticated,
    user,
    isLoading,
    logout,
  }
}
