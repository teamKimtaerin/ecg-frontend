'use client'

import React from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'

interface GoogleAuthProviderProps {
  children: React.ReactNode
}

const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({
  children,
}) => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    console.warn(
      'Google Client ID not found. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.'
    )
    return <>{children}</>
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
  )
}

export default GoogleAuthProvider
