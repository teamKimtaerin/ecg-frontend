import React from 'react'
import { DashboardLayout } from '../transcriptions/components/DashboardLayout'
import { SubtitlesClient } from '../transcriptions/components/SubtitlesClient'

// TODO : 이 데이터는 나중에 API에서 가져올 수 있습니다, 삭제
const sampleSubtitles = [
  {
    id: '1',
    name: 'MySubtitle',
    tags: [
      { label: 'Dramatic', variant: 'informative' as const },
      { label: 'High Pitch', variant: 'negative' as const },
      { label: 'Variety', variant: 'positive' as const },
    ],
    created: '9h ago',
    edited: '9h ago',
  },
  {
    id: '2',
    name: 'TestSubtitle',
    tags: [
      { label: 'Speedy', variant: 'notice' as const },
      { label: 'High Pitch', variant: 'negative' as const },
      { label: 'Glowing', variant: 'informative' as const },
    ],
    created: '16h ago',
    edited: '12h ago',
  },
  {
    id: '3',
    name: 'MinimumAnim',
    tags: [
      { label: 'Animated', variant: 'positive' as const },
      { label: 'Slow', variant: 'positive' as const },
      { label: 'None Effect', variant: 'neutral' as const },
    ],
    created: '2d ago',
    edited: '1d ago',
  },
]

export default function SubtitlesPage() {
  // Server Component: 데이터 fetching, SEO, 정적 렌더링
  return (
    <DashboardLayout>
      <SubtitlesClient initialSubtitles={sampleSubtitles} />
    </DashboardLayout>
  )
}
