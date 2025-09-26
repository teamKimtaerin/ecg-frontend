/**
 * RFC6902 JSON Patch 유틸리티
 * MotionTextEditor 표준 JSON Patch 적용
 */

export interface JsonPatch {
  op: 'replace' | 'add' | 'remove'
  path: string
  value?: any
}

export class JsonPatchApplier {
  /**
   * JSON Patch 배열을 객체에 적용
   */
  static applyPatches<T>(target: T, patches: JsonPatch[]): T {
    if (!target || !patches || patches.length === 0) {
      return target
    }

    // 깊은 복사
    let result = JSON.parse(JSON.stringify(target))

    for (const patch of patches) {
      try {
        result = this.applyPatch(result, patch)
      } catch (error) {
        console.warn(`JSON Patch 적용 실패: ${patch.path}`, error)
        // 개별 패치 실패 시 계속 진행
        continue
      }
    }

    return result
  }

  /**
   * 단일 JSON Patch 적용
   */
  private static applyPatch(target: any, patch: JsonPatch): any {
    const { op, path, value } = patch
    const pathArray = this.parsePath(path)

    switch (op) {
      case 'replace':
        return this.replacePath(target, pathArray, value)
      case 'add':
        return this.addPath(target, pathArray, value)
      case 'remove':
        return this.removePath(target, pathArray)
      default:
        throw new Error(`지원하지 않는 연산: ${op}`)
    }
  }

  /**
   * JSON Pointer 경로를 배열로 변환
   * 예: "/cues/0/root/children/24/style" -> ["cues", "0", "root", "children", "24", "style"]
   */
  private static parsePath(path: string): string[] {
    if (path === '') return []
    if (!path.startsWith('/')) {
      throw new Error(`잘못된 JSON Pointer 경로: ${path}`)
    }

    return path
      .substring(1) // 첫 번째 "/" 제거
      .split('/')
      .map((segment) => {
        // JSON Pointer 이스케이프 처리
        return segment.replace(/~1/g, '/').replace(/~0/g, '~')
      })
  }

  /**
   * 경로의 부모 객체와 마지막 키를 찾기
   */
  private static findParentAndKey(
    target: any,
    pathArray: string[]
  ): { parent: any; key: string } {
    if (pathArray.length === 0) {
      throw new Error('빈 경로는 지원하지 않습니다')
    }

    let current = target
    const key = pathArray[pathArray.length - 1]
    const parentPath = pathArray.slice(0, -1)

    for (const segment of parentPath) {
      if (current === null || current === undefined) {
        throw new Error(`경로를 찾을 수 없습니다: ${parentPath.join('/')}`)
      }

      if (Array.isArray(current)) {
        const index = parseInt(segment, 10)
        if (isNaN(index) || index < 0 || index >= current.length) {
          throw new Error(`잘못된 배열 인덱스: ${segment}`)
        }
        current = current[index]
      } else if (typeof current === 'object') {
        current = current[segment]
      } else {
        throw new Error(`경로를 탐색할 수 없습니다: ${segment}`)
      }
    }

    return { parent: current, key }
  }

  /**
   * replace 연산 적용
   */
  private static replacePath(
    target: any,
    pathArray: string[],
    value: any
  ): any {
    if (pathArray.length === 0) {
      return value // 루트 교체
    }

    const { parent, key } = this.findParentAndKey(target, pathArray)

    if (parent === null || parent === undefined) {
      throw new Error('부모 객체를 찾을 수 없습니다')
    }

    if (Array.isArray(parent)) {
      const index = parseInt(key, 10)
      if (isNaN(index) || index < 0 || index >= parent.length) {
        throw new Error(`잘못된 배열 인덱스: ${key}`)
      }
      parent[index] = value
    } else if (typeof parent === 'object') {
      parent[key] = value
    } else {
      throw new Error('교체할 수 없는 타입입니다')
    }

    return target
  }

  /**
   * add 연산 적용
   */
  private static addPath(target: any, pathArray: string[], value: any): any {
    if (pathArray.length === 0) {
      throw new Error('루트에 add 연산을 적용할 수 없습니다')
    }

    const { parent, key } = this.findParentAndKey(target, pathArray)

    if (parent === null || parent === undefined) {
      throw new Error('부모 객체를 찾을 수 없습니다')
    }

    if (Array.isArray(parent)) {
      const index = parseInt(key, 10)
      if (key === '-') {
        // 배열 끝에 추가
        parent.push(value)
      } else if (isNaN(index) || index < 0 || index > parent.length) {
        throw new Error(`잘못된 배열 인덱스: ${key}`)
      } else {
        parent.splice(index, 0, value)
      }
    } else if (typeof parent === 'object') {
      parent[key] = value
    } else {
      throw new Error('추가할 수 없는 타입입니다')
    }

    return target
  }

  /**
   * remove 연산 적용
   */
  private static removePath(target: any, pathArray: string[]): any {
    if (pathArray.length === 0) {
      throw new Error('루트를 제거할 수 없습니다')
    }

    const { parent, key } = this.findParentAndKey(target, pathArray)

    if (parent === null || parent === undefined) {
      throw new Error('부모 객체를 찾을 수 없습니다')
    }

    if (Array.isArray(parent)) {
      const index = parseInt(key, 10)
      if (isNaN(index) || index < 0 || index >= parent.length) {
        throw new Error(`잘못된 배열 인덱스: ${key}`)
      }
      parent.splice(index, 1)
    } else if (typeof parent === 'object') {
      delete parent[key]
    } else {
      throw new Error('제거할 수 없는 타입입니다')
    }

    return target
  }

  /**
   * 디버깅용 패치 검증
   */
  static validatePatches(patches: JsonPatch[]): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i]

      if (!patch.op || !['replace', 'add', 'remove'].includes(patch.op)) {
        errors.push(`패치 ${i}: 잘못된 연산 - ${patch.op}`)
      }

      if (typeof patch.path !== 'string') {
        errors.push(`패치 ${i}: 경로가 문자열이 아님`)
      }

      if (
        (patch.op === 'replace' || patch.op === 'add') &&
        patch.value === undefined
      ) {
        errors.push(`패치 ${i}: ${patch.op} 연산에는 value가 필요함`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
