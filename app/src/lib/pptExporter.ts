/**
 * PPT Exporter — 원본 PDF 디자인 기준으로 재작성
 *
 * 디자인 원칙:
 * - 콘텐츠 슬라이드: 흰색 배경, 검정 제목
 * - 표지: 검정 배경, 흰 텍스트, 좌하단 정렬
 * - Zone 표지: 파란색(#1633FF) 전체 배경
 * - 하드웨어 블럭: roundRect + solid 컬러 채우기 + 검정 굵은 텍스트
 * - Technical List: 검정 헤더 박스, 흰 배경 + 컬러 인디케이터
 * - Hardware List: Now Brief(검정 헤더) + Local(하늘색)/IMF(살구색) 서브헤더
 */

import PptxGenJS from 'pptxgenjs';
import type { Project, Zone, HardwareNode } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BENT_CONNECTOR   = 'bentConnector3'   as any as PptxGenJS.SHAPE_NAME;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STRAIGHT_CONNECTOR = 'straightConnector1' as any as PptxGenJS.SHAPE_NAME;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ROUND_RECT       = 'roundRect'         as any as PptxGenJS.SHAPE_NAME;

// ─── 슬라이드 기본 치수 ────────────────────────────────────────
const W = 13.33;   // 슬라이드 너비 (inch, 16:9 Wide)
const H = 7.5;     // 슬라이드 높이

// 콘텐츠 슬라이드 레이아웃
const MARGIN_X  = 0.35;
const CRUMB_Y   = 0.14;   // 브레드크럼 y
const TITLE_Y   = 0.42;   // 페이지 제목 y
const CONTENT_Y = 1.05;   // 콘텐츠 시작 y
const CONTENT_H = H - CONTENT_Y - 0.2;

// Technical List 패널 (오른쪽)
const TECH_W  = 2.35;
const TECH_X  = W - TECH_W - 0.25;
const TECH_Y  = 0.88;
const TECH_HDR_H = 0.30;  // 검정 헤더 높이

// 다이어그램 캔버스 영역 (System Config)
const CVS_X = MARGIN_X;
const CVS_Y = CONTENT_Y;
const CVS_W = TECH_X - MARGIN_X - 0.2;
const CVS_H = CONTENT_H;

// 하드웨어 블럭 치수
const NODE_W = 1.45;
const NODE_H = 0.55;

// 폰트
const FONT_HEAD = 'Samsung SS Head KR';
const FONT_BODY = 'Samsung SS Body KR';

// 컬러 팔레트 (PDF 디자인 기준)
const C = {
  WHITE:     'FFFFFF',
  BLACK:     '000000',
  BLUE_ZONE: '1633FF',  // Zone 표지 파란색
  GRAY_CRUMB:'999999',  // 브레드크럼 텍스트
  GRAY_BODY: '444444',  // 일반 본문 텍스트
  // Hardware List 테이블
  LOCAL_HDR:  '6DD5F5', // Local 컬럼 헤더 (하늘색)
  LOCAL_ROW:  'EAF6FF', // Local 교대 행 (연한 하늘)
  IMF_HDR:    'F48B9B', // IMF 컬럼 헤더 (살구색)
  IMF_ROW:    'FFEBEE', // IMF 교대 행 (연한 분홍)
  TABLE_BDR:  'CCCCCC', // 테이블 테두리
};

// ─── 유틸 ──────────────────────────────────────────────────────
function col(hex: string): string {
  return hex.replace('#', '').toUpperCase().padStart(6, '0');
}

/** React Flow 픽셀 좌표 → PPT 인치 좌표 변환 */
function normalizePositions(nodes: HardwareNode[]): Record<string, { x: number; y: number }> {
  if (nodes.length === 0) return {};

  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const maxX = Math.max(...xs), maxY = Math.max(...ys);

  const rangeX = Math.max(maxX - minX + 200, 400);
  const rangeY = Math.max(maxY - minY + 140, 300);

  const scaleX = (CVS_W - NODE_W) / rangeX;
  const scaleY = (CVS_H - NODE_H) / rangeY;
  const scale  = Math.min(scaleX, scaleY, 0.018); // 너무 크지 않게

  const scaledW = rangeX * scale;
  const scaledH = rangeY * scale;
  const offX = CVS_X + (CVS_W - scaledW - NODE_W) / 2;
  const offY = CVS_Y + (CVS_H - scaledH - NODE_H) / 2;

  const result: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n) => {
    result[n.id] = {
      x: offX + (n.position.x - minX) * scale,
      y: offY + (n.position.y - minY) * scale,
    };
  });
  return result;
}

