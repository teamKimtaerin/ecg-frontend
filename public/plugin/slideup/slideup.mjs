/**
 * Slide Up Text Effect Plugin
 * 글자들이 아래에서 위로 부드럽게 슬라이딩하며 나타나는 현대적인 애니메이션 효과
 */

export class SlideUpPlugin {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      slideDistance: 50,
      animationDuration: 0.8,
      staggerDelay: 0.1,
      overshoot: 10,
      blurEffect: true,
      ...options,
    }

    this.init()
  }

  init() {
    if (!window.gsap) {
      console.error('GSAP is required for Slide Up effect')
      return
    }

    this.splitTextIntoCharacters()
    this.applySlideUpEffect()
  }

  /**
   * 텍스트를 글자별로 분리하여 DOM 구조 생성
   */
  splitTextIntoCharacters() {
    if (!this.element) return

    const text = this.element.textContent || ''
    this.element.innerHTML = ''
    this.element.className = 'slide-up-text'
    this.element.style.position = 'relative'
    this.element.style.display = 'inline-block'
    this.element.style.overflow = 'hidden'

    if (!text.trim()) {
      this.element.textContent = '안녕하세요!'
      return
    }

    // 각 글자를 개별 span으로 분리
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i)
      const charSpan = document.createElement('span')
      charSpan.className = 'slide-char'
      charSpan.textContent = char === ' ' ? '\u00A0' : char // 공백 처리
      charSpan.style.display = 'inline-block'
      charSpan.style.position = 'relative'
      charSpan.style.color = '#fff'
      charSpan.style.overflow = 'hidden'
      this.element.appendChild(charSpan)
    }
  }

  /**
   * 슬라이드 업 애니메이션 효과 적용
   */
  applySlideUpEffect() {
    if (!window.gsap || !this.element) return

    const chars = this.element.querySelectorAll('.slide-char')

    const {
      slideDistance,
      animationDuration,
      staggerDelay,
      overshoot,
      blurEffect,
    } = this.options

    chars.forEach((char, index) => {
      // 초기 상태 설정
      window.gsap.set(char, {
        y: slideDistance,
        opacity: 0,
        scale: 0.95,
        transformOrigin: 'center bottom',
        filter: blurEffect ? 'blur(3px)' : 'blur(0px)',
      })

      // 슬라이드 업 애니메이션 타임라인
      const timeline = window.gsap.timeline()

      // 1단계: 슬라이드 업 (오버슈트 포함)
      timeline.to(char, {
        y: overshoot > 0 ? -overshoot : 0,
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: animationDuration * 0.7,
        delay: index * staggerDelay,
        ease: 'power3.out',
        onStart: () => {
          // 슬라이딩 시작 시 미묘한 글로우 효과
          if (blurEffect) {
            char.style.textShadow = '0 0 8px rgba(255,255,255,0.3)'
          }
        },
      })

      // 2단계: 정확한 위치로 복귀 (오버슈트가 있는 경우만)
      if (overshoot > 0) {
        timeline.to(char, {
          y: 0,
          duration: animationDuration * 0.3,
          ease: 'power2.out',
          onComplete: () => {
            // 글로우 효과 제거
            if (blurEffect) {
              window.gsap.to(char, {
                textShadow: '0 0 0px rgba(255,255,255,0)',
                duration: 0.4,
                ease: 'power1.out',
              })
            }
          },
        })
      } else {
        // 오버슈트가 없는 경우 글로우 제거
        timeline.call(() => {
          if (blurEffect) {
            window.gsap.to(char, {
              textShadow: '0 0 0px rgba(255,255,255,0)',
              duration: 0.4,
              ease: 'power1.out',
            })
          }
        })
      }

      // 미묘한 추가 효과들
      // 스케일 미세 조정
      timeline.to(
        char,
        {
          scale: 1.02,
          duration: 0.2,
          delay: animationDuration * 0.1,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
        },
        '-=0.3'
      )

      // 색상 변화 (선택적)
      timeline.fromTo(
        char,
        {
          color: '#cccccc',
        },
        {
          color: '#ffffff',
          duration: animationDuration,
          ease: 'power1.inOut',
        },
        0
      )
    })

    // 전체 컨테이너에 미묘한 효과
    if (blurEffect) {
      window.gsap.fromTo(
        this.element,
        {
          filter: 'brightness(0.8)',
        },
        {
          filter: 'brightness(1)',
          duration:
            animationDuration * chars.length * staggerDelay + animationDuration,
          ease: 'power1.out',
        }
      )
    }
  }

  /**
   * 옵션 업데이트 및 애니메이션 재적용
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }

    // 기존 애니메이션 정리
    window.gsap.killTweensOf(this.element.querySelectorAll('.slide-char'))
    window.gsap.killTweensOf(this.element)

    // 새로운 옵션으로 애니메이션 재적용
    this.applySlideUpEffect()
  }

  /**
   * 텍스트 변경
   */
  updateText(newText) {
    if (!this.element) return

    this.element.textContent = newText

    // 기존 애니메이션 정리
    window.gsap.killTweensOf('*')

    // 텍스트 재분리 및 애니메이션 재적용
    this.splitTextIntoCharacters()
    this.applySlideUpEffect()
  }

  /**
   * 애니메이션 재시작
   */
  restart() {
    window.gsap.killTweensOf(this.element.querySelectorAll('.slide-char'))
    window.gsap.killTweensOf(this.element)
    this.applySlideUpEffect()
  }

  /**
   * 플러그인 정리
   */
  destroy() {
    if (this.element) {
      window.gsap.killTweensOf(this.element.querySelectorAll('.slide-char'))
      window.gsap.killTweensOf(this.element)
      this.element.innerHTML = this.element.textContent
      this.element.style.position = ''
      this.element.style.display = ''
      this.element.style.overflow = ''
    }
  }
}

// 글로벌 사용을 위한 윈도우 객체 등록
if (typeof window !== 'undefined') {
  window.SlideUpPlugin = SlideUpPlugin
}

export default SlideUpPlugin
