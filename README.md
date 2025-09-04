# ECG Frontend

ECG Player를 사용한 고급 자막 시스템 프론트엔드

## 🚀 빠른 시작

### 팀원용 (GitHub 패키지 사용)

```bash
# 프로젝트 클론
git clone <repository-url>
cd ecg-frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

### 로컬 개발자용 (ECG Player 연동)

```bash
# 환경변수 설정
cp .env.local.example .env.local

# .env.local에서 USE_LOCAL_ECG_PLAYER=true 설정
echo "USE_LOCAL_ECG_PLAYER=true" >> .env.local

# 로컬 플레이어 모드로 개발 서버 시작
npm run dev:local-player
```

## 🏗️ ECG Player 통합

### 설치 방법

#### 1. GitHub 패키지 (기본)

```bash
npm install
```

#### 2. 로컬 개발 모드

```bash
# ECG Player 로컬 경로: ../../../ass-generator/ecg-player/src
npm run dev:local-player
```

### 사용법

```tsx
import { CaptionWithIntention } from 'ecg-player'
import { VideoProvider, useVideo } from '@/contexts/VideoContext'

function VideoPlayer() {
  const { videoUrl, captionData } = useVideo()

  return (
    <CaptionWithIntention
      videoSrc={videoUrl}
      timingSyncSrc={JSON.stringify(captionData)}
      width={960}
      height={540}
      responsive={true}
    />
  )
}

function App() {
  return (
    <VideoProvider>
      <VideoPlayer />
    </VideoProvider>
  )
}
```

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── editor/page.tsx        # 메인 편집기 페이지
│   └── layout.tsx
├── components/
│   ├── ECGPlayer.tsx          # ECG Player 래퍼 컴포넌트
│   ├── UploadModal.tsx        # 비디오 업로드 모달
│   └── Header.tsx             # 헤더 (업로드 버튼 포함)
├── contexts/
│   └── VideoContext.tsx       # 비디오 상태 관리
└── lib/
```

## 🔧 환경 변수

```bash
# ECG Player 로컬 개발 모드
USE_LOCAL_ECG_PLAYER=true

# 백엔드 URL
BACKEND_URL=http://localhost:8000

# Docker 환경
DOCKER=false
```

## 📝 개발 스크립트

```bash
# 일반 개발 (GitHub 패키지 사용)
npm run dev

# 로컬 ECG Player 연동
npm run dev:local-player

# 빌드
npm run build

# 린트
npm run lint
npm run lint:fix

# 타입 체크
npm run type-check
```

## 🚨 주의사항

### GitHub 패키지 인증

GitHub 패키지를 사용하려면 `.npmrc` 파일이 설정되어 있어야 합니다:

```bash
# .npmrc (이미 설정됨)
@teamkimtaerin:registry=https://npm.pkg.github.com
```

개인 액세스 토큰이 필요한 경우:

```bash
npm login --scope=@teamkimtaerin --registry=https://npm.pkg.github.com
```

### 로컬 개발 환경

로컬 개발 시 ECG Player 경로가 올바른지 확인하세요:

- 예상 경로: `../../../ass-generator/ecg-player/src`
- 실제 경로와 다를 경우 `next.config.ts`에서 수정

## 🔄 워크플로우

### 1. 비디오 업로드

1. Header의 "Upload Video" 버튼 클릭
2. 파일 선택 또는 드래그&드롭
3. 비디오가 VideoContext에 저장

### 2. ECG Player 렌더링

1. ECGPlayer 컴포넌트가 VideoContext에서 비디오 URL 읽기
2. `/public/sample/real.json` 자막 데이터 로드
3. CaptionWithIntention 컴포넌트 렌더링

### 3. 실시간 개발

- 로컬 모드에서 ECG Player 소스 수정 시 HMR 동작
- 타입 체크 및 빌드 오류 실시간 확인

## 🐛 문제 해결

### ECG Player 로드 실패

```bash
# 모듈 설치 확인
npm ls ecg-player

# 로컬 경로 확인
ls -la ../../../ass-generator/ecg-player/src
```

### 타입 오류

```bash
# 타입 체크
npm run type-check

# ECG Player 타입 확인
npm ls @types/ecg-player
```

### 빌드 오류

```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어
npm run build -- --no-cache
```

## 📚 API 참조

### VideoContext

```tsx
interface VideoState {
  videoFile: File | null
  videoUrl: string | null
  captionData: TimingSyncData | null
  isPlaying: boolean
  currentTime: number
  duration: number
}

interface VideoActions {
  setVideoFile: (file: File | null) => void
  setVideoUrl: (url: string | null) => void
  setCaptionData: (data: TimingSyncData | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  resetVideo: () => void
}
```

### ECG Player Props

```tsx
interface CaptionWithIntentionProps {
  videoSrc?: string
  timingSyncSrc?: string
  width?: number
  height?: number
  responsive?: boolean
}
```

---

## Next.js 프로젝트 기본 정보

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 PR 자동화 도구 - 팀원 설정 가이드

### 0. Github CLI 설치

```bash
brew install gh      # macOS
winget install Github.cli  # Windows
```

### 1. 최신 코드 받기

```bash
git pull origin main
```

### 2. 설치 스크립트 실행 (한 번만)

```bash
chmod +x install.sh
./install.sh
```

### 3. PATH 적용 (설치 후 한 번만)

