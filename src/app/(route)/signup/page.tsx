'use client'

import { useSignupForm } from './hooks/useSignupForm'
import SignupFormFields from './components/SignupFormFields'
import GoogleSignupButton from './components/GoogleSignupButton'
import ErrorMessage from './components/ErrorMessage'
import SignupHeader from './components/SignupHeader'
import SignupButton from './components/SignupButton'
import LoginLink from './components/LoginLink'
import FormDivider from './components/FormDivider'

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
  } = useSignupForm()

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-40">
          <div className="absolute bottom-1/4 left-3/11 w-86 h-86 bg-primary rounded-full filter blur-3xl bg-blob animate-blob animation-delay-0"></div>
          <div className="absolute top-1/3 left-4/7 w-72 h-72 bg-primary-light rounded-full filter blur-3xl bg-blob animate-blob animation-delay-1000"></div>
          <div className="absolute bottom-1/7 left-6/11 w-64 h-64 bg-amber-300 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-2500"></div>
          <div className="absolute bottom-2/4 left-4/11 w-86 h-86 bg-red-500 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-1/9 left-1/11 w-56 h-56 bg-green-500 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-5000"></div>
          <div className="absolute bottom-1/3 left-5/11 w-56 h-56 bg-white rounded-full filter blur-3xl bg-blob animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-6/11 left-9/11 w-56 h-56 bg-fuchsia-600 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-3000"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl p-10 shadow-2xl border border-gray-200">
          <SignupHeader />

          <ErrorMessage message={errors.general} />

          <GoogleSignupButton disabled={isLoading} />

          <FormDivider text="혹은 이메일로 회원가입" />

          <form onSubmit={handleSubmit} className="space-y-6">
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

          <LoginLink
            onLoginRedirect={() => (window.location.href = '/auth?mode=login')}
          />
        </div>
      </div>
    </div>
  )
}
