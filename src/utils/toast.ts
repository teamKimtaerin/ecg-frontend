export const showToast = (
  message: string,
  type: 'success' | 'error' | 'warning' = 'error'
) => {
  // 성공 메시지는 표시하지 않음
  if (type === 'success') {
    return
  }

  // 기존 토스트가 있다면 제거
  const existingToast = document.getElementById('custom-toast')
  if (existingToast) {
    existingToast.remove()
  }

  // 토스트 엘리먼트 생성
  const toast = document.createElement('div')
  toast.id = 'custom-toast'

  // 현재 테마에 맞는 어두운 색상 사용
  const bgColor = type === 'warning' ? 'bg-yellow-600/90' : 'bg-red-600/90'

  toast.className = `fixed top-20 right-4 ${bgColor} px-4 py-3 rounded-lg shadow-2xl z-[9999] transition-all duration-300 ease-in-out transform translate-x-0 opacity-100 backdrop-blur-sm border border-gray-600/30 font-medium`
  toast.style.color = '#3bb2f6' // primary-light 색상 직접 적용
  toast.textContent = message

  // body에 추가
  document.body.appendChild(toast)

  // 4초 후 제거 (조금 더 길게)
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.style.transform = 'translateX(100%)'
      toast.style.opacity = '0'
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }
  }, 4000)
}
