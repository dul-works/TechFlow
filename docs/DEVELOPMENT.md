# TechFlow — 개발 가이드

코드를 직접 읽지 않아도 전체 구조와 각 파트의 역할을 파악할 수 있도록 작성된 문서입니다.

---

## 프로젝트 구조

```
SYSTEM-GUIDE-TOOL/
├── Fonts/                    Samsung SS KR TTF 폰트 (PPT용, 시스템 설치 필요)
├── docs/
│   ├── USAGE.md              사용법 가이드
│   └── DEVELOPMENT.md        이 파일
└── app/                      웹 앱 루트
    ├── public/
    │   └── fonts/            Samsung SS KR WOFF2 폰트 (웹 렌더링용)
    └── src/
        ├── types/index.ts    TypeScript 타입 정의 전체 (단일 파일)
        ├── store/
        │   └── projectStore.ts   Zustand 글로벌 상태 (유일한 store)
        ├── data/
        │   └── defaultHardware.ts  기본 하드웨어 목록, 케이블 종류, 색상 팔레트
        ├── lib/
        │   └── pptExporter.ts    PPT 내보내기 로직 전체
        └── components/
            ├── SystemConfig/     System Config 에디터 관련 컴포넌트
            ├── CableGuide/       Cable Guide 에디터
            ├── ElecNetwork/      Elec & Network 에디터
            ├── HardwareList/     Hardware List 테이블
            ├── Cover/            표지 편집
            ├── Export/           저장/불러오기/내보내기 버튼 모음
            └── common/           공통 컴포넌트 (ZoneManager)
```

`App.tsx`가 페이지 라우팅과 전체 레이아웃을 담당합니다.

---

## 기술 스택

| 역할 | 라이브러리 | 버전 |
|------|-----------|------|
| 빌드 | Vite | 8.x |
| UI | React + TypeScript | 19.x |
| 다이어그램 에디터 | @xyflow/react (React Flow) | 12.x |
| 글로벌 상태 | Zustand | 5.x |
| PPT 생성 | PptxGenJS | 3.x |
| 이미지 크롭 | react-image-crop | 11.x |
| 색상 선택기 | react-colorful | 5.x |
| 스타일 | Tailwind CSS v3 + inline style |  |

---

## 상태 관리

**파일:** `src/store/projectStore.ts`

모든 편집 데이터는 **하나의 Zustand store**에서 관리됩니다.

```
ProjectStore
├── activePage: string          현재 표시 중인 페이지 ID
├── colorMap: Record<id, hex>   nodeId → 색상 (빠른 조회용 인덱스)
└── project: Project
    ├── name, date
    ├── activeZoneId
    └── zones: Zone[]
        ├── id, name
        ├── nodes: HardwareNode[]          하드웨어 블럭 (React Flow 좌표)
        ├── edges: CableEdge[]             케이블 연결
        ├── floorPlan?: FloorPlanSettings  도면 이미지 (base64) + 편집 설정
        ├── floorMarkers: FloorMarker[]    E&N 전원/인터넷 마커
        └── cableGuideNodePositions        Cable Guide 블럭 위치 (퍼센트 0~100)
```

**좌표계 분리 이유:**
- System Config 에디터(React Flow)는 내부 픽셀 좌표를 사용합니다.
- Cable Guide는 도면 이미지 크기와 무관하게 동작하기 위해 퍼센트 좌표를 별도 저장합니다.

---

## System Configuration 에디터

**핵심 파일:** `src/components/SystemConfig/SystemConfigEditor.tsx`

React Flow 기반. 기본 흐름:

1. 컴포넌트 마운트 시 store의 `zone.nodes / zone.edges`를 React Flow 형식으로 변환해 로컬 state 초기화
2. 노드/엣지 변경 이벤트(`onNodesChange`, `onEdgesChange`)마다 `syncNodes()` / `syncEdges()`로 store에 역방향 동기화
3. 팔레트에서 하드웨어 추가 → `addHardwareToCanvas()` → React Flow state + store 동시 업데이트
4. 케이블 연결 시 → `onConnect` 콜백 → 선택된 케이블 타입/색상을 `data`로 담아 edge 추가

**관련 컴포넌트:**

| 파일 | 역할 |
|------|------|
| `HardwareNode.tsx` | 하드웨어 블럭 노드 UI (색상 바, 이름, 모델, 4방향 Handle) |
| `CableEdge.tsx` | 케이블 엣지 UI (getSmoothStepPath 꺾인 선, 라벨, 삭제 버튼) |
| `HardwarePalette.tsx` | 좌측 하드웨어 목록 (드래그 지원) |
| `TechnicalList.tsx` | 우측 기술 목록 + 선택 노드/엣지 인라인 편집기 |
| `CableTypeSelector.tsx` | 상단 케이블 타입 선택 바 |

**문제 발생 시 확인 위치:**
- 블럭이 추가되지 않음 → `addHardwareToCanvas()` → `syncNodes()` 호출 여부
- 케이블 저장 안 됨 → `onConnect` → `syncEdges()` 호출 여부
- 삭제 안 됨 → React Flow `deleteElements` + store `removeNode`/`removeEdge` 연결 여부

