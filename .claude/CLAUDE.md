# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎬 Project Overview

ECG (Easy Caption Generator) Frontend - A powerful subtitle editing tool built with Next.js.

### Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19.1.1
- **Styling**: TailwindCSS v4 with PostCSS
- **State Management**: Zustand 5.0.8
- **Drag & Drop**: @dnd-kit/core & @dnd-kit/sortable
- **Icons**: react-icons (Lucide icons - lu)
- **Utilities**: clsx, tailwind-merge

## 🚀 Development Commands

### Essential Commands

패키지 매니저로는 yarn을 사용할 것

```bash
yarn dev         # Start development server (http://localhost:3000)
yarn build       # Build for production
yarn build:static # Build for static S3 hosting
yarn start       # Start production server
yarn lint        # Run ESLint checks
yarn lint:fix    # Fix linting issues automatically
yarn format      # Format code with Prettier
yarn format:check # Check code formatting
yarn type-check  # TypeScript type checking
yarn gen:scenario # Generate scenario from real.json
```

### Testing Commands

```bash
yarn test        # Run Jest unit tests
yarn test:watch  # Run tests in watch mode
yarn test:coverage # Generate test coverage report
yarn test:e2e    # Run Playwright E2E tests
yarn test:e2e:ui # Run Playwright with UI mode
```

## 🏗️ Architecture

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (route)/editor/    # Main editor page (route group)
│   │   ├── components/    # Editor-specific components
│   │   │   ├── ClipComponent/ # Modular clip component
│   │   │   ├── VideoSection.tsx
│   │   │   ├── SubtitleEditList.tsx
│   │   │   └── EditorHeaderTabs.tsx
│   │   ├── hooks/         # Custom hooks (DnD, selection)
│   │   ├── store/         # Zustand store with slices
│   │   │   ├── editorStore.ts
│   │   │   └── slices/    # Individual state slices
│   │   ├── types/         # TypeScript types
│   │   └── page.tsx       # Editor page component
│   ├── (main)/           # Main route group
│   └── auth/             # Authentication pages
├── components/
│   ├── ui/               # Reusable UI components (29+ components)
│   ├── icons/           # Icon components (Lucide wrapper)
│   └── DnD/             # Drag & drop components
├── lib/
│   ├── store/           # Global stores (authStore)
│   └── utils/           # Utility functions
│       └── colors.ts    # Color system utilities
├── services/            # API services
├── utils/               # General utilities
└── hooks/               # Global custom hooks
```

### State Management (Zustand)

The editor uses a modular Zustand store with slices:

```typescript
store/
├── editorStore.ts       # Main store combining all slices
└── slices/
    ├── clipSlice.ts     # Clip data and operations
    ├── selectionSlice.ts # Multi-selection state
    ├── uiSlice.ts       # UI state (tabs, modals)
    ├── saveSlice.ts     # Save/autosave state
    ├── mediaSlice.ts    # Media/video state
    └── wordSlice.ts     # Word-level editing state
