import React from 'react'
import {
  ChevronDown,
  Info,
  X,
  XCircle,
  Star,
  Heart,
  Plus,
  Home,
  User,
  Settings,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'

export interface IconProps {
  className?: string
  size?: number
}

// Chevron Down Icon (Dropdown용)
export const ChevronDownIcon: React.FC<IconProps> = ({
  className,
  size = 20,
}) => <ChevronDown className={className} size={size} />

// Info Icon (Help Text neutral용)
export const InfoIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <Info className={className} size={size} />
)

// Error Icon (Help Text negative용)
export const ErrorIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <XCircle className={className} size={size} />
)

// 기본 아이콘들 (디자인 시스템 페이지용)
export const StarIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <Star className={className} size={size} />
)

export const HeartIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <Heart className={className} size={size} />
)

export const PlusIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <Plus className={className} size={size} />
)

export const HomeIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <Home className={className} size={size} />
)

export const UserIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <User className={className} size={size} />
)

export const SettingsIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <Settings className={className} size={size} />
)

// Close/X Icon (Alert Banner dismiss용)
export const CloseIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <X className={className} size={size} />
)

// Alert Icon (Alert Banner informative/negative용)
export const AlertIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <AlertCircle className={className} size={size} />
)

// Check Circle Icon (AlertDialog confirmation용)
export const CheckCircleIcon: React.FC<IconProps> = ({
  className,
  size = 20,
}) => <CheckCircle className={className} size={size} />

// Exclamation Triangle Icon (AlertDialog warning용)
export const ExclamationTriangleIcon: React.FC<IconProps> = ({
  className,
  size = 20,
}) => <AlertTriangle className={className} size={size} />

// X Circle Icon (AlertDialog error용)
export const XCircleIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <XCircle className={className} size={size} />
)
