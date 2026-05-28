# TechFlow

미디어아트 행사용 하드웨어 시스템 구성 문서를 웹에서 제작하고 PPT로 내보내는 도구입니다.

System Configuration, Cable Guide, Electricity & Network, Hardware List 문서를 Zone 단위로 작성하고, PowerPoint(.pptx) 및 JSON 형식으로 내보낼 수 있습니다.

## 시작하기

```bash
cd app
npm install
npx vite --port 5173
```

브라우저에서 `http://localhost:5173` 접속

## 주요 기능

- **System Config** — 하드웨어 블럭과 케이블 연결 다이어그램 (React Flow 기반, 20px 그리드 스냅)
- **Cable Guide** — 도면 이미지 위 하드웨어 위치 및 케이블 경로 표시
- **Elec & Network** — 전원/인터넷 마커 배치
- **Hardware List** — LOCAL / I M FINE 분류 자동 집계
- **PPT 내보내기** — PowerPoint에서 직접 편집 가능한 형태로 출력
- **JSON 저장/불러오기** — 프로젝트 재편집 지원

## 배포 (Cloudflare Pages)

### 대시보드 배포
Cloudflare Pages 대시보드에서 GitHub 연결 후 아래 설정:

| 항목 | 값 |
|------|-----|
| Root directory | `app` |
| Build command | `npm run build` |
| Build output directory | `dist` |

### CLI 배포
```bash
cd app
npm run build
npx wrangler pages deploy dist
```

## 폰트 설치

PPT 출력에 Samsung SS Head KR / Samsung SS Body KR 폰트가 사용됩니다.  
`Fonts/` 폴더의 `.ttf` 파일을 시스템에 설치하세요.

## 문서

- [사용법](docs/USAGE.md)
- [개발 가이드](docs/DEVELOPMENT.md)

## 기술 스택

- Vite + React + TypeScript
- @xyflow/react (React Flow v12)
- Zustand
- PptxGenJS
- Tailwind CSS v3
