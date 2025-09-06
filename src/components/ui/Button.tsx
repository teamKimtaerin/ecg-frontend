'use client'

import React from 'react'
import {
  cn,
  getBaseInteractiveClasses,
  getSizeClasses,
  getVariantClasses,
  getDisabledClasses,
  logComponentWarning,
  SIZE_CLASSES,
  type ComponentVariant,
  type ComponentStyle,
  type StaticColor,
  type BaseComponentProps,
} from '@/lib/utils'

export interface ButtonProps extends BaseComponentProps {
  label?: string
  hideLabel?: string
  icon?: React.ReactNode
  variant?: ComponentVariant
  staticColor?: StaticColor
  style?: ComponentStyle
  justified?: boolean
  isPending?: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  children?: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  label,
  hideLabel,
  icon,
  variant = 'accent',
  staticColor = 'none',
  style = 'fill',
  size = 'medium',
  justified = false,
  isPending = false,
  isDisabled = false,
  onClick,
  type = 'button',
  className,
  children,
}) => {
  // Validation
  if (!label && !icon && !children) {
    logComponentWarning(
      'Button',
      'Either label, icon, or children must be provided.'
    )
  }

  // Build button classes
  const buttonClasses = cn(
    // Base interactive styles
    getBaseInteractiveClasses(),

    // Size-based styles
    getSizeClasses(size),

    // Variant and color styles
    getVariantClasses(variant, style, staticColor),

    // State-based styles
    isDisabled && getDisabledClasses(),
    justified && 'w-full',

    // Custom classes
    className
  )

  // Event handlers - 기존 onClick 시그니처 유지를 위해 직접 구현
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isPending || isDisabled) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  // Content rendering
  const renderContent = () => {
    const hasLabel = label || children
    const showIcon = icon && !isPending
    const showSpinner = isPending
    const iconSize = SIZE_CLASSES.iconSize[size]

    return (
      <>
        {/* Loading Spinner */}
        {showSpinner && (
          <div
            className={cn(
              'animate-spin rounded-full border-b-2 border-current',
              SIZE_CLASSES.iconClasses[size],
              hasLabel && 'mr-2'
            )}
          />
        )}

        {/* Icon */}
        {showIcon && (
          <span className={cn(iconSize, hasLabel && 'mr-2')}>{icon}</span>
        )}

        {/* Label/Children */}
        {hasLabel && (
          <span className={hideLabel ? 'sr-only' : undefined}>
            {label || children}
          </span>
        )}
      </>
    )
  }

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={hideLabel || label}
    >
      {renderContent()}
    </button>
  )
}

export default Button