```

### Component Architecture

#### Editor Page Hierarchy

```
EditorPage
├── EditorHeaderTabs
├── Toolbar
├── VideoSection
├── SubtitleEditList
│   └── ClipComponent (with DnD)
│       ├── ClipTimeline
│       ├── ClipCheckbox
│       ├── ClipSpeaker
│       ├── ClipWords
│       └── ClipText
└── SelectionBox
```

### Animation Plugin System

The editor features a sophisticated plugin-based animation system for dynamic subtitle effects:

```
public/plugin/
├── elastic@1.0.0/           # Elastic bounce animations
├── fadein@1.0.0/           # Fade-in effects
├── glitch@1.0.0/           # Glitch/distortion effects
├── magnetic@1.0.0/         # Magnetic attraction effects
├── rotation@1.0.0/         # Rotation animations
├── scalepop@1.0.0/         # Scale/pop effects
├── slideup@1.0.0/          # Slide-up transitions
├── typewriter@1.0.0/       # Typewriter effects
├── flames@1.0.0/           # Fire/flame effects
├── glow@1.0.0/             # Glow effects
└── pulse@1.0.0/            # Pulse animations
```

Each plugin contains:

- `manifest.json` - Plugin metadata, parameters schema, and UI configuration
- `index.mjs` - Plugin implementation with animation logic (ES modules)
- `assets/` - Plugin assets like thumbnails and resources

#### Plugin Structure

- **Dependencies**: Most plugins use GSAP for smooth animations
- **Schema**: Configurable parameters (duration, intensity, easing, etc.)
- **Preview System**: Thumbnail and demo capabilities
- **Dynamic Loading**: Plugins are loaded on-demand

### Audio Analysis Integration

The system supports dynamic subtitle animations based on audio analysis:

#### Audio Analysis Data (`public/real.json`)

```typescript
{
  metadata: { duration, speakers, emotions, processing_info },
  speakers: { [speaker_id]: { duration, emotions, confidence } },
  segments: [{
    start_time, end_time, speaker, emotion, text,
    words: [{
      word, start, end, confidence,
      volume_db,    // Volume level for animation intensity
      pitch_hz,     // Pitch frequency for effect selection
      harmonics_ratio, spectral_centroid
    }]
  }]
}
```

#### Dynamic Animation Application

- **Baseline Calculation**: Real-time average calculation for thresholds
- **Rule-Based Selection**: Conditions determine which animations apply
- **Intensity Scaling**: Audio metadata drives animation parameters
- **Emotion Integration**: Speaker emotions influence effect selection

### Animation Asset Sidebar Architecture

Complex sidebar system for managing subtitle animations:

```
AnimationAssetSidebar/
├── AssetCard.tsx           # Individual plugin cards
├── AssetGrid.tsx           # Grid layout for plugins
├── AssetControlPanel.tsx   # Dynamic parameter controls
├── TabNavigation.tsx       # Category filtering
├── SearchBar.tsx          # Plugin search
├── UsedAssetsStrip.tsx    # Recent/active animations
└── controls/              # Reusable control components
    ├── SliderControl.tsx   # Numeric parameters
    ├── ColorControl.tsx    # Color selection
    ├── SelectControl.tsx   # Dropdown options
    ├── ToggleControl.tsx   # Boolean flags
    └── ButtonGroup.tsx     # Multiple choice options
