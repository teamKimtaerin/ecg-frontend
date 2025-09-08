'use client'

import React from 'react'
import GoogleSignInButton from './GoogleSignInButton'
import { GoogleUserInfo } from '@/types/google-auth'

interface GoogleLoginButtonProps {
  onSuccess?: (userInfo: GoogleUserInfo) => void
  onError?: () => void
  disabled?: boolean
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <GoogleSignInButton
        text="signin_with"
        theme="outline"
        size="large"
        disabled={disabled}
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  )
}

export default GoogleLoginButton