// ─── 콘텐츠 슬라이드 공통 레이아웃 ────────────────────────────
function addContentHeader(
  slide: PptxGenJS.Slide,
  title: string,
  crumb: string,          // 예: "ILP25 London · 200MP Viewing"
) {
  slide.background = { color: C.WHITE };

  // 브레드크럼 (작은 회색 텍스트)
  slide.addText(crumb, {
    x: MARGIN_X, y: CRUMB_Y, w: W - MARGIN_X * 2, h: 0.22,
    fontSize: 9, color: C.GRAY_CRUMB, fontFace: FONT_HEAD,
  });

  // 페이지 제목
  slide.addText(title, {
    x: MARGIN_X, y: TITLE_Y, w: TECH_X - MARGIN_X - 0.2, h: 0.52,
    fontSize: 28, bold: true, color: C.BLACK, fontFace: FONT_HEAD,
  });
}

// ─── Technical List 패널 ───────────────────────────────────────
function addTechListPanel(
  slide: PptxGenJS.Slide,
  zone: Zone,
  showHardware: boolean = true,
) {
  // 검정 헤더 박스
  slide.addShape('rect', {
    x: TECH_X, y: TECH_Y, w: TECH_W, h: TECH_HDR_H,
    fill: { color: C.BLACK }, line: { color: C.BLACK, width: 0 },
  });
  slide.addText('Technical List', {
    x: TECH_X, y: TECH_Y, w: TECH_W, h: TECH_HDR_H,
    fontSize: 10, bold: true, color: C.WHITE, align: 'center', valign: 'middle',
    fontFace: FONT_HEAD,
  });

  let ly = TECH_Y + TECH_HDR_H + 0.1;
  const itemH = 0.22;
  const swatchSz = 0.12;
  const textX = TECH_X + 0.22;
  const textW = TECH_W - 0.28;

  // 하드웨어 항목
  if (showHardware) {
    const hwItems = Object.values(
      zone.nodes.reduce<Record<string, { name: string; color: string }>>((acc, n) => {
        if (!acc[n.data.name]) acc[n.data.name] = { name: n.data.name, color: n.data.color };
        return acc;
      }, {})
    );

    hwItems.forEach((hw) => {
      slide.addShape('rect', {
        x: TECH_X + 0.04, y: ly + (itemH - swatchSz) / 2,
        w: swatchSz, h: swatchSz,
        fill: { color: col(hw.color) }, line: { color: col(hw.color), width: 0 },
      });
      slide.addText(hw.name, {
        x: textX, y: ly, w: textW, h: itemH,
        fontSize: 8.5, color: C.BLACK, fontFace: FONT_BODY, valign: 'middle',
      });
      ly += itemH + 0.03;
    });

    if (hwItems.length > 0) ly += 0.06;
  }

  // 케이블 항목
  const cableItems = Object.values(
    zone.edges.reduce<Record<string, { type: string; color: string; dashed?: boolean }>>((acc, e) => {
      if (!acc[e.data.type]) {
        acc[e.data.type] = {
          type: e.data.type, color: e.data.color,
          dashed: (e.data as { dashed?: boolean }).dashed,
        };
      }
      return acc;
    }, {})
  );

  cableItems.forEach((cable) => {
    // 컬러 케이블 선 인디케이터
    slide.addShape(STRAIGHT_CONNECTOR, {
      x: TECH_X + 0.04, y: ly + itemH / 2,
      w: swatchSz, h: 0,
      line: {
        color: col(cable.color), width: 2,
        dashType: cable.dashed ? 'dash' : 'solid',
      },
    });
    slide.addText(cable.type, {
      x: textX, y: ly, w: textW, h: itemH,
      fontSize: 8.5, color: C.BLACK, fontFace: FONT_BODY, valign: 'middle',
    });
    ly += itemH + 0.03;
  });
}

