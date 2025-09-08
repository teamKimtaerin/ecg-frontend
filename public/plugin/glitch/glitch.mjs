/**
 * Glitch Text Effect Plugin
 * 디지털 오류처럼 텍스트가 흔들리고 깜빡이는 애니메이션 효과
 */

export class GlitchPlugin {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      glitchIntensity: 5,
      animationDuration: 2,
      glitchFrequency: 0.3,
      colorSeparation: true,
      noiseEffect: true,
      ...options,
    }

    this.timeline = null
    this.init()
  }

  init() {
    if (!window.gsap) {
      console.error('GSAP is required for Glitch effect')
      return
    }

    this.setupGlitchElements()
    this.applyGlitchEffect()
  }

  /**
   * 글리치 효과를 위한 DOM 구조 설정
   */
  setupGlitchElements() {
    if (!this.element) return

    const text = this.element.textContent || ''
    this.element.innerHTML = ''
    this.element.className = 'glitch-text'
    this.element.style.position = 'relative'
    this.element.style.display = 'inline-block'

    if (!text.trim()) {
      this.element.textContent = '안녕하세요!'
      return
    }

    // 메인 텍스트
    const mainText = document.createElement('span')
    mainText.className = 'glitch-main'
    mainText.textContent = text
    mainText.style.position = 'relative'
    mainText.style.display = 'inline-block'
    mainText.style.color = '#fff'
    this.element.appendChild(mainText)

    // 색상 분리 효과를 위한 레이어들
    if (this.options.colorSeparation) {
      // 빨간색 레이어
      const redLayer = document.createElement('span')
      redLayer.className = 'glitch-red'
      redLayer.textContent = text
      redLayer.style.position = 'absolute'
      redLayer.style.top = '0'
      redLayer.style.left = '0'
      redLayer.style.color = '#ff0000'
      redLayer.style.opacity = '0.8'
      redLayer.style.mixBlendMode = 'screen'
      this.element.appendChild(redLayer)

      // 시안색 레이어
      const cyanLayer = document.createElement('span')
      cyanLayer.className = 'glitch-cyan'
      cyanLayer.textContent = text
      cyanLayer.style.position = 'absolute'
      cyanLayer.style.top = '0'
      cyanLayer.style.left = '0'
      cyanLayer.style.color = '#00ffff'
      cyanLayer.style.opacity = '0.8'
      cyanLayer.style.mixBlendMode = 'screen'
      this.element.appendChild(cyanLayer)
    }

    // 노이즈 효과
    if (this.options.noiseEffect) {
      const noiseLayer = document.createElement('span')
      noiseLayer.className = 'glitch-noise'
      noiseLayer.textContent = text
      noiseLayer.style.position = 'absolute'
      noiseLayer.style.top = '0'
      noiseLayer.style.left = '0'
      noiseLayer.style.color = '#fff'
      noiseLayer.style.opacity = '0.1'
      this.element.appendChild(noiseLayer)
    }
  }

  /**
   * 글리치 애니메이션 효과 적용
   */
  applyGlitchEffect() {
    if (!window.gsap || !this.element) return

    const {
      glitchIntensity,
      animationDuration,
      glitchFrequency,
      colorSeparation,
      noiseEffect,
    } = this.options

    // 기존 타임라인 정리
    if (this.timeline) {
      this.timeline.kill()
    }

    // 새로운 타임라인 생성
    this.timeline = window.gsap.timeline({ repeat: -1 })

    const mainText = this.element.querySelector('.glitch-main')
    const redLayer = this.element.querySelector('.glitch-red')
    const cyanLayer = this.element.querySelector('.glitch-cyan')
    const noiseLayer = this.element.querySelector('.glitch-noise')

    // 메인 텍스트 글리치
    this.timeline.to(mainText, {
      x: () => (Math.random() - 0.5) * glitchIntensity,
      y: () => (Math.random() - 0.5) * glitchIntensity,
      duration: glitchFrequency,
      ease: 'none',
    })

    // 색상 분리 효과
    if (colorSeparation && redLayer && cyanLayer) {
      this.timeline.to(
        redLayer,
        {
          x: () => (Math.random() - 0.5) * glitchIntensity * 2,
          y: () => (Math.random() - 0.5) * glitchIntensity * 0.5,
          duration: glitchFrequency,
          ease: 'none',
        },
        0
      )

      this.timeline.to(
        cyanLayer,
        {
          x: () => (Math.random() - 0.5) * glitchIntensity * -2,
          y: () => (Math.random() - 0.5) * glitchIntensity * 0.5,
          duration: glitchFrequency,
          ease: 'none',
        },
        0
      )
    }

    // 노이즈 효과
    if (noiseEffect && noiseLayer) {
      this.timeline.to(
        noiseLayer,
        {
          opacity: () => Math.random() * 0.5,
          x: () => (Math.random() - 0.5) * glitchIntensity * 3,
          duration: glitchFrequency * 0.5,
          ease: 'none',
        },
        0
      )
    }

    // 깜빡임 효과
    this.timeline.to(
      mainText,
      {
        opacity: 0,
        duration: 0.1,
        repeat: 1,
        yoyo: true,
        ease: 'none',
      },
      glitchFrequency * 0.7
    )

    // 스케일 글리치
    this.timeline.to(
      this.element,
      {
        scaleX: () => 1 + (Math.random() - 0.5) * 0.1,
        scaleY: () => 1 + (Math.random() - 0.5) * 0.05,
        duration: glitchFrequency,
        ease: 'none',
      },
      0
    )

    // 전체 애니메이션 지속시간 설정
    this.timeline.duration(animationDuration)
  }

  /**
   * 옵션 업데이트 및 애니메이션 재적용
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }

    // 기존 애니메이션 정리
    if (this.timeline) {
      this.timeline.kill()
    }

    // DOM 재구성 및 애니메이션 재적용
    this.setupGlitchElements()
    this.applyGlitchEffect()
  }

  /**
   * 텍스트 변경
   */
  updateText(newText) {
    if (!this.element) return

    const originalText = this.element.textContent
    this.element.textContent = newText

    // 기존 애니메이션 정리
    if (this.timeline) {
      this.timeline.kill()
    }

    // DOM 재구성 및 애니메이션 재적용
    this.setupGlitchElements()
    this.applyGlitchEffect()
  }

  /**
   * 애니메이션 재시작
   */
  restart() {
    if (this.timeline) {
      this.timeline.restart()
    }
  }

  /**
   * 애니메이션 일시정지
   */
  pause() {
    if (this.timeline) {
      this.timeline.pause()
    }
  }

  /**
   * 애니메이션 재개
   */
  resume() {
    if (this.timeline) {
      this.timeline.resume()
    }
  }

  /**
   * 플러그인 정리
   */
  destroy() {
    if (this.timeline) {
      this.timeline.kill()
    }

    if (this.element) {
      this.element.innerHTML = this.element.textContent
      this.element.style.position = ''
      this.element.style.display = ''
    }
  }
}

// 글로벌 사용을 위한 윈도우 객체 등록
if (typeof window !== 'undefined') {
  window.GlitchPlugin = GlitchPlugin
}

export default GlitchPlugin
