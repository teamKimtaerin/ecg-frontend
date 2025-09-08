'use client'

import React from 'react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { GoogleUserInfo } from '@/types/google-auth'

interface GoogleSignInButtonProps {
  onSuccess?: (userInfo: GoogleUserInfo) => void
  onError?: () => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  width?: number
  disabled?: boolean
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = 'signup_with',
  theme = 'outline',
  size = 'large',
  width,
  disabled = false,
}) => {
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    try {
      if (credentialResponse.credential) {
        const decoded = jwtDecode<GoogleUserInfo>(credentialResponse.credential)
        console.log('Google Sign-In Success:', decoded)
        onSuccess?.(decoded)
      }
    } catch (error) {
      console.error('Failed to decode Google credential:', error)
      onError?.()
    }
  }

  const handleError = () => {
    console.log('Google Sign-In Failed')
    onError?.()
  }

  if (disabled) {
    return (
      <div className="w-full">
        <div className="opacity-50 pointer-events-none">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            text={text}
            theme={theme}
            size={size}
            width={width}
            useOneTap={false}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        text={text}
        theme={theme}
        size={size}
        width={width}
        useOneTap={false} // 원탭 로그인 비활성화 (필요시 true로 변경)
      />
    </div>
  )
}

export default GoogleSignInButton