```

#### Key Features

1. **Dynamic UI Generation**: Controls generated from plugin schemas
2. **Real-time Preview**: Live animation previews
3. **Parameter Persistence**: Settings saved per plugin instance
4. **Asset Management**: Track used animations per project

### Video Player & Subtitle Rendering Pipeline

#### Video Player Architecture

- **VideoPlayer Component**: HTML5 video with custom controls
- **Subtitle Overlay**: Positioned text rendering with animations
- **Timeline Synchronization**: Frame-accurate subtitle timing
- **Audio Waveform**: Visual audio representation (optional)

#### Subtitle Rendering Process

1. **Data Loading**: Parse audio analysis and subtitle data
2. **Timeline Processing**: Calculate word-level timings
3. **Animation Selection**: Apply rules based on audio metadata
4. **Dynamic Rendering**: Real-time animation application
5. **Performance Optimization**: Efficient DOM updates and animation cleanup

### Word-Level Editing System

#### Word Manipulation

- **Inline Editing**: Direct text modification
- **Drag & Drop**: Word reordering within and between clips
- **Group Operations**: Multi-word selection and editing
- **Timing Adjustment**: Word-level timestamp editing

#### Speaker Management

- **Speaker Detection**: Automatic speaker identification from audio
- **Manual Assignment**: User can reassign speakers
- **Speaker Styling**: Different visual styles per speaker
- **Confidence Tracking**: Speaker assignment confidence levels

## 💡 Development Guidelines

### Component Development

**IMPORTANT: Always prefer using existing UI components from `components/ui/`**

Before creating new components, check if these existing UI components can be used:

- `Button` - Standard button with variants
- `Dropdown` - Select/dropdown component
- `EditableDropdown` - Editable select component
- `Tab/TabItem` - Tab navigation
- `AlertDialog` - Modal dialogs
- `AlertBanner` - Notification banners
- `Badge` - Status badges
- `Checkbox` - Checkbox input
- `RadioButton` - Radio input
- `HelpText` - Help/error messages
- `ProgressBar/ProgressCircle` - Progress indicators
- `StatusLight` - Status indicators
- `Input` - Text input fields
- `ColorPicker` - Color selection
- `FontDropdown` - Font selection
- `Modal` - General modal component
- `Slider` - Range input
- `Switch/ToggleButton` - Toggle controls
- `Tag` - Label/tag component
- `Tooltip` - Hover information
- `ResizablePanelDivider` - Panel resizing

### Color System

Use the centralized color system from `lib/utils/colors.ts`:

- Color variants: `primary`, `secondary`, `accent`, `neutral`, `positive`, `negative`, `notice`, `informative`
- Color intensities: `light`, `medium`, `dark`, `very-light`, `very-dark`
- Utility function: `getColorVar(variant, intensity?)`

Example:

```typescript
import { getColorVar, type ColorVariant } from '@/lib/utils/colors'
const primaryColor = getColorVar('primary', 'medium')
```

### Icon Usage

Icons are centralized in `components/icons/`:

```typescript
import { ChevronDownIcon, InfoIcon /* etc */ } from '@/components/icons'
```

All icons use Lucide React internally but are wrapped for consistency. Available icons include `ChevronDownIcon`, `InfoIcon`, `XIcon`, `PlusIcon`, `AlertCircleIcon`, etc.

### Drag & Drop Implementation

The editor uses @dnd-kit for drag-and-drop:

1. Clips are wrapped with `SortableContext`
2. Multi-selection is supported via Zustand store
3. Group dragging moves all selected items together

### Plugin Development

When working with the animation plugin system:

#### Creating New Plugins

1. **Plugin Structure**: Follow existing plugin patterns in `public/plugin/`
2. **Configuration Schema**: Define parameters in `config.json` with proper types and constraints
3. **ES Module Format**: Use `.mjs` extensions for plugin implementations
4. **GSAP Integration**: Leverage existing GSAP dependency for animations
5. **Performance**: Ensure proper cleanup and memory management

#### Plugin Configuration Schema (manifest.json)

```json
{
  "name": "elastic",
  "version": "1.0.0",
  "pluginApi": "2.1",
  "minRenderer": "1.3.0",
  "entry": "index.mjs",
  "targets": ["text"],
  "capabilities": ["style-vars"],
  "peer": { "gsap": "^3.12.0" },
  "preload": [],
  "schema": {
    "bounceStrength": {
      "type": "number",
      "label": "바운스 강도",
      "description": "탄성 효과의 강도를 조절합니다",
      "default": 0.7,
      "min": 0.1,
      "max": 2,
      "step": 0.1
    },
    "animationDuration": {
      "type": "number",
      "label": "애니메이션 속도",
      "description": "전체 애니메이션 지속 시간 (초)",
      "default": 1.5,
      "min": 0.5,
      "max": 4,
      "step": 0.1
    }
  }
}
```

#### Audio Analysis Integration

- Access word-level audio metadata (volume_db, pitch_hz) for dynamic effects
- Use baseline calculation utilities for threshold-based triggers
- Consider speaker emotions and confidence levels for effect intensity

### Key Features

1. **Multi-Selection System**
   - Checkbox selection for multiple clips
   - Drag any selected clip to move all selected clips
   - Selection state managed in Zustand store

2. **Clip Editing**
   - Inline word editing
   - Speaker management with dropdown
   - Timeline display

3. **Undo/Redo**
   - Command pattern implementation
   - EditorHistory utility for state management

## 🚀 GPU 렌더링 시스템

### 시스템 개요

ECG는 **20-40배 속도 개선**을 달성하는 GPU 기반 서버 렌더링 시스템을 구현했습니다.

**성능 비교:**

- **현재 방식 (MediaRecorder)**: 1분 영상 → 5-10분 처리
- **GPU 렌더링**: 1분 영상 → **15-20초 처리** ⚡

### 전체 시스템 아키텍처

ECG는 두 개의 주요 처리 단계로 구성됩니다:

#### 1️⃣ Upload Phase (음성 분석)

```
Frontend → API Server → S3 Storage
                ↓
         ML Audio Server (WhisperX)
                ↓
         API Server (콜백 수신)
                ↓
         Frontend (텍스트/자막 결과)
```

**처리 과정:**

- 비디오 파일을 S3에 업로드
- ML Audio Server가 S3에서 비디오를 가져와 분석
- 화자 분리, 음성 인식, 감정 분석 수행
- 결과를 API Server로 콜백 전송
- Frontend는 polling으로 상태 확인 및 결과 수신

#### 2️⃣ Export Phase (GPU 렌더링)

```
Frontend → API Server → GPU Render Server
                ↓
         S3 Storage (렌더링된 비디오)
                ↓
         API Server (콜백 수신)
                ↓
         Frontend (다운로드 URL)
```

**처리 과정:**

- 편집된 자막 시나리오를 GPU 서버로 전송
- GPU 서버가 Playwright + FFmpeg로 렌더링 (20-40배 속도 개선)
- 완성된 비디오를 S3에 업로드
- Frontend는 File System Access API로 자동 저장

#### Phase 연결 흐름

```
Upload Phase 결과 (자막 데이터)
        ↓
    Editor에서 편집
        ↓