// ─── 표지 슬라이드 ─────────────────────────────────────────────
function addCoverSlide(pptx: PptxGenJS, project: Project) {
  const slide = pptx.addSlide();
  slide.background = { color: C.BLACK };

  // 우측 상단 I M fine 로고
  slide.addText('I M fine', {
    x: W - 1.8, y: 0.18, w: 1.6, h: 0.28,
    fontSize: 11, color: 'CCCCCC', align: 'right', fontFace: FONT_HEAD,
  });

  // 프로젝트명 + "System Configuration" — 좌측 중앙 세로 배치
  const textY = H * 0.38;
  slide.addText(project.name, {
    x: MARGIN_X + 0.15, y: textY, w: W * 0.65, h: 0.72,
    fontSize: 38, bold: true, color: C.WHITE, fontFace: FONT_HEAD,
  });
  slide.addText('System Configuration', {
    x: MARGIN_X + 0.15, y: textY + 0.78, w: W * 0.65, h: 0.6,
    fontSize: 38, bold: true, color: C.WHITE, fontFace: FONT_HEAD,
  });

  // 하단 푸터
  slide.addText('SAMSUNG', {
    x: MARGIN_X + 0.15, y: H - 0.44, w: 2.5, h: 0.28,
    fontSize: 10, bold: true, color: C.WHITE, fontFace: FONT_HEAD,
  });
  slide.addText('I M fine', {
    x: W / 2 - 1, y: H - 0.44, w: 2, h: 0.28,
    fontSize: 10, color: 'AAAAAA', align: 'center', fontFace: FONT_HEAD,
  });
  slide.addText(project.date, {
    x: W - 2.5, y: H - 0.44, w: 2.2, h: 0.28,
    fontSize: 10, color: 'AAAAAA', align: 'right', fontFace: FONT_HEAD,
  });
}

// ─── Zone 표지 슬라이드 ────────────────────────────────────────
function addZoneCoverSlide(pptx: PptxGenJS, zone: Zone) {
  const slide = pptx.addSlide();
  slide.background = { color: C.BLUE_ZONE };

  slide.addText(zone.name, {
    x: 1, y: H / 2 - 0.45, w: W - 2, h: 0.9,
    fontSize: 32, color: C.WHITE, align: 'center', valign: 'middle',
    fontFace: FONT_HEAD,
  });
}

// ─── System Configuration 슬라이드 ────────────────────────────
function addSystemConfigSlide(pptx: PptxGenJS, zone: Zone, project: Project) {
  const slide = pptx.addSlide();
  addContentHeader(slide, 'System Configuration', `${project.name}  ${zone.name}`);

  const nodePos = normalizePositions(zone.nodes);

  // ── 케이블 연결선 (노드 아래 레이어) ──
  zone.edges.forEach((edge) => {
    const src = nodePos[edge.source];
    const tgt = nodePos[edge.target];
    if (!src || !tgt) return;

    const sx = src.x + NODE_W / 2, sy = src.y + NODE_H / 2;
    const tx = tgt.x + NODE_W / 2, ty = tgt.y + NODE_H / 2;

    const bx = Math.min(sx, tx);
    const by = Math.min(sy, ty);
    const bw = Math.max(Math.abs(tx - sx), 0.02);
    const bh = Math.max(Math.abs(ty - sy), 0.02);

    const isAligned = Math.abs(ty - sy) < 0.04 || Math.abs(tx - sx) < 0.04;
    const shapeType = isAligned ? STRAIGHT_CONNECTOR : BENT_CONNECTOR;

    slide.addShape(shapeType, {
      x: bx, y: by, w: bw, h: bh,
      line: {
        color: col(edge.data.color),
        width: 1.8,
        dashType: (edge.data as { dashed?: boolean }).dashed ? 'dash' : 'solid',
      },
      flipH: tx < sx,
      flipV: ty < sy,
    });
  });

  // ── 하드웨어 블럭 — roundRect + solid 컬러 채우기 ──
  zone.nodes.forEach((node) => {
    const pos = nodePos[node.id];
    if (!pos) return;
    const c = col(node.data.color);
    const nameText = node.data.name + (node.data.quantity > 1 ? ` ×${node.data.quantity}` : '');

    slide.addText(
      [
        { text: nameText, options: { fontSize: 9.5, bold: true, color: C.BLACK, breakLine: true } },
        { text: node.data.model ?? '', options: { fontSize: 7, bold: false, color: '333333' } },
      ],
      {
        x: pos.x, y: pos.y, w: NODE_W, h: NODE_H,
        shape: ROUND_RECT,
        rectRadius: 0.06,
        fill: { color: c },
        line: { color: c, width: 0 },
        fontFace: FONT_HEAD,
        valign: 'middle',
        align: 'center',
        margin: [0.06, 0.08, 0.06, 0.08],
      }
    );
  });

  // ── Technical List (케이블만) ──
  addTechListPanel(slide, zone, false);
}

