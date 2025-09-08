/**
 * Elastic Bounce Text Effect Plugin
 * 텍스트가 탄성있게 튀면서 나타나는 애니메이션 효과
 */

export class ElasticBouncePlugin {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      bounceStrength: 0.7,
      animationDuration: 1.5,
      staggerDelay: 0.1,
      startScale: 0,
      overshoot: 1.3,
      ...options,
    }

    this.init()
  }

  init() {
    if (!window.gsap) {
      console.error('GSAP is required for Elastic Bounce effect')
      return
    }

    this.splitTextIntoWords()
    this.applyElasticBounceEffect()
  }

  /**
   * 텍스트를 단어별로 분리하여 DOM 구조 생성
   */
  splitTextIntoWords() {
    if (!this.element) return

    const text = this.element.textContent || ''
    this.element.innerHTML = ''
    this.element.className = 'elastic-bounce-text'

    if (!text.trim()) {
      this.element.textContent = '안녕하세요!'
      return
    }

    const words = text.split(' ')
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span')
      wordSpan.className = 'bounce-word'
      wordSpan.style.display = 'inline-block'
      wordSpan.style.marginRight = '0.3em'

      for (let i = 0; i < word.length; i++) {
        const char = word.charAt(i)
        const charSpan = document.createElement('span')
        charSpan.className = 'bounce-char'
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
   * 탄성 바운스 애니메이션 효과 적용
   */
  applyElasticBounceEffect() {
    if (!window.gsap || !this.element) return

    const words = this.element.querySelectorAll('.bounce-word')

    const {
      bounceStrength,
      animationDuration,
      staggerDelay,
      startScale,
      overshoot,
    } = this.options

    words.forEach((word, index) => {
      // 초기 상태 설정
      window.gsap.set(word, {
        scale: startScale,
        y: 20,
        opacity: 0,
        transformOrigin: 'center bottom',
      })

      // 바운스 애니메이션
      window.gsap.to(word, {
        scale: overshoot,
        y: 0,
        opacity: 1,
        duration: animationDuration * 0.4,
        delay: index * staggerDelay,
        ease: 'back.out(2)',
        onComplete: () => {
          // 오버슈트에서 정상 크기로 복귀
          window.gsap.to(word, {
            scale: 1,
            duration: animationDuration * 0.3,
            ease: `elastic.out(${bounceStrength}, 0.3)`,
          })
        },
      })

      // 미묘한 y축 바운스 추가
      window.gsap.to(word, {
        y: -5,
        duration: animationDuration * 0.2,
        delay: index * staggerDelay + animationDuration * 0.4,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      })
    })
  }

  /**
   * 옵션 업데이트 및 애니메이션 재적용
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }

    // 기존 애니메이션 정리
    window.gsap.killTweensOf(this.element.querySelectorAll('.bounce-word'))

    // 새로운 옵션으로 애니메이션 재적용
    this.applyElasticBounceEffect()
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
    this.applyElasticBounceEffect()
  }

  /**
   * 애니메이션 재시작
   */
  restart() {
    window.gsap.killTweensOf(this.element.querySelectorAll('.bounce-word'))
    this.applyElasticBounceEffect()
  }

  /**
   * 플러그인 정리
   */
  destroy() {
    if (this.element) {
      window.gsap.killTweensOf(this.element.querySelectorAll('.bounce-word'))
      this.element.innerHTML = this.element.textContent
    }
  }
}

// 글로벌 사용을 위한 윈도우 객체 등록
if (typeof window !== 'undefined') {
  window.ElasticBouncePlugin = ElasticBouncePlugin
}

export default ElasticBouncePlugin
