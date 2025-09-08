/**
 * Rotation Text Effect Plugin
 * 텍스트가 회전하면서 나타나는 애니메이션 효과
 */

export class RotationPlugin {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      rotationAngle: 180,
      rotationSpeed: 1,
      animationDuration: 2,
      staggerDelay: 0.3,
      rotationDirection: 'right',
      enableGradient: false,
      ...options,
    }

    this.init()
  }

  init() {
    if (!window.gsap) {
      console.error('GSAP is required for rotation effect')
      return
    }

    this.splitTextIntoWords()
    this.applyRotationEffect()
  }

  /**
   * 텍스트를 단어별로 분리하여 DOM 구조 생성
   */
  splitTextIntoWords() {
    if (!this.element) return

    const text = this.element.textContent || ''
    this.element.innerHTML = ''
    this.element.className = 'demo-text'

    if (!text.trim()) {
      this.element.textContent = '안녕하세요!'
      return
    }

    const words = text.split(' ')
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span')
      wordSpan.className = 'word'
      wordSpan.style.display = 'inline-block'
      wordSpan.style.marginRight = '0.3em'

      for (let i = 0; i < word.length; i++) {
        const char = word.charAt(i)
        const charSpan = document.createElement('span')
        charSpan.className = 'char'
        charSpan.textContent = char
        charSpan.style.display = 'inline-block'
        wordSpan.appendChild(charSpan)
      }

      this.element.appendChild(wordSpan)
      if (wordIndex < words.length - 1) {
        this.element.appendChild(document.createTextNode(' '))
      }
    })
  }

  /**
   * 회전 애니메이션 효과 적용
   */
  applyRotationEffect() {
    if (!window.gsap || !this.element) return

    const words = this.element.querySelectorAll('.word')

    const {
      rotationAngle,
      rotationSpeed,
      animationDuration,
      staggerDelay,
      rotationDirection,
      enableGradient,
      easingType,
      scaleEffect,
      scaleAmount,
      opacityEffect,
      rotationOrigin,
      yOffset,
      xOffset,
      enableShadow,
      shadowColor,
      enableBlur,
      blurAmount,
      repeatAnimation,
      repeatDelay,
    } = this.options

    const duration = animationDuration / rotationSpeed

    // 회전 방향 계산
    let finalAngle
    if (rotationDirection === 'alternate') {
      // 교대로 회전
    } else {
      finalAngle =
        rotationDirection === 'right' ? rotationAngle : -rotationAngle
    }

    words.forEach((word, index) => {
      // 교대 회전인 경우
      if (rotationDirection === 'alternate') {
        finalAngle = index % 2 === 0 ? rotationAngle : -rotationAngle
      }

      // 그라데이션 효과 적용
      if (enableGradient) {
        word.style.background =
          'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)'
        word.style.backgroundClip = 'text'
        word.style.webkitBackgroundClip = 'text'
        word.style.webkitTextFillColor = 'transparent'
        word.style.backgroundSize = '200% 200%'
      } else {
        word.style.background = 'none'
        word.style.color = '#fff'
      }

      // 그림자 효과
      if (enableShadow) {
        word.style.textShadow = `2px 2px 4px ${shadowColor}`
      }

      // 초기 상태 설정
      const initialProps = {
        scale: scaleEffect ? scaleAmount : 1,
        rotation: finalAngle,
        transformOrigin: rotationOrigin,
        y: yOffset,
        x: xOffset,
      }

      // 투명도 효과
      if (opacityEffect) {
        initialProps.opacity = 0
      }

      // 블러 효과
      if (enableBlur) {
        initialProps.filter = `blur(${blurAmount}px)`
      }

      window.gsap.set(word, initialProps)

      // 애니메이션 속성
      const animateProps = {
        scale: 1,
        rotation: 0,
        y: 0,
        x: 0,
        duration: duration,
        delay: index * staggerDelay,
        ease: easingType || 'power2.out',
      }

      // 투명도 애니메이션
      if (opacityEffect) {
        animateProps.opacity = 1
      }

      // 블러 제거 애니메이션
      if (enableBlur) {
        animateProps.filter = 'blur(0px)'
      }

      // 반복 애니메이션 설정
      if (repeatAnimation) {
        animateProps.repeat = -1
        animateProps.repeatDelay = repeatDelay
        animateProps.yoyo = true
      }

      window.gsap.to(word, animateProps)

      // 그라데이션 애니메이션
      if (enableGradient) {
        window.gsap.to(word, {
          backgroundPosition: '200% 200%',
          duration: duration * 2,
          delay: index * staggerDelay,
          repeat: -1,
          yoyo: true,
          ease: 'none',
        })
      }

      // 그림자 애니메이션
      if (enableShadow) {
        window.gsap.to(word, {
          textShadow: `0px 0px 0px ${shadowColor}`,
          duration: duration,
          delay: index * staggerDelay,
          ease: easingType || 'power2.out',
        })
      }
    })
  }

  /**
   * 옵션 업데이트 및 애니메이션 재적용
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }

    // 기존 애니메이션 정리
    window.gsap.killTweensOf(this.element.querySelectorAll('.word'))

    // 새로운 옵션으로 애니메이션 재적용
    this.applyRotationEffect()
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
    this.splitTextIntoWords()
    this.applyRotationEffect()
  }

  /**
   * 애니메이션 재시작
   */
  restart() {
    window.gsap.killTweensOf('*')
    this.applyRotationEffect()
  }

  /**
   * 플러그인 정리
   */
  destroy() {
    if (this.element) {
      window.gsap.killTweensOf(this.element.querySelectorAll('.word'))
      this.element.innerHTML = this.element.textContent
    }
  }
}

// 글로벌 사용을 위한 윈도우 객체 등록
if (typeof window !== 'undefined') {
  window.RotationPlugin = RotationPlugin
}

export default RotationPlugin