---

## Cable Guide 에디터

**핵심 파일:** `src/components/CableGuide/CableGuideEditor.tsx`

- **도면 이미지**: `<img>` 태그에 CSS `filter`(grayscale, opacity) 직접 적용
- **블럭 위치**: `position: absolute` + 퍼센트(`%`) 좌표, mousedown → mousemove → store 업데이트 패턴으로 드래그 구현
- **케이블 선**: `<svg>` 위에 `<line>` 요소로 노드 중심점 연결 (SVG가 캔버스 전체 덮음)
- **이미지 편집 팝업**: `ImageEditor.tsx` (react-image-crop 사용) → `FloorPlanSettings`를 store에 저장

---

## Electricity & Network 에디터

**핵심 파일:** `src/components/ElecNetwork/ElecNetworkEditor.tsx`

- Cable Guide와 `zone.floorPlan` 이미지 **공유** (별도 업로드 없음)
- 마커 추가: `addingMarker` 상태가 활성화된 동안 캔버스 클릭 → 퍼센트 좌표로 `FloorMarker` 생성
- 마커 이동: Cable Guide 블럭 드래그와 동일한 mousedown → mousemove 패턴

---

## Hardware List 테이블

**핵심 파일:** `src/components/HardwareList/HardwareListTable.tsx`

- `zone.nodes`를 `"이름__모델"` 키로 집계 → `HardwareRow[]` 생성
- 담당 전환(`LOCAL` ↔ `I M FINE`): 같은 키를 가진 **모든 노드**에 `updateNode(responsibility)` 일괄 적용
- Remark 편집: 인라인 `<input>`, `onBlur` 이벤트에 store 업데이트

---

## PPT 내보내기

**핵심 파일:** `src/lib/pptExporter.ts`

PptxGenJS로 PowerPoint에서 **직접 편집 가능한** 형태로 출력합니다.

### Shape 사용 원칙

| 요소 | PptxGenJS API | 이유 |
|------|-------------|------|
| 하드웨어 블럭 | `addText([...], { shape: 'rect' })` | 텍스트가 사각형 내부에 포함 → 단일 편집 객체 |
| 케이블 연결선 | `addShape('bentConnector3')` or `'straightConnector1'` | 단일 연결선 도형 |
| 하드웨어 리스트 | `addTable([headerRow, ...rows])` | 진짜 PowerPoint 표 |
| 색상 바 (블럭 상단 띠) | `addShape('rect')` | 별도 편집 가능한 도형 |

> `bentConnector3` / `straightConnector1`은 PptxGenJS TypeScript 타입에 미포함이므로 `as any as PptxGenJS.SHAPE_NAME`으로 캐스팅해 사용합니다. (파일 상단 BENT_CONNECTOR / STRAIGHT_CONNECTOR 상수)

### 좌표 변환 (`normalizePositions()`)

React Flow 픽셀 좌표 → PPT 인치 좌표 변환:

1. 전체 노드의 바운딩박스(min/max x, y) 계산
2. 슬라이드의 캔버스 영역(`CVS_W × CVS_H`)에 맞게 비율 유지 축소
3. 캔버스 중앙 정렬

**문제 발생 시 확인 위치:**
- PPT 다운로드 안 됨 → `exportToPPT()` try-catch, ExportPanel의 상태 확인
- 하드웨어 블럭 위치 이상 → `normalizePositions()` scale/offset 계산 확인
- 폰트 깨짐 → `FONT_HEAD = 'Samsung SS Head KR'` 값이 설치된 폰트 이름과 일치하는지 확인 (`Fonts/` 폴더 TTF 설치)
- 케이블 선 미표시 → `addShape(BENT_CONNECTOR)` bounding box(bx/by/bw/bh) 확인
- 테이블 공백 → `addHardwareListSlide()` 내 `rows` 배열이 비어있는지 확인

---

## 기본 데이터 수정

**파일:** `src/data/defaultHardware.ts`

- `DEFAULT_HARDWARE` 배열에 항목 추가 → 팔레트에 자동 반영
- `CABLE_TYPES` 배열에 케이블 추가 → 상단 케이블 선택 바에 자동 반영
- `defaultColor` 지정 시 해당 하드웨어의 초기 색상이 고정됨
- `getNextColor()` — 색상 지정이 없는 블럭에 팔레트 순환 방식으로 자동 배정

---

## 폰트 구조

| 경로 | 형식 | 용도 |
|------|------|------|
| `Fonts/*.ttf` | TTF | 시스템 설치 → PPT 렌더링 |
| `app/public/fonts/*.woff2` | WOFF2 | 웹앱 내 렌더링 (`@font-face` in `index.css`) |

PPT에서 `fontFace: 'Samsung SS Head KR'`을 지정하면 해당 이름으로 시스템에 설치된 TTF가 사용됩니다.

---

## 개발 커맨드

```bash
cd app
npm install          # 의존성 설치 (최초 1회)
npx vite --port 5173 # 개발 서버 (http://localhost:5173)
npm run build        # 프로덕션 빌드 → app/dist/
```
