'use client'

import React, { useState, useEffect } from 'react'

interface FloatingQuestionProps {
  question: string
  delay: number
  onQuestionClick: (question: string) => void
  isActive: boolean
}

const FloatingQuestion: React.FC<FloatingQuestionProps> = ({
  question,
  delay,
  onQuestionClick,
  isActive,
}) => {
  const [animationClass, setAnimationClass] = useState('')
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setShouldRender(true)
        setAnimationClass('animate-float-up-fade')
      }, delay)

      return () => clearTimeout(timer)
    } else {
      setShouldRender(false)
      setAnimationClass('')
    }
  }, [isActive, delay])

  const handleClick = () => {
    onQuestionClick(question)
  }

  if (!shouldRender) {
    return null
  }

  return (
    <>
      <style jsx>{`
        @keyframes floatUpFade {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          50% {
            transform: translateY(0%);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        .animate-float-up-fade {
          animation: floatUpFade 4s ease-in-out;
          opacity: 0;
          transform: translateY(100%);
        }
      `}</style>
      <div
        className={`
          cursor-pointer mb-3 ${animationClass}
        `}
        style={{
          animationDelay: `${delay}ms`,
        }}
        onClick={handleClick}
      >
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg px-4 py-2 hover:from-purple-100 hover:to-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 group">
          <p className="text-sm text-purple-700 font-medium group-hover:text-purple-800">
            💬 {question}
          </p>
        </div>
      </div>
    </>
  )
}

export default FloatingQuestion
