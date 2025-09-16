'use client'

import React from 'react'
import ToolbarButton from './shared/ToolbarButton'
import { IoLayers, IoShapes, IoPerson, IoText } from 'react-icons/io5'
import { useEditorStore } from '../../store'

interface InsertToolbarProps {
  onNewClick: () => void
  onCut?: () => void
  onCopy?: () => void
  onPaste?: () => void
}

const InsertToolbar: React.FC<InsertToolbarProps> = () => {
  const {
    isAssetSidebarOpen,
    setIsAssetSidebarOpen,
    addTextAtCenter,
    currentTime,
  } = useEditorStore()

  const handleToggleAssetSidebar = () => {
    setIsAssetSidebarOpen(!isAssetSidebarOpen)
  }

  const handleAddTextAtCenter = () => {
    addTextAtCenter(currentTime)
  }

  const handleShapesClick = () => {
    // TODO: 도형 기능 구현 예정
    console.log('도형 버튼 클릭됨')
  }

  const handleCharacterClick = () => {
    // TODO: 캐릭터 기능 구현 예정
    console.log('캐릭터 버튼 클릭됨')
  }

  return (
    <>
      <ToolbarButton
        icon={<IoText />}
        label="텍스트 삽입"
        shortcut="Alt+T"
        active={false}
        onClick={handleAddTextAtCenter}
      />

      <ToolbarButton
        icon={<IoLayers />}
        label="애니메이션 에셋"
        shortcut="Alt+A"
        active={isAssetSidebarOpen}
        onClick={handleToggleAssetSidebar}
      />

      <ToolbarButton
        icon={<IoShapes />}
        label="도형"
        shortcut="Alt+S"
        onClick={handleShapesClick}
      />

      <ToolbarButton
        icon={<IoPerson />}
        label="캐릭터"
        shortcut="Alt+C"
        onClick={handleCharacterClick}
      />
    </>
  )
}

export default InsertToolbar