// ─── Cable Guide 슬라이드 ──────────────────────────────────────
function addCableGuideSlide(pptx: PptxGenJS, zone: Zone, project: Project) {
  const slide = pptx.addSlide();
  addContentHeader(slide, 'Cable Guide', `${project.name}  ${zone.name}`);

  const canvasX = MARGIN_X;
  const canvasY = CONTENT_Y;
  const canvasW = CVS_W;
  const canvasH = CVS_H;
  const blockW  = NODE_W * 0.8;
  const blockH  = NODE_H * 0.75;

  // 도면 이미지
  if (zone.floorPlan?.imageDataUrl) {
    slide.addImage({
      data: zone.floorPlan.imageDataUrl,
      x: canvasX, y: canvasY, w: canvasW, h: canvasH,
      transparency: Math.round((1 - zone.floorPlan.opacity) * 100),
    });
  }

  // 하드웨어 블럭 오버레이
  const posMap = zone.cableGuideNodePositions;
  zone.nodes.forEach((node) => {
    const p = posMap[node.id];
    if (!p) return;
    const nx = canvasX + (p.x / 100) * canvasW;
    const ny = canvasY + (p.y / 100) * canvasH;
    const c  = col(node.data.color);

    slide.addText(node.data.name, {
      x: nx, y: ny, w: blockW, h: blockH,
      shape: ROUND_RECT,
      rectRadius: 0.04,
      fill: { color: c },
      line: { color: c, width: 0 },
      fontSize: 7.5, bold: true, color: C.BLACK,
      align: 'center', valign: 'middle',
      fontFace: FONT_HEAD,
    });
  });

  // 케이블 연결선
  zone.edges.forEach((edge) => {
    const sp = posMap[edge.source], tp = posMap[edge.target];
    if (!sp || !tp) return;
    const sx = canvasX + (sp.x / 100) * canvasW + blockW / 2;
    const sy = canvasY + (sp.y / 100) * canvasH + blockH / 2;
    const tx = canvasX + (tp.x / 100) * canvasW + blockW / 2;
    const ty = canvasY + (tp.y / 100) * canvasH + blockH / 2;

    const bx = Math.min(sx, tx), by = Math.min(sy, ty);
    const bw = Math.max(Math.abs(tx - sx), 0.02);
    const bh = Math.max(Math.abs(ty - sy), 0.02);

    slide.addShape(BENT_CONNECTOR, {
      x: bx, y: by, w: bw, h: bh,
      line: { color: col(edge.data.color), width: 1.5 },
      flipH: tx < sx, flipV: ty < sy,
    });
  });

  // Technical List (하드웨어 + 케이블)
  addTechListPanel(slide, zone, true);
}

