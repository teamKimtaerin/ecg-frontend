import {
  FaFile,
  FaFileAlt,
  FaFilm,
  FaImage,
  FaMusic,
  FaVideo,
} from 'react-icons/fa'
import { MdAudiotrack, MdSubtitles } from 'react-icons/md'
import { SiAdobepremierepro, SiApple } from 'react-icons/si'
import { ExportOption } from './ExportTypes'

export const exportOptions: ExportOption[] = [
  // 영상 파일 (기본 선택)
  {
    id: 'mp4',
    label: '영상 파일',
    description: 'mp4',
    icon: 'FaVideo',
    category: 'video',
    isRecentlyUsed: true,
  },

  // 자막 파일
  {
    id: 'srt',
    label: '자막 파일',
    description: 'srt',
    icon: 'MdSubtitles',
    category: 'subtitle',
  },
  {
    id: 'txt',
    label: '텍스트',
    description: 'txt',
    icon: 'FaFileAlt',
    category: 'subtitle',
  },

  // 오디오 파일
  {
    id: 'mp3',
    label: '오디오 파일',
    description: 'mp3, wav',
    icon: 'MdAudiotrack',
    category: 'audio',
  },

  // 이미지
  {
    id: 'png',
    label: '이미지',
    description: 'png, gif',
    icon: 'FaImage',
    category: 'image',
  },

  // 편집 프로그램용
  {
    id: 'mov',
    label: '투명 배경 자막 영상',
    description: 'mov',
    icon: 'FaFilm',
    category: 'project',
  },
  {
    id: 'premiere',
    label: 'Premier Pro',
    description: 'xml',
    icon: 'SiAdobepremierepro',
    category: 'project',
  },
  {
    id: 'finalcut',
    label: 'Final Cut Pro',
    description: 'fcpxml',
    icon: 'SiApple',
    category: 'project',
  },
  {
    id: 'davinci',
    label: 'DaVinci Resolve',
    description: 'fcpxml',
    icon: 'FaFile',
    category: 'project',
  },
  {
    id: 'hoit',
    label: 'Hoit 프로젝트',
    description: 'hoit',
    icon: 'FaFile',
    category: 'project',
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
    MdSubtitles,
    MdAudiotrack,
    SiAdobepremierepro,
    SiApple,
  }

  return iconMap[iconName] || FaFile
}
