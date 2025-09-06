'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import Button from '@/components/ui/Button'
import EditTranscriptionSection from './components/LandingPage/EditTranscriptionSection'
import FastTranscriptionSection from './components/LandingPage/FastTranscriptionSection'
import Footer from './components/LandingPage/Footer'
import HeroSection from './components/LandingPage/HeroSection'
import OpenLibrarySection from './components/LandingPage/OpenLibrarySection'
import SubtitleEditorSection from './components/LandingPage/SubtitleEditorSection'
import VoTSection from './components/LandingPage/VoTSection'
import UploadModal from './components/UploadModal'
import { useUploadModal } from '@/hooks/useUploadModal'

export default function Home() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isTranscriptionModalOpen, setIsTranscriptionModalOpen] =
    useState(false)
  const { isTranscriptionLoading, handleFileSelect, handleStartTranscription } =
    useUploadModal()

  const heroRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const editRef = useRef<HTMLElement>(null)
  const subtitleRef = useRef<HTMLElement>(null)
  const votRef = useRef<HTMLElement>(null)
  const libraryRef = useRef<HTMLElement>(null)

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY

    if (currentScrollY < 50) {
      if (!isHeaderVisible) setIsHeaderVisible(true)
    } else if (Math.abs(currentScrollY - lastScrollY) > 15) {
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
      timeoutId = setTimeout(handleScroll, 16) // ~60fps
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
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.2,
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
          <div className="absolute top-1/3 left-4/7 w-72 h-72 bg-primary-light rounded-full filter blur-3xl bg-blob animate-blob animation-delay-1000"></div>
          <div className="absolute bottom-1/7 left-6/11 w-64 h-64 bg-amber-300 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-2500"></div>
          <div className="absolute bottom-2/4 left-4/11 w-86 h-86 bg-red-500 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-1/9 left-1/11 w-56 h-56 bg-green-500 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-5000"></div>
          <div className="absolute bottom-1/3 left-5/11 w-56 h-56 bg-white rounded-full filter blur-3xl bg-blob animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-6/11 left-9/11 w-56 h-56 bg-fuchsia-600 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-3000"></div>
        </div>
      </div>

      {/* Main content with higher z-index */}
      <div className="relative z-10">
        {/* Header */}
        <header
          className={`fixed top-0 w-full bg-black/90 border-b border-gray-slate/20 z-50 transition-transform duration-300 ${
            isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <Image
                  src="/logo.svg"
                  alt="ECG Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                />
                <h1 className="text-h3 text-white font-bold">ECG</h1>
              </Link>
              <nav className="hidden md:flex items-center space-x-8">
                <Link
                  href="/transcriptions"
                  className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <a
                  href="#features"
                  className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#open-library"
                  className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
                >
                  Open Library
                </a>
                <a
                  href="#vot"
                  className="flex items-center space-x-1 text-sm text-gray-medium font-bold hover:text-white transition-colors"
                >
                  <span>VoT</span>
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
                >
                  Login
                </a>
                <Button
                  variant="accent"
                  size="medium"
                  className="font-bold rounded-full"
                >
                  Sign up
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <HeroSection heroRef={heroRef} />

        {/* Fast Transcription Section */}
        <FastTranscriptionSection
          featuresRef={featuresRef}
          onTranscriptionClick={() => setIsTranscriptionModalOpen(true)}
        />

        {/* Edit Transcription Section */}
        <EditTranscriptionSection editRef={editRef} />

        {/* Subtitle Editor Section */}
        <SubtitleEditorSection subtitleRef={subtitleRef} />

        {/* VoT Section */}
        <VoTSection votRef={votRef} />

        {/* Open Library Section */}
        <OpenLibrarySection libraryRef={libraryRef} />

        {/* Footer */}
        <Footer />
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isTranscriptionModalOpen}
        onClose={() =>
          !isTranscriptionLoading && setIsTranscriptionModalOpen(false)
        }
        onFileSelect={handleFileSelect}
        onStartTranscription={wrappedHandleStartTranscription}
        acceptedTypes={['audio/*', 'video/*']}
        maxFileSize={100 * 1024 * 1024} // 100MB
        multiple={true}
        isLoading={isTranscriptionLoading}
      />
    </div>
  )
}
