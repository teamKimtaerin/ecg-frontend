import {
  FaFile,
  FaFileAlt,
  FaFilm,
  FaImage,
  FaMusic,
  FaVideo,
  FaRocket,
} from 'react-icons/fa'
import { MdAudiotrack, MdSubtitles } from 'react-icons/md'
import { SiAdobepremierepro, SiApple } from 'react-icons/si'
import { ExportOption } from './ExportTypes'

export const exportOptions: ExportOption[] = [
  // GPU 고속 렌더링 (추천)
  {
    id: 'gpu-render',
    label: 'GPU 고속 렌더링',
    description: '⚡ 20-40배 빠름',
    icon: 'FaRocket',
    category: 'video',
    isRecentlyUsed: true,
  },
  // 영상 파일 (기본 선택)
  {
    id: 'mp4',
    label: '영상 파일',
    description: 'mp4',
    icon: 'FaVideo',
    category: 'video',
    isRecentlyUsed: false,
  },

  // 자막 파일
  {
    id: 'srt',
    label: '자막 파일',
    description: 'srt',
    icon: 'MdSubtitles',
    category: 'subtitle',
    isRecentlyUsed: false,
  },
  {
    id: 'txt',
    label: '텍스트',
    description: 'txt',
    icon: 'FaFileAlt',
    category: 'subtitle',
    isRecentlyUsed: false,
  },

  // 오디오 파일
  {
    id: 'mp3',
    label: '오디오 파일',
    description: 'mp3, wav',
    icon: 'MdAudiotrack',
    category: 'audio',
    isRecentlyUsed: false,
  },

  // 이미지
  {
    id: 'png',
    label: '이미지',
    description: 'png, gif',
    icon: 'FaImage',
    category: 'image',
    isRecentlyUsed: false,
  },

  // 편집 프로그램용
  {
    id: 'mov',
    label: '투명 배경 자막 영상',
    description: 'mov',
    icon: 'FaFilm',
    category: 'project',
    isRecentlyUsed: false,
  },
  {
    id: 'premiere',
    label: 'Premier Pro',
    description: 'xml',
    icon: 'SiAdobepremierepro',
    category: 'project',
    isRecentlyUsed: false,
  },
  {
    id: 'finalcut',
    label: 'Final Cut Pro',
    description: 'fcpxml',
    icon: 'SiApple',
    category: 'project',
    isRecentlyUsed: false,
  },
  {
    id: 'davinci',
    label: 'DaVinci Resolve',
    description: 'fcpxml',
    icon: 'FaFile',
    category: 'project',
    isRecentlyUsed: false,
  },
  {
    id: 'hoit',
    label: 'Hoit 프로젝트',
    description: 'hoit',
    icon: 'FaFile',
    category: 'project',
    isRecentlyUsed: false,
  },
]

export const getIconComponent = (iconName: string) => {
  const iconMap: {
    [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>>
  } = {
    FaVideo,
    FaFileAlt,
    FaMusic,
    FaImage,
    FaFile,
    FaFilm,
    FaRocket,
    MdSubtitles,
    MdAudiotrack,
    SiAdobepremierepro,
    SiApple,
  }

  return iconMap[iconName] || FaFile
}
