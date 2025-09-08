/**
 * Fade In Stagger Text Effect Plugin
 * 글자들이 하나씩 순차적으로 서서히 나타나는 클래식한 페이드인 애니메이션 효과
 */

export class FadeInStaggerPlugin {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      staggerDelay: 0.1,
      animationDuration: 0.8,
      startOpacity: 0,
      scaleStart: 0.9,
      ease: 'power2.out',
      ...options,
    }

    this.init()
  }

  init() {
    if (!window.gsap) {
      console.error('GSAP is required for Fade In Stagger effect')
      return
    }

    this.splitTextIntoCharacters()
    this.applyFadeInStaggerEffect()
  }

  /**
   * 텍스트를 글자별로 분리하여 DOM 구조 생성
   */
  splitTextIntoCharacters() {
    if (!this.element) return

    const text = this.element.textContent || ''
    this.element.innerHTML = ''
    this.element.className = 'fade-in-stagger-text'
    this.element.style.position = 'relative'
    this.element.style.display = 'inline-block'

    if (!text.trim()) {
      this.element.textContent = '안녕하세요!'
      return
    }

    // 각 글자를 개별 span으로 분리
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i)
      const charSpan = document.createElement('span')
      charSpan.className = 'fade-char'
      charSpan.textContent = char === ' ' ? '\u00A0' : char // 공백 처리
      charSpan.style.display = 'inline-block'
      charSpan.style.position = 'relative'
      charSpan.style.color = '#fff'
      this.element.appendChild(charSpan)
    }
  }

  /**
   * 페이드 인 순차 애니메이션 효과 적용
   */
  applyFadeInStaggerEffect() {
    if (!window.gsap || !this.element) return

    const chars = this.element.querySelectorAll('.fade-char')

    const { staggerDelay, animationDuration, startOpacity, scaleStart, ease } =
      this.options

    chars.forEach((char, index) => {
      // 초기 상태 설정 (순수 페이드인 - 슬라이드 없음)
      window.gsap.set(char, {
        opacity: startOpacity,
        scale: scaleStart,
        transformOrigin: 'center center',
      })

      // 순수 페이드 인 애니메이션
      window.gsap.to(char, {
        opacity: 1,
        scale: 1,
        duration: animationDuration,
        delay: index * staggerDelay,
        ease: ease,
        // 미묘한 색상 변화 효과
        onStart: () => {
          char.style.filter = 'brightness(1.3)'
          char.style.textShadow = '0 0 5px rgba(255,255,255,0.3)'
        },
        onComplete: () => {
          // 밝기와 글로우 효과 제거
          window.gsap.to(char, {
            filter: 'brightness(1)',
            textShadow: '0 0 0px rgba(255,255,255,0)',
            duration: 0.4,
            ease: 'power1.out',
          })
        },
      })

      // 미묘한 펄스 효과 (스케일 변동)
      window.gsap.to(char, {
        scale: 1.03,
        duration: animationDuration * 0.2,
        delay: index * staggerDelay + animationDuration * 0.6,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      })

      // 색상 그라데이션 효과
      window.gsap.fromTo(
        char,
        {
          color: '#999999',
        },
        {
          color: '#ffffff',
          duration: animationDuration * 0.8,
          delay: index * staggerDelay + animationDuration * 0.2,
          ease: 'power1.inOut',
        }
      )
    })
  }

  /**
   * 옵션 업데이트 및 애니메이션 재적용
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }

    // 기존 애니메이션 정리
    window.gsap.killTweensOf(this.element.querySelectorAll('.fade-char'))

    // 새로운 옵션으로 애니메이션 재적용
    this.applyFadeInStaggerEffect()
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
    this.applyFadeInStaggerEffect()
  }

  /**
   * 애니메이션 재시작
   */
  restart() {
    window.gsap.killTweensOf(this.element.querySelectorAll('.fade-char'))
    this.applyFadeInStaggerEffect()
  }

  /**
   * 플러그인 정리
   */
  destroy() {
    if (this.element) {
      window.gsap.killTweensOf(this.element.querySelectorAll('.fade-char'))
      this.element.innerHTML = this.element.textContent
      this.element.style.position = ''
      this.element.style.display = ''
    }
  }
}

// 글로벌 사용을 위한 윈도우 객체 등록
if (typeof window !== 'undefined') {
  window.FadeInStaggerPlugin = FadeInStaggerPlugin
}

export default FadeInStaggerPlugin