// ─── Electricity & Network 슬라이드 ───────────────────────────
function addElecNetworkSlide(pptx: PptxGenJS, zone: Zone, project: Project) {
  const slide = pptx.addSlide();
  addContentHeader(slide, 'Electricity & Network', `${project.name}  ${zone.name}`);

  const canvasX = MARGIN_X;
  const canvasY = CONTENT_Y;
  const canvasW = CVS_W;
  const canvasH = CVS_H;

  if (zone.floorPlan?.imageDataUrl) {
    slide.addImage({
      data: zone.floorPlan.imageDataUrl,
      x: canvasX, y: canvasY, w: canvasW, h: canvasH,
      transparency: Math.round((1 - zone.floorPlan.opacity) * 100),
    });
  }

  const MARKER_STYLE: Record<string, { color: string; label: string }> = {
    '220v':        { color: 'E53935', label: '220V' },
    'internet':    { color: 'E57373', label: 'Internet' },
    'powerstrip':  { color: '333333', label: 'Powerstrip' },
    'usb_repeater':{ color: 'FFA726', label: 'USB Repeater' },
  };

  // 마커 배치
  zone.floorMarkers.forEach((m) => {
    const style = MARKER_STYLE[m.type] ?? { color: 'AAAAAA', label: m.type };
    const mx = canvasX + (m.x / 100) * canvasW;
    const my = canvasY + (m.y / 100) * canvasH;

    // 컬러 박스 마커
    slide.addShape('rect', {
      x: mx - 0.15, y: my - 0.15, w: 0.3, h: 0.3,
      fill: { color: style.color }, line: { color: style.color, width: 0 },
    });
  });

  // Technical List — 마커 범례
  slide.addShape('rect', {
    x: TECH_X, y: TECH_Y, w: TECH_W, h: TECH_HDR_H,
    fill: { color: C.BLACK }, line: { color: C.BLACK, width: 0 },
  });
  slide.addText('Technical List', {
    x: TECH_X, y: TECH_Y, w: TECH_W, h: TECH_HDR_H,
    fontSize: 10, bold: true, color: C.WHITE, align: 'center', valign: 'middle',
    fontFace: FONT_HEAD,
  });

  let ly = TECH_Y + TECH_HDR_H + 0.1;
  const activeMarkers = ['220v', 'internet'];

  activeMarkers.forEach((type) => {
    const count = zone.floorMarkers.filter((m) => m.type === type).length;
    const style = MARKER_STYLE[type];
    const label = type === 'internet' ? `Internet – 100Mbps` : '220V';

    slide.addShape('rect', {
      x: TECH_X + 0.04, y: ly + 0.05, w: 0.12, h: 0.12,
      fill: { color: style.color }, line: { color: style.color, width: 0 },
    });
    slide.addText(`${label}${count > 0 ? ` ×${count}` : ''}`, {
      x: TECH_X + 0.22, y: ly, w: TECH_W - 0.28, h: 0.22,
      fontSize: 8.5, color: C.BLACK, fontFace: FONT_BODY, valign: 'middle',
    });
    ly += 0.25;
  });
}

