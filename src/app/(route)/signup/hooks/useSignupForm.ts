'use client'

import { useState } from 'react'
import { SignupFormData, SignupFormErrors } from '../types'
import { GoogleUserInfo } from '@/types/google-auth'

export const useSignupForm = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 'over14',
  })

  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: SignupFormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.'
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 6 || formData.password.length > 16) {
      newErrors.password = '비밀번호는 6자~16자 사이여야 합니다.'
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '비밀번호는 영문과 숫자를 포함해야 합니다.'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement actual signup logic
      console.log('Signup form submitted:', formData)
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      // Handle successful signup
      console.log('Signup successful')
    } catch (error) {
      console.error('Signup failed:', error)
      setErrors({
        general: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async (userInfo: GoogleUserInfo) => {
    try {
      console.log('Google signup success:', userInfo)
      // TODO: Send userInfo to backend for user registration/login

      // Example of what userInfo contains:
      // {
      //   sub: "google_user_id",
      //   name: "Full Name",
      //   email: "user@example.com",
      //   picture: "profile_picture_url",
      //   given_name: "First Name",
      //   family_name: "Last Name",
      //   email_verified: true
      // }

      // Handle successful Google signup (redirect, store token, etc.)
      alert(`Google 회원가입 성공! 환영합니다, ${userInfo.name}님!`)
    } catch (error) {
      console.error('Google signup failed:', error)
      setErrors({
        general: 'Google 회원가입 중 오류가 발생했습니다.',
      })
    }
  }

  const handleGoogleSignupError = () => {
    setErrors({
      general: 'Google 회원가입이 취소되었거나 오류가 발생했습니다.',
    })
  }

  return {
    formData,
    errors,
    showPassword,
    showConfirmPassword,
    isLoading,
    handleInputChange,
    setShowPassword,
    setShowConfirmPassword,
    handleSubmit,
    handleGoogleSignup,
    handleGoogleSignupError,
  }
}
