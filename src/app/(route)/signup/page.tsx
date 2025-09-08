'use client'

import React from 'react'
import PageLayout from '@/components/layout/PageLayout'
import {
  SignupHeader,
  GoogleSignupButton,
  FormDivider,
  SignupFormFields,
  SignupButton,
  LoginLink,
  ErrorMessage,
} from './components'
import { useSignupForm } from './hooks/useSignupForm'

export default function SignupPage() {
  const {
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
  } = useSignupForm()

  const handleLoginRedirect = () => {
    console.log('Redirect to login')
    // TODO: Implement navigation to login page
  }

  const handleTryClick = () => {
    console.log('Try button clicked')
    // TODO: Implement navigation to demo page
  }

  const handleLoginClick = () => {
    console.log('Login button clicked')
    // TODO: Open login modal or navigate to login page
  }

  return (
    <PageLayout onTryClick={handleTryClick} onLoginClick={handleLoginClick}>
      <div className="min-h-screen bg-white py-20">
        <div className="container mx-auto max-w-md px-4">
          <SignupHeader />

          <form onSubmit={handleSubmit} className="space-y-6">
            <ErrorMessage message={errors.general} />

            <GoogleSignupButton
              onSuccess={handleGoogleSignup}
              onError={handleGoogleSignupError}
              disabled={isLoading}
            />

            <FormDivider text="또는 이메일로 회원가입" />

            <SignupFormFields
              formData={formData}
              errors={errors}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              onInputChange={handleInputChange}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onToggleConfirmPassword={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            />

            <SignupButton isLoading={isLoading} />
          </form>

          <LoginLink onLoginRedirect={handleLoginRedirect} />
        </div>
      </div>
    </PageLayout>
  )
}