// ─── Hardware List 슬라이드 ────────────────────────────────────
function addHardwareListSlide(
  pptx: PptxGenJS,
  zone: Zone,
  project: Project,
  type: 'local' | 'imfine',
) {
  const slide = pptx.addSlide();
  addContentHeader(slide, 'Hardware List', `${project.name}  ${zone.name}`);

  // 항목 집계
  const rows = Object.values(
    zone.nodes.reduce<Record<string, { name: string; model: string; qty: number; notes: string }>>((acc, n) => {
      if (n.data.responsibility !== type) return acc;
      const k = `${n.data.name}__${n.data.model}`;
      if (!acc[k]) acc[k] = { name: n.data.name, model: n.data.model, qty: 0, notes: n.data.notes ?? '' };
      acc[k].qty += n.data.quantity;
      return acc;
    }, {})
  );

  // 색상 설정 (LOCAL vs IMF)
  const hdrColor  = type === 'local' ? C.LOCAL_HDR : C.IMF_HDR;
  const rowColor  = type === 'local' ? C.LOCAL_ROW : C.IMF_ROW;
  const rrLabel   = type === 'local' ? 'Local' : 'Cheil HQ';

  // ── "Now Brief" 대형 헤더 행 ──
  const tableX = MARGIN_X;
  const tableY = CONTENT_Y;
  const tableW = W - MARGIN_X * 2;

  // 검정 헤더 박스
  slide.addShape('rect', {
    x: tableX, y: tableY, w: tableW, h: 0.5,
    fill: { color: C.BLACK }, line: { color: C.BLACK, width: 0 },
  });
  slide.addText('Now Brief', {
    x: tableX, y: tableY, w: tableW, h: 0.5,
    fontSize: 16, bold: true, color: C.WHITE, align: 'center', valign: 'middle',
    fontFace: FONT_HEAD,
  });

  if (rows.length === 0) {
    slide.addText('No items in this list', {
      x: MARGIN_X, y: tableY + 0.8, w: tableW, h: 0.4,
      fontSize: 11, color: '999999', align: 'center', fontFace: FONT_BODY,
    });
    return;
  }

  // 컬럼 너비 비율 (합계 = tableW)
  const colW = [2.5, 3.8, 0.7, 1.5, tableW - 2.5 - 3.8 - 0.7 - 1.5];

  // ── 컬럼 헤더 행 ──
  const COL_LABELS = ['Hardware', 'Model', 'EA', 'R&R', 'Remark'];
  let cx = tableX;
  const hdrY = tableY + 0.5;
  const hdrH = 0.38;

  COL_LABELS.forEach((label, i) => {
    slide.addShape('rect', {
      x: cx, y: hdrY, w: colW[i], h: hdrH,
      fill: { color: hdrColor }, line: { color: C.TABLE_BDR, width: 0.5 },
    });
    slide.addText(label, {
      x: cx, y: hdrY, w: colW[i], h: hdrH,
      fontSize: 9.5, bold: true, color: C.BLACK, align: 'center', valign: 'middle',
      fontFace: FONT_HEAD,
    });
    cx += colW[i];
  });

  // ── 데이터 행 ──
  const rowH = 0.35;
  const dataStartY = hdrY + hdrH;
  // 슬라이드에 들어갈 최대 행 수
  const maxRows = Math.max(rows.length, Math.floor((H - dataStartY - 0.2) / rowH));
  const totalDataRows = Math.min(maxRows, 20);

  // R&R 셀 — 전체 데이터 영역에 걸쳐 하나의 셀
  const rrX  = tableX + colW[0] + colW[1] + colW[2];
  const rrH  = totalDataRows * rowH;
  slide.addShape('rect', {
    x: rrX, y: dataStartY, w: colW[3], h: rrH,
    fill: { color: rowColor }, line: { color: C.TABLE_BDR, width: 0.5 },
  });
  slide.addText(rrLabel, {
    x: rrX, y: dataStartY, w: colW[3], h: rrH,
    fontSize: 10, color: C.GRAY_BODY, align: 'center', valign: 'middle',
    fontFace: FONT_BODY,
  });

  for (let i = 0; i < totalDataRows; i++) {
    const row = rows[i];
    const ry  = dataStartY + i * rowH;
    const bg  = i % 2 === 0 ? rowColor : C.WHITE;
    let dx = tableX;

    const cells: Array<{ w: number; text: string; bold?: boolean }> = row
      ? [
          { w: colW[0], text: row.name, bold: true },
          { w: colW[1], text: row.model || '—' },
          { w: colW[2], text: String(row.qty) },
        ]
      : [
          { w: colW[0], text: '' },
          { w: colW[1], text: '' },
          { w: colW[2], text: '' },
        ];

    cells.forEach((cell) => {
      slide.addShape('rect', {
        x: dx, y: ry, w: cell.w, h: rowH,
        fill: { color: bg }, line: { color: C.TABLE_BDR, width: 0.5 },
      });
      if (cell.text) {
        slide.addText(cell.text, {
          x: dx + 0.08, y: ry, w: cell.w - 0.1, h: rowH,
          fontSize: 9, bold: cell.bold, color: C.BLACK, valign: 'middle',
          fontFace: cell.bold ? FONT_HEAD : FONT_BODY,
        });
      }
      dx += cell.w;
    });

    // R&R 건너뜀 (이미 그렸음)
    dx = rrX + colW[3];

    // Remark 셀
    slide.addShape('rect', {
      x: dx, y: ry, w: colW[4], h: rowH,
      fill: { color: bg }, line: { color: C.TABLE_BDR, width: 0.5 },
    });
    if (row?.notes) {
      slide.addText(row.notes, {
        x: dx + 0.08, y: ry, w: colW[4] - 0.1, h: rowH,
        fontSize: 9, color: C.GRAY_BODY, valign: 'middle', fontFace: FONT_BODY,
      });
    }
  }
}

// ─── 메인 진입점 ───────────────────────────────────────────────
export async function exportToPPT(project: Project): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout  = 'LAYOUT_WIDE';
  pptx.author  = 'I M FINE';
  pptx.title   = project.name;
  pptx.subject = 'System Configuration';

  addCoverSlide(pptx, project);

  project.zones.forEach((zone) => {
    addZoneCoverSlide(pptx, zone);
    addSystemConfigSlide(pptx, zone, project);
    addCableGuideSlide(pptx, zone, project);
    addElecNetworkSlide(pptx, zone, project);
    addHardwareListSlide(pptx, zone, project, 'local');
    addHardwareListSlide(pptx, zone, project, 'imfine');
  });

  const safeName = project.name
    .replace(/[^a-zA-Z0-9가-힣\s_-]/g, '')
    .replace(/\s+/g, '_');
  await pptx.writeFile({ fileName: `${safeName}_SystemConfig.pptx` });
}