```bash
source ~/.zshrc  # zsh 사용자 (macOS 기본)
source ~/.bashrc # bash 사용자
```

### 4. GitHub CLI 로그인 (각자 개인 계정으로)

```bash
gh auth login
# → GitHub.com 선택
# → HTTPS 선택
# → Y (인증)
# → Login with a web browser 선택
```

### 5. 사용 시작!

```bash
# 작업 후 변경사항 추가
git add .

# PR 생성 (자동 커밋 + 푸시 + Claude 분석 + PR)
prm "Feat: 첫 번째 테스트 PR"  # ⚠️ pr이 아닌 prm 사용!
```

### 📝 사용 흐름

1. **코드 작업** → 기능 구현
2. **`git add .`** → 변경사항 스테이징
3. **`prm "작업 내용"`** → 자동 커밋/푸시
4. **Claude Code 분석**
   - 클립보드에 자동 복사된 프롬프트를 claude.ai/code에 붙여넣기
   - 생성된 PR 내용 복사
5. **터미널에 붙여넣기** → PR 자동 생성!

### ⚠️ 주의사항

- 명령어는 `pr`이 아닌 `prm` (PR Make)
- 작업은 feature 브랜치에서 (main 브랜치 X)
- Claude Code 접속: https://claude.ai/code

---

## ⭐️ Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 🐳 Docker

### 1. Docker Desktop 실행

### 2. 실행 확인

```bash
# Docker Desktop이 완전히 시작될 때까지 1-2분 기다린 후
docker info

# 이렇게 나오면 성공
Server:
 Containers: X
 Running: X
 ...
```

### 3. 빌드 테스트

#### 개발환경 버전

```bash
# 개발환경 빌드 테스트
docker build --target dev -t ecg-frontend:dev .

# 개발 컨테이너 실행 (포트 매핑)
docker run -p 3000:3000 --rm ecg-frontend:dev
```

#### API 테스트

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/test
```

### 참고 명령어

```bash
# 현재 8000번 포트를 사용 중인 프로세스
lsof -i :8000

# 프로세스를 종료
kill -9 <PID>

# 기존에 실행 중인 Docker 컨테이너 확인 및 제거
docker ps -a

# 컨테이너 로그 확인
docker logs <컨테이너 이름 또는 ID>

# 기존 컨테이너 삭제
docker rm <컨테이너 이름 또는 ID>

# 실행 여부와 상관 없이 삭제
docker rm -f <컨테이너 이름 또는 ID>

# 컨테이너 정리
docker stop <컨테이너 이름 또는 ID> && docker rm <컨테이너 이름 또는 ID>
```

---

## ⚙️ CI Workflow (ci.yml)

### 워크플로우 트리거 조건 (`on`)

- `main` 또는 `dev` 브랜치에 푸시(push)되거나, `main` 또는 `dev` 브랜치를 대상으로 풀 리퀘스트(pull_request)가 생성/업데이트될 때 자동으로 실행

### 실행 작업 (`jobs`)

`build-and-test`라는 단일 작업(Job)으로 구성되어 있으며, 이 작업은 `ubuntu-latest` 가상 환경에서 순차적으로 여러 단계를 실행

#### 1. 코드 체크아웃

- `actions/checkout@v4` 액션을 사용하여 GitHub 저장소의 최신 코드를 가상 머신으로 가져옴

#### 2. 환경 설정

- `actions/setup-node@v4` 액션으로 Node.js 20 버전을 설정하고, `cache: 'yarn'` 옵션을 통해 의존성 캐싱을 활성화하여 빌드 시간을 단축
- `corepack enable` 명령어로 Yarn을 활성화하고, `yarn cache clean` 명령어로 캐시를 정리해 깨끗한 상태에서 시작

#### 3. 의존성 및 코드 품질 검사

- `yarn install` 명령어를 실행하여 프로젝트에 필요한 모든 의존성을 설치
- `yarn format:check`로 코드 포맷팅 규칙을 준수했는지 확인
- `yarn lint`로 코드의 잠재적 오류를 찾아내는 린팅 검사를 수행
- `yarn type-check`로 TypeScript의 타입 오류가 없는지 확인

#### 4. 빌드 및 테스트

- `yarn build` 명령어로 Next.js 프로젝트를 빌드하여 프로덕션 환경에서 문제가 없는지 검증
- **Jest 유닛 테스트**: `jest.config.*` 파일이 존재할 경우, `yarn test` 명령어를 실행하여 단위 및 통합 테스트를 수행
- **Playwright E2E 테스트**: `playwright.config.*` 파일이 존재할 경우, `yarn playwright install`로 브라우저를 설치한 후, `yarn test:e2e` 명령어로 실제 사용자처럼 동작하는 E2E 테스트를 실행

#### 5. Docker 빌드 테스트

- `docker build` 명령어를 사용하여 `dev`와 `prod` 환경용 Docker 이미지가 성공적으로 빌드되는지 확인
- 배포 과정에서 발생할 수 있는 빌드 문제를 사전 방지

#### 6. 테스트 결과 업로드

- `if: failure()` 조건에 따라, 위의 스텝들 중 하나라도 실패했을 경우 `actions/upload-artifact@v4` 액션이 실행
- `test-results/` 및 `playwright-report/` 디렉토리에 있는 테스트 리포트를 아티팩트(artifact)로 저장
