'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

import Header from '@/components/ui/Header'
import UploadModal from '@/components/UploadModal'
import { useUploadModal } from '@/hooks/useUploadModal'
import { SCROLL_CONSTANTS, FILE_SIZE_LIMITS } from '@/lib/utils/constants'

export default function Home() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isTranscriptionModalOpen, setIsTranscriptionModalOpen] =
    useState(false)
  const { handleFileSelect, handleStartTranscription } = useUploadModal()

  const heroRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const editRef = useRef<HTMLElement>(null)
  const subtitleRef = useRef<HTMLElement>(null)
  const votRef = useRef<HTMLElement>(null)
  const libraryRef = useRef<HTMLElement>(null)

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY

    if (currentScrollY < SCROLL_CONSTANTS.HEADER_SHOW_THRESHOLD) {
      if (!isHeaderVisible) setIsHeaderVisible(true)
    } else if (
      Math.abs(currentScrollY - lastScrollY) >
      SCROLL_CONSTANTS.SCROLL_SENSITIVITY
    ) {
      const shouldShow = currentScrollY < lastScrollY
      if (shouldShow !== isHeaderVisible) {
        setIsHeaderVisible(shouldShow)
        setLastScrollY(currentScrollY)
      }
    }
  }, [lastScrollY, isHeaderVisible])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const throttledScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, SCROLL_CONSTANTS.THROTTLE_FPS) // ~60fps
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      clearTimeout(timeoutId)
    }
  }, [handleScroll])

  // Intersection Observer for section fade-in animations
  useEffect(() => {
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            if (process.env.NODE_ENV === 'development') {
              console.log('Section became visible:', entry.target)
            }
          }
        })
      },
      {
        rootMargin: SCROLL_CONSTANTS.INTERSECTION_ROOT_MARGIN,
        threshold: SCROLL_CONSTANTS.INTERSECTION_THRESHOLD,
      }
    )

    const refs = [
      heroRef,
      featuresRef,
      editRef,
      subtitleRef,
      votRef,
      libraryRef,
    ]

    refs.forEach((ref) => {
      if (ref.current) {
        fadeObserver.observe(ref.current)
        if (process.env.NODE_ENV === 'development') {
          console.log('Observing element:', ref.current)
        }
      }
    })

    return () => {
      fadeObserver.disconnect()
    }
  }, [])

  const wrappedHandleStartTranscription = (
    data: Parameters<typeof handleStartTranscription>[0]
  ) => {
    return handleStartTranscription(
      data,
      () => setIsTranscriptionModalOpen(false),
      true
    )
  }

  return (
    <div className="font-sans min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-40">
          <div className="absolute bottom-1/4 left-3/11 w-86 h-86 bg-primary rounded-full filter blur-3xl bg-blob animate-blob animation-delay-0"></div>
          <div className="absolute top-1/3 left-4/7 w-72 h-72 bg-primary-light rounded-full filter blur-3xl bg-blob animate-blob animation-delay-[1000ms]"></div>
          <div className="absolute bottom-1/7 left-6/11 w-64 h-64 bg-amber-300 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-[2500ms]"></div>
          <div className="absolute bottom-2/4 left-4/11 w-86 h-86 bg-red-500 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-[4000ms]"></div>
          <div className="absolute bottom-1/9 left-1/11 w-56 h-56 bg-green-500 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-[5000ms]"></div>
          <div className="absolute bottom-1/3 left-5/11 w-56 h-56 bg-white rounded-full filter blur-3xl bg-blob animate-blob animation-delay-[2000ms]"></div>
          <div className="absolute bottom-6/11 left-9/11 w-56 h-56 bg-fuchsia-600 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-[3000ms]"></div>
        </div>
      </div>

      {/* Main content with higher z-index */}
      <div className="relative z-10">
        {/* Header */}
        <Header isVisible={isHeaderVisible} />
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isTranscriptionModalOpen}
        onClose={() => setIsTranscriptionModalOpen(false)}
        onFileSelect={handleFileSelect}
        onStartTranscription={wrappedHandleStartTranscription}
        acceptedTypes={['audio/*', 'video/*']}
        maxFileSize={FILE_SIZE_LIMITS.large} // 100MB
        multiple={true}
        isLoading={false}
      />
    </div>
  )
}
