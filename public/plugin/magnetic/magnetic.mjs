/**
 * Magnetic Pull Text Effect Plugin
 * 텍스트가 사방으로 흩어졌다가 자석에 끌려 모이듯 나타나는 애니메이션 효과
 */

export class MagneticPullPlugin {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      scatterDistance: 200,
      pullSpeed: 1.5,
      staggerDelay: 0.05,
      magneticStrength: 1.2,
      elasticEffect: true,
      ...options,
    }

    this.init()
  }

  init() {
    if (!window.gsap) {
      console.error('GSAP is required for Magnetic Pull effect')
      return
    }

    this.splitTextIntoCharacters()
    this.applyMagneticPullEffect()
  }

  /**
   * 텍스트를 글자별로 분리하여 DOM 구조 생성
   */
  splitTextIntoCharacters() {
    if (!this.element) return

    const text = this.element.textContent || ''
    this.element.innerHTML = ''
    this.element.className = 'magnetic-pull-text'
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
      charSpan.className = 'magnetic-char'
      charSpan.textContent = char === ' ' ? '\u00A0' : char // 공백 처리
      charSpan.style.display = 'inline-block'
      charSpan.style.position = 'relative'
      charSpan.style.color = '#fff'
      this.element.appendChild(charSpan)
    }
  }

  /**
   * 자석 끌어당기기 애니메이션 효과 적용
   */
  applyMagneticPullEffect() {
    if (!window.gsap || !this.element) return

    const chars = this.element.querySelectorAll('.magnetic-char')

    const {
      scatterDistance,
      pullSpeed,
      staggerDelay,
      magneticStrength,
      elasticEffect,
    } = this.options

    chars.forEach((char, index) => {
      // 랜덤한 방향과 거리로 흩어진 초기 위치 설정
      const angle = Math.random() * Math.PI * 2
      const distance = scatterDistance * (0.5 + Math.random() * 0.5)
      const scatterX = Math.cos(angle) * distance
      const scatterY = Math.sin(angle) * distance

      // 초기 상태: 흩어진 상태
      window.gsap.set(char, {
        x: scatterX,
        y: scatterY,
        opacity: 0,
        scale: 0.3,
        rotation: Math.random() * 360 - 180,
      })

      // 자석에 끌려오는 애니메이션
      const timeline = window.gsap.timeline()

      // 1단계: 나타나기
      timeline.to(char, {
        opacity: 1,
        duration: 0.2,
        delay: index * staggerDelay,
        ease: 'power2.out',
      })

      // 2단계: 자석에 끌려오기 (곡선 경로)
      timeline.to(
        char,
        {
          x: 0,
          y: 0,
          scale: magneticStrength,
          rotation: 0,
          duration: pullSpeed,
          ease: 'power2.out',
          motionPath: {
            path: `M${scatterX},${scatterY} Q${scatterX * 0.3},${scatterY * 0.7} 0,0`,
            autoRotate: false,
          },
          onComplete: () => {
            if (elasticEffect) {
              // 3단계: 탄성 복귀
              window.gsap.to(char, {
                scale: 1,
                duration: 0.6,
                ease: 'elastic.out(1, 0.4)',
              })

              // 미묘한 바운스 효과
              window.gsap.to(char, {
                y: -3,
                duration: 0.15,
                ease: 'power2.out',
                yoyo: true,
                repeat: 1,
              })
            } else {
              // 단순한 스케일 복귀
              window.gsap.to(char, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out',
              })
            }
          },
        },
        '-=0.1'
      )

      // 자석 끌림 효과 (중간에 가속)
      timeline.to(
        char,
        {
          x: 0,
          y: 0,
          duration: pullSpeed * 0.3,
          ease: 'power3.in',
        },
        `-=${pullSpeed * 0.4}`
      )
    })
  }

  /**
   * 옵션 업데이트 및 애니메이션 재적용
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }

    // 기존 애니메이션 정리
    window.gsap.killTweensOf(this.element.querySelectorAll('.magnetic-char'))

    // 새로운 옵션으로 애니메이션 재적용
    this.applyMagneticPullEffect()
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
    this.applyMagneticPullEffect()
  }

  /**
   * 애니메이션 재시작
   */
  restart() {
    window.gsap.killTweensOf(this.element.querySelectorAll('.magnetic-char'))
    this.applyMagneticPullEffect()
  }

  /**
   * 플러그인 정리
   */
  destroy() {
    if (this.element) {
      window.gsap.killTweensOf(this.element.querySelectorAll('.magnetic-char'))
      this.element.innerHTML = this.element.textContent
      this.element.style.position = ''
      this.element.style.display = ''
    }
  }
}

// 글로벌 사용을 위한 윈도우 객체 등록
if (typeof window !== 'undefined') {
  window.MagneticPullPlugin = MagneticPullPlugin
}

export default MagneticPullPlugin
