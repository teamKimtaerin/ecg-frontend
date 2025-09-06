'use client'

import React from 'react'

import { useEditorStore } from '../store'
import Button from '../../../components/ui/Button'

export default function Toolbar() {
  const { activeTab } = useEditorStore()

  const renderHomeTools = () => (
    <div className="flex items-center space-x-2">
      <Button size="small" variant="secondary" className="text-xs">
        새로 만들기
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        프로젝트 열기
      </Button>
      <div className="w-px h-6 bg-slate-600 mx-2" />
      <Button size="small" variant="secondary" className="text-xs px-2">
        ↶
      </Button>
      <Button size="small" variant="secondary" className="text-xs px-2">
        ↷
      </Button>
      <div className="w-px h-6 bg-slate-600 mx-2" />
      <Button size="small" variant="secondary" className="text-xs">
        잘라내기
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        복사하기
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        붙여넣기
      </Button>
      <div className="w-px h-6 bg-slate-600 mx-2" />
      <Button size="small" variant="secondary" className="text-xs">
        클립 합치기
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        클립 나누기
      </Button>
      <div className="w-px h-6 bg-slate-600 mx-2" />
      <Button size="small" variant="secondary" className="text-xs">
        기본 자막 텍스트 서식 수정
      </Button>
    </div>
  )

  const renderFileTools = () => (
    <div className="flex items-center space-x-2">
      <Button size="small" variant="secondary" className="text-xs">
        파일 열기
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        저장
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        다른 이름으로 저장
      </Button>
    </div>
  )

  const renderEditTools = () => (
    <div className="flex items-center space-x-2">
      <Button size="small" variant="secondary" className="text-xs">
        분할
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        병합
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        삭제
      </Button>
    </div>
  )

  const renderSubtitleTools = () => (
    <div className="flex items-center space-x-2">
      <Button size="small" variant="secondary" className="text-xs">
        자막 추가
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        자막 삭제
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        타이밍 조정
      </Button>
    </div>
  )

  const renderToolsForTab = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeTools()
      case 'file':
        return renderFileTools()
      case 'edit':
        return renderEditTools()
      case 'subtitle':
        return renderSubtitleTools()
      default:
        return <div className="text-xs text-slate-400">도구 없음</div>
    }
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border-b border-slate-600/30 px-6 py-3">
      {renderToolsForTab()}
    </div>
  )
}
