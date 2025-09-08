/**
 * TypeWriter Text Effect Plugin
 * 텍스트가 한 글자씩 타이핑되면서 나타나는 애니메이션 효과
 */

export class TypeWriterPlugin {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      typingSpeed: 0.1,
      startDelay: 0.5,
      showCursor: true,
      cursorChar: '|',
      cursorBlinkSpeed: 0.8,
      randomSpeed: false,
      ...options,
    }

    this.originalText = ''
    this.currentIndex = 0
    this.cursorElement = null
    this.timeline = null

    this.init()
  }

  init() {
    if (!window.gsap) {
      console.error('GSAP is required for TypeWriter effect')
      return
    }

    this.originalText = this.element.textContent || ''
    this.setupElements()
    this.startTypeWriterEffect()
  }

  /**
   * 타이핑 효과를 위한 DOM 구조 설정
   */
  setupElements() {
    if (!this.element) return

    // 기존 내용 초기화
    this.element.innerHTML = ''
    this.element.className = 'typewriter-text'

    // 텍스트 컨테이너 생성
    const textContainer = document.createElement('span')
    textContainer.className = 'typed-text'
    this.element.appendChild(textContainer)

    // 커서 생성
    if (this.options.showCursor) {
      this.cursorElement = document.createElement('span')
      this.cursorElement.className = 'typewriter-cursor'
      this.cursorElement.textContent = this.options.cursorChar
      this.cursorElement.style.display = 'inline-block'
      this.cursorElement.style.color = '#fff'
      this.element.appendChild(this.cursorElement)

      // 커서 깜빡임 애니메이션
      window.gsap.to(this.cursorElement, {
        opacity: 0,
        duration: this.options.cursorBlinkSpeed,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
      })
    }
  }

  /**
   * 타이핑 애니메이션 효과 시작
   */
  startTypeWriterEffect() {
    if (!window.gsap || !this.element || !this.originalText) return

    const textContainer = this.element.querySelector('.typed-text')
    if (!textContainer) return

    // 기존 타임라인 정리
    if (this.timeline) {
      this.timeline.kill()
    }

    // 새로운 타임라인 생성
    this.timeline = window.gsap.timeline()

    // 시작 지연
    if (this.options.startDelay > 0) {
      this.timeline.to({}, { duration: this.options.startDelay })
    }

    // 각 글자별 타이핑 애니메이션
    for (let i = 0; i <= this.originalText.length; i++) {
      const delay = this.options.randomSpeed
        ? this.options.typingSpeed * (0.5 + Math.random())
        : this.options.typingSpeed

      this.timeline.to(
        {},
        {
          duration: delay,
          onComplete: () => {
            textContainer.textContent = this.originalText.substring(0, i)
          },
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
    if (this.timeline) {
      this.timeline.kill()
    }

    // 커서 업데이트
    if (this.cursorElement) {
      this.cursorElement.textContent = this.options.cursorChar

      // 커서 표시/숨김
      if (this.options.showCursor) {
        this.cursorElement.style.display = 'inline-block'
        // 커서 깜빡임 재설정
        window.gsap.killTweensOf(this.cursorElement)
        window.gsap.to(this.cursorElement, {
          opacity: 0,
          duration: this.options.cursorBlinkSpeed,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut',
        })
      } else {
        this.cursorElement.style.display = 'none'
      }
    }

    // 애니메이션 재시작
    this.startTypeWriterEffect()
  }

  /**
   * 텍스트 변경
   */
  updateText(newText) {
    if (!this.element) return

    this.originalText = newText

    // 애니메이션 정리
    if (this.timeline) {
      this.timeline.kill()
    }

    // 텍스트 컨테이너 재설정
    const textContainer = this.element.querySelector('.typed-text')
    if (textContainer) {
      textContainer.textContent = ''
    }

    // 애니메이션 재시작
    this.startTypeWriterEffect()
  }

  /**
   * 애니메이션 재시작
   */
  restart() {
    if (this.timeline) {
      this.timeline.kill()
    }

    const textContainer = this.element.querySelector('.typed-text')
    if (textContainer) {
      textContainer.textContent = ''
    }

    this.startTypeWriterEffect()
  }

  /**
   * 타이핑 완료 (즉시 모든 텍스트 표시)
   */
  complete() {
    if (this.timeline) {
      this.timeline.progress(1)
    }
  }

  /**
   * 플러그인 정리
   */
  destroy() {
    if (this.timeline) {
      this.timeline.kill()
    }

    if (this.cursorElement) {
      window.gsap.killTweensOf(this.cursorElement)
    }

    if (this.element) {
      this.element.innerHTML = this.originalText
    }
  }
}

// 글로벌 사용을 위한 윈도우 객체 등록
if (typeof window !== 'undefined') {
  window.TypeWriterPlugin = TypeWriterPlugin
}

export default TypeWriterPlugin