Export Phase 입력 (편집된 시나리오)
```

**중요**: Frontend는 ML/GPU 서버와 직접 통신하지 않고, 항상 **API Server를 통해** 간접 통신합니다.

### 프론트엔드 구현 상태

#### ✅ 완료된 기능

1. **ServerVideoExportModal.tsx**
   - GPU 렌더링 전용 UI 컴포넌트
   - 3단계 플로우: Ready → Exporting → Completed
   - 실시간 진행률 표시 및 예상 시간 계산

2. **File System Access API 통합**

   ```typescript
   // 렌더링 시작 시 저장 위치 선택
   const handle = await window.showSaveFilePicker({
     suggestedName: `${videoName}_GPU_${timestamp}.mp4`,
     types: [{ description: 'MP4 Video', accept: { 'video/mp4': ['.mp4'] } }],
   })
   ```

3. **useServerVideoExport.ts 훅**
   - 렌더링 상태 관리 (진행률, 예상 시간, 에러)
   - 자동 파일 저장 기능
   - 취소 및 에러 처리

4. **renderService.ts API 레이어**
   - 백엔드 호환 타입 시스템
   - 에러 코드별 세분화된 처리
   - 자동 폴백 시스템 (구형 브라우저)

#### 🔄 백엔드 연동 준비 완료

- **타입 정의**: 백엔드 FastAPI와 완벽 호환
- **에러 처리**: GPU 서버, 네트워크, 인증 오류 구분
- **인증 토큰**: JWT 연동 준비 (활성화 대기)

### API 플로우

#### 렌더링 요청

```typescript
// 1. 저장 위치 선택
const fileHandle = await selectSaveLocation()

// 2. 렌더링 시작
const response = await renderService.createRenderJob({
  videoUrl: 'https://s3.amazonaws.com/bucket/video.mp4',
  scenario: motionTextScenario,
  options: { width: 1920, height: 1080, fps: 30 },
})

// 3. 진행 상황 폴링 (5초 간격)
const status = await renderService.pollJobStatus(response.data.jobId)

// 4. 완료 시 자동 저장
if (status.status === 'completed') {
  await saveToSelectedLocation(status.downloadUrl, fileHandle)
}
```

### 사용자 경험 개선

#### 이전 플로우 (비효율적)

```
렌더링 시작 → 20-30초 대기 → 완료 → 다운로드 버튼 → 저장 위치 선택
```

#### 현재 플로우 (최적화됨)

```
GPU 렌더링 시작 → 저장 위치 먼저 선택 → 렌더링 진행 → 완료 시 자동 저장 ✨
```

### 에러 처리 체계

```typescript
enum RenderErrorCode {
  CREATE_JOB_ERROR = 'CREATE_JOB_ERROR',
  GPU_SERVER_ERROR = 'GPU_SERVER_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  ABORTED = 'ABORTED',
}

// 사용자 친화적 메시지
if (error.includes('GPU')) {
  showToast('GPU 서버에 일시적인 문제가 발생했습니다', 'error')
} else if (error.includes('network')) {
  showToast('네트워크 연결을 확인해주세요', 'error')
}
```

### 개발 환경 설정

#### 환경 변수

```bash
# .env.local
NEXT_PUBLIC_GPU_RENDER_API_URL=http://localhost:8000/api/render
```

#### GPU 렌더링 테스트

```bash
# 개발 서버 실행
yarn dev

# GPU 렌더링 모달 접근
# Editor → Export → GPU 렌더링 선택
```

### 파일 구조

#### GPU 렌더링 관련 파일들

```
src/
├── services/api/
│   ├── renderService.ts           # GPU 렌더링 API 서비스
│   └── types/render.types.ts      # 타입 정의
├── app/(route)/editor/
│   ├── components/Export/
│   │   └── ServerVideoExportModal.tsx  # GPU 렌더링 UI
│   └── hooks/
│       └── useServerVideoExport.ts     # 상태 관리 훅
└── types/
    └── file-system-access.d.ts    # File System Access API 타입
