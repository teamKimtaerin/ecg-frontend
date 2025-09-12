/**
 * Plugin Parameter Controls Component
 * manifest.json의 schema를 기반으로 동적 UI 컨트롤 생성
 */

'use client'

import { clsx } from 'clsx'
import { TRANSITIONS, type BaseComponentProps } from '@/lib/utils'
import React, { useCallback } from 'react'
import type { PluginManifest, SchemaProperty } from '../utils/scenarioGenerator'

interface PluginParameterControlsProps extends BaseComponentProps {
  manifest: PluginManifest | null
  parameters: Record<string, unknown>
  onParameterChange: (key: string, value: unknown) => void
}

interface ControlProps {
  property: SchemaProperty
  value: unknown
  onChange: (value: unknown) => void
}

/**
 * Number 타입 컨트롤 (슬라이더 + 입력)
 */
const NumberControl: React.FC<ControlProps> = ({
  property,
  value,
  onChange,
}) => {
  const dflt =
    typeof property.default === 'number'
      ? property.default
      : Number(property.default as number) || 0
  const numValue =
    typeof value === 'number' ? value : Number(value as number) || dflt
  const min = property.min ?? 0
  const max = property.max ?? 100
  const step = property.step ?? 1

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={numValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className={clsx(
            'w-16 px-2 py-1 text-sm bg-gray-700 border border-gray-600',
            'rounded text-white focus:outline-none focus:border-blue-500',
            TRANSITIONS.colors
          )}
        />
      </div>
    </div>
  )
}

/**
 * Boolean 타입 컨트롤 (토글 스위치)
 */
const BooleanControl: React.FC<ControlProps> = ({ value, onChange }) => {
  const boolValue = typeof value === 'boolean' ? value : Boolean(value)

  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={boolValue}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={clsx(
            'block bg-gray-600 w-14 h-8 rounded-full transition-colors',
            boolValue && 'bg-blue-500'
          )}
        >
          <div
            className={clsx(
              'absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform',
              boolValue && 'transform translate-x-6'
            )}
          />
        </div>
      </div>
      <span className="ml-3 text-sm text-gray-300">
        {boolValue ? '활성화' : '비활성화'}
      </span>
    </label>
  )
}

/**
 * String 타입 컨트롤 (텍스트 입력)
 */
const StringControl: React.FC<ControlProps> = ({
  property,
  value,
  onChange,
}) => {
  const stringValue =
    typeof value === 'string' ? value : String(value ?? property.default ?? '')

  return (
    <input
      type="text"
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder={property.description}
      className={clsx(
        'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded',
        'text-white placeholder-gray-400',
        'focus:outline-none focus:border-blue-500',
        TRANSITIONS.colors
      )}
    />
  )
}

/**
 * Select 타입 컨트롤 (드롭다운)
 */
const SelectControl: React.FC<ControlProps> = ({
  property,
  value,
  onChange,
}) => {
  const selectValue =
    typeof value === 'string' ? value : String(value ?? property.default ?? '')
  const options = property.enum || []

  return (
    <select
      value={selectValue}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded',
        'text-white focus:outline-none focus:border-blue-500',
        TRANSITIONS.colors
      )}
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-gray-700">
          {option}
        </option>
      ))}
    </select>
  )
}

export const PluginParameterControls: React.FC<
  PluginParameterControlsProps
> = ({ manifest, parameters, onParameterChange, className }) => {
  /**
   * 파라미터 변경 핸들러
   */
  const handleParameterChange = useCallback(
    (key: string, value: unknown) => {
      onParameterChange(key, value)
    },
    [onParameterChange]
  )

  /**
   * 컨트롤 렌더링
   */
  const renderControl = useCallback(
    (key: string, property: SchemaProperty) => {
      const value = parameters[key]

      const controlProps = {
        property,
        value,
        onChange: (newValue: unknown) => handleParameterChange(key, newValue),
      }

      switch (property.type) {
        case 'number':
          return <NumberControl {...controlProps} />
        case 'boolean':
          return <BooleanControl {...controlProps} />
        case 'string':
          return <StringControl {...controlProps} />
        case 'select':
          return <SelectControl {...controlProps} />
        default:
          return <StringControl {...controlProps} />
      }
    },
    [parameters, handleParameterChange]
  )

  if (!manifest || !manifest.schema) {
    return (
      <div className={clsx('p-4 text-center text-gray-400', className)}>
        플러그인 설정을 불러오는 중...
      </div>
    )
  }

  const schemaEntries = Object.entries(manifest.schema)

  if (schemaEntries.length === 0) {
    return (
      <div className={clsx('p-4 text-center text-gray-400', className)}>
        설정 가능한 파라미터가 없습니다.
      </div>
    )
  }

  return (
    <div className={clsx('space-y-6', className)}>
      <div className="border-b border-gray-700 pb-3">
        <h3 className="text-lg font-semibold text-white mb-1">
          {manifest.name} 설정
        </h3>
        <p className="text-sm text-gray-400">
          아래 설정을 조정하여 애니메이션을 커스터마이징하세요
        </p>
      </div>

      <div className="space-y-5">
        {schemaEntries.map(([key, property]) => (
          <div key={key} className="space-y-2">
            {/* 라벨과 설명 */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-white">
                {property.label}
              </label>
              {property.description && (
                <p className="text-xs text-gray-400">{property.description}</p>
              )}
            </div>

            {/* 컨트롤 */}
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              {renderControl(key, property)}
            </div>
          </div>
        ))}
      </div>

      {/* 현재 값 표시 (디버그용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-3 bg-gray-900 rounded border border-gray-700">
          <h4 className="text-xs font-mono text-gray-400 mb-2">
            Current Values:
          </h4>
          <pre className="text-xs text-gray-500 overflow-auto">
            {JSON.stringify(parameters, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
