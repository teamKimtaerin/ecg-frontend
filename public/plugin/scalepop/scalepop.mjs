/**
 * Scale Pop Text Effect Plugin
 * 글자들이 작은 크기에서 크게 팝업되며 임팩트 있게 나타나는 애니메이션 효과
 */

export class ScalePopPlugin {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      startScale: 0,
      maxScale: 1.3,
      popDuration: 0.6,
      staggerDelay: 0.08,
      rotationAmount: 10,
      ...options,
    }

    this.init()
  }

  init() {
    if (!window.gsap) {
      console.error('GSAP is required for Scale Pop effect')
      return
    }

    this.splitTextIntoCharacters()
    this.applyScalePopEffect()
  }

  /**
   * 텍스트를 글자별로 분리하여 DOM 구조 생성
   */
  splitTextIntoCharacters() {
    if (!this.element) return

    const text = this.element.textContent || ''
    this.element.innerHTML = ''
    this.element.className = 'scale-pop-text'
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
      charSpan.className = 'scale-char'
      charSpan.textContent = char === ' ' ? '\u00A0' : char // 공백 처리
      charSpan.style.display = 'inline-block'
      charSpan.style.position = 'relative'
      charSpan.style.color = '#fff'
      this.element.appendChild(charSpan)
    }
  }

  /**
   * 스케일 팝 애니메이션 효과 적용
   */
  applyScalePopEffect() {
    if (!window.gsap || !this.element) return

    const chars = this.element.querySelectorAll('.scale-char')

    const { startScale, maxScale, popDuration, staggerDelay, rotationAmount } =
      this.options

    chars.forEach((char, index) => {
      // 랜덤한 회전 방향 결정
      const randomRotation = (Math.random() - 0.5) * rotationAmount * 2

      // 초기 상태 설정
      window.gsap.set(char, {
        scale: startScale,
        opacity: 0,
        rotation: randomRotation * 0.5,
        transformOrigin: 'center center',
        filter: 'blur(2px)',
      })

      // 스케일 팝 애니메이션 타임라인
      const timeline = window.gsap.timeline()

      // 1단계: 나타나면서 오버스케일
      timeline.to(char, {
        scale: maxScale,
        opacity: 1,
        rotation: randomRotation,
        filter: 'blur(0px)',
        duration: popDuration * 0.6,
        delay: index * staggerDelay,
        ease: 'back.out(2)',
        onStart: () => {
          // 글로우 효과 추가
          char.style.textShadow = '0 0 10px rgba(255,255,255,0.5)'
        },
      })

      // 2단계: 정상 크기로 복귀
      timeline.to(char, {
        scale: 1,
        rotation: 0,
        duration: popDuration * 0.4,
        ease: 'elastic.out(1, 0.4)',
        onComplete: () => {
          // 글로우 효과 제거
          window.gsap.to(char, {
            textShadow: '0 0 0px rgba(255,255,255,0)',
            duration: 0.3,
            ease: 'power1.out',
          })
        },
      })

      // 추가적인 바운스 효과
      timeline.to(
        char,
        {
          y: -5,
          duration: 0.15,
          delay: popDuration * 0.1,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
        },
        '-=0.2'
      )

      // 미묘한 색상 변화 효과
      timeline.to(
        char,
        {
          color: '#fff',
          duration: popDuration,
          ease: 'power1.inOut',
          onStart: () => {
            char.style.color = '#e74c3c' // 시작 색상
          },
          onUpdate: function () {
            // 진행률에 따라 색상 변화
            const progress = this.progress()
            const r = Math.floor(231 + (255 - 231) * progress) // 231 -> 255
            const g = Math.floor(76 + (255 - 76) * progress) // 76 -> 255
            const b = Math.floor(60 + (255 - 60) * progress) // 60 -> 255
            char.style.color = `rgb(${r}, ${g}, ${b})`
          },
        },
        0
      )
    })
  }

  /**
   * 옵션 업데이트 및 애니메이션 재적용
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }

    // 기존 애니메이션 정리
    window.gsap.killTweensOf(this.element.querySelectorAll('.scale-char'))

    // 새로운 옵션으로 애니메이션 재적용
    this.applyScalePopEffect()
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
    this.applyScalePopEffect()
  }

  /**
   * 애니메이션 재시작
   */
  restart() {
    window.gsap.killTweensOf(this.element.querySelectorAll('.scale-char'))
    this.applyScalePopEffect()
  }

  /**
   * 플러그인 정리
   */
  destroy() {
    if (this.element) {
      window.gsap.killTweensOf(this.element.querySelectorAll('.scale-char'))
      this.element.innerHTML = this.element.textContent
      this.element.style.position = ''
      this.element.style.display = ''
    }
  }
}

// 글로벌 사용을 위한 윈도우 객체 등록
if (typeof window !== 'undefined') {
  window.ScalePopPlugin = ScalePopPlugin
}

export default ScalePopPlugin