```

### 성능 메트릭

#### 측정 가능한 지표

- **처리 시간**: 비디오 길이 대비 렌더링 시간
- **성공률**: 완료된 작업 / 전체 요청 \* 100
- **사용자 만족도**: 대기 시간 및 품질 평가
- **자동 저장율**: File System Access API 사용률

#### 모니터링 도구

- **CloudWatch**: 백엔드 메트릭
- **Sentry**: 프론트엔드 에러 추적
- **Google Analytics**: 사용자 행동 분석

### 문서 참조

상세한 GPU 렌더링 시스템 정보는 다음 문서들을 참조하세요:

- **`docs/GPU_RENDERING_COMPLETE_ARCHITECTURE.md`**: 전체 시스템 아키텍처
- **`docs/BACKEND_REQUIREMENTS_FOR_GPU_RENDERING.md`**: 백엔드 구현 요구사항
- **`docs/GPU_RENDERING_API_SPEC.md`**: API 명세서

## 🔧 Configuration

### TypeScript

- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Use absolute imports

### ESLint

- Flat config format (ESLint 9)
- Next.js core web vitals rules
- Auto-fixable with `npm run lint:fix`

### TailwindCSS v4

- PostCSS-based configuration (postcss.config.mjs)
- No traditional tailwind.config.js
- Theme variables in globals.css
- Uses @tailwindcss/postcss plugin

### Next.js Configuration

- **Static Export**: Configured for S3 hosting with `output: 'export'`
- **Image Optimization**: Disabled for static hosting compatibility
- **Remote Patterns**: CloudFront domains configured for images

## 📝 Git Workflow & PR Automation

### Automated PR Creation Scripts

The project includes two powerful PR automation scripts in `.claude/scripts/`:

#### `prm` - Full PR Creation Workflow

```bash
# Creates commit, pushes, and generates PR with Claude Code analysis
prm "Feat: Your feature description"
```

**Features:**

- Validates git status and branch
- Creates commit with Claude Code co-authorship
- Pushes to remote branch
- Generates Claude Code prompt for analysis
- Handles large diffs with temporary files (>1000 lines)
- Interactive PR title/body input
- Auto-opens PR in browser

#### `pronly` - PR from Existing Commits

```bash
# Creates PR from already committed changes
pronly                    # Analyze all commits since dev branch
pronly abc123             # Analyze commits since specific hash
```

**Features:**

- Analyzes existing commit history
- Works with already pushed branches
- Flexible diff analysis (branch comparison or specific commit)
- Same Claude Code integration as `prm`

### Script Workflow

1. **Analysis Phase**:
   - Git status validation
   - Change detection and statistics
   - Diff generation for Claude Code

2. **Claude Integration**:
   - Auto-generates structured prompts
   - Copies to clipboard (macOS)
   - Handles large diffs with temporary files
   - Provides step-by-step instructions

3. **PR Creation**:
   - Interactive title/body input
   - Fallback templates if no input
   - GitHub CLI integration
   - Browser opening option

### Branch Workflow

- **Base Branch**: `dev` (all PRs target dev, not main)
- **Branch Protection**: Cannot create PRs from main/dev branches
- **Branch Naming**:
  - `feature/` - New features
  - `fix/` - Bug fixes
  - `refactor/` - Code refactoring

### Commit Convention

- `[Feat]` - New feature
- `[Fix]` - Bug fix
- `[Refactor]` - Code refactoring
- `[Docs]` - Documentation
- `[Test]` - Tests

**Auto-generated commits include Claude Code co-authorship**

## 🐳 Docker Support

```bash
# Development build
docker build --target dev -t ecg-frontend:dev .
docker run -p 3000:3000 --rm ecg-frontend:dev

# Production build
docker build --target prod -t ecg-frontend:prod .
```

## ⚠️ Important Notes

1. **Always use existing UI components** from `components/ui/` before creating new ones
2. React 19 compatibility: Use `--legacy-peer-deps` when installing packages
3. Development server may use port 3001 if 3000 is occupied
4. Husky pre-commit hooks run automatically
5. The editor page (`/editor`) is the main feature - handle with care
6. Scripts in `.claude/scripts/` are executable PR automation tools
7. Always run type-check and lint commands after code changes
8. **Plugin System**: Animation plugins use ES modules (.mjs) with manifest.json schema
9. **Audio Analysis**: `public/real.json` contains audio metadata for dynamic animation triggers
10. **Performance**: Animation cleanup is critical - ensure proper disposal of GSAP timelines and DOM listeners
11. **MotionText Integration**: Uses `motiontext-renderer` package for advanced subtitle animations
12. **Video Segment Management**: Handles deleted clip segments and skipping during playback
13. **Static Export**: Project configured for S3 static hosting deployment

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
