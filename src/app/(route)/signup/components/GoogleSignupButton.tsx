'use client'

import React from 'react'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { GoogleUserInfo } from '@/types/google-auth'

interface GoogleSignupButtonProps {
  onSuccess?: (userInfo: GoogleUserInfo) => void
  onError?: () => void
  disabled?: boolean
}

const GoogleSignupButton: React.FC<GoogleSignupButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <GoogleSignInButton
        text="signup_with"
        theme="outline"
        size="large"
        width={400}
        disabled={disabled}
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  )
}

export default GoogleSignupButton
