'use client'

import React from 'react'

interface GoogleAuthProviderProps {
  children: React.ReactNode
}

// 백엔드 중심 OAuth를 사용하므로 클라이언트 측 Google OAuth Provider는 불필요
const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({
  children,
}) => {
  // 백엔드에서 Google OAuth를 처리하므로 단순히 children만 반환
  return <>{children}</>
}

export default GoogleAuthProvider
