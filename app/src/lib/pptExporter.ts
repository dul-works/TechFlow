/**
 * PPT Exporter
 *
 * 모든 shape는 PowerPoint에서 단독 편집 가능한 형태로 출력됩니다.
 * - 하드웨어 블럭: addText + shape: rect  →  텍스트가 사각형 내부에 포함된 단일 객체
 * - 케이블 연결선: addShape(bentConnector3)  →  단일 연결선 객체
 * - 색상 바 (블럭 상단 얇은 띠): 별도 rect (2개 객체로 구성되나 각각 편집 가능)
 * - 하드웨어 리스트: addTable  →  진짜 PowerPoint 표
 * - 폰트: Samsung SS Head KR / Samsung SS Body KR (설치 필요)
 */

import PptxGenJS from 'pptxgenjs';
import type { Project, Zone, HardwareNode } from '../types';

// connector shapes are valid OOXML shape names but not all are in PptxGenJS's TypeScript union
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BENT_CONNECTOR = 'bentConnector3' as any as PptxGenJS.SHAPE_NAME;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STRAIGHT_CONNECTOR = 'straightConnector1' as any as PptxGenJS.SHAPE_NAME;

// ─── 상수 ──────────────────────────────────────────────────────
const W = 13.33;      // 슬라이드 너비 (inch, 16:9)
const H = 7.5;        // 슬라이드 높이 (inch)
const HEADER_H = 1.1; // 헤더 영역 높이
const MARGIN = 0.35;  // 좌우 여백
const TECH_W = 2.9;   // Technical List 너비 (오른쪽)
const NODE_W = 1.55;  // 하드웨어 블럭 너비
const NODE_H = 0.68;  // 하드웨어 블럭 높이
const COLOR_BAR_H = 0.05; // 색상 바 높이

const FONT_HEAD = 'Samsung SS Head KR';
const FONT_BODY = 'Samsung SS Body KR';

// 캔버스 영역 (System Config 슬라이드)
const CVS_X = MARGIN;
const CVS_Y = HEADER_H + 0.05;
const CVS_W = W - MARGIN * 2 - TECH_W - 0.15;
const CVS_H = H - HEADER_H - 0.25;

// ─── 유틸 ──────────────────────────────────────────────────────
function col(hex: string): string {
  return hex.replace('#', '').toUpperCase().padStart(6, '0');
}

/** React Flow 노드 좌표를 PPT 캔버스 좌표로 변환 */
function normalizePositions(
  nodes: HardwareNode[]
): Record<string, { x: number; y: number }> {
  if (nodes.length === 0) return {};

  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const rangeX = Math.max(maxX - minX + 200, 400); // flow px
  const rangeY = Math.max(maxY - minY + 140, 300);

  // 비율 유지하며 캔버스에 맞게 축소
  const scaleX = (CVS_W - NODE_W) / rangeX;
  const scaleY = (CVS_H - NODE_H) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  // 캔버스 중앙 정렬
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

// ─── 공통 헤더 ─────────────────────────────────────────────────
function addHeader(
  slide: PptxGenJS.Slide,
  title: string,
  zoneName: string,
  projectName: string
) {
  slide.background = { color: '0f0f0f' };

  // 최상단 흰색 라인
  slide.addShape('rect', {
    x: 0, y: 0, w: W, h: 0.025,
    fill: { color: 'ffffff' },
    line: { color: 'ffffff', width: 0 },
  });

  // 프로젝트명 (좌측 상단)
  slide.addText(projectName, {
    x: MARGIN, y: 0.08, w: 6, h: 0.25,
    fontSize: 8, color: '666666', fontFace: FONT_HEAD,
  });

  // Zone명 (우측 상단)
  slide.addText(zoneName, {
    x: W - 4.5, y: 0.08, w: 4.2, h: 0.25,
    fontSize: 8, color: '666666', align: 'right', fontFace: FONT_HEAD,
  });

  // 페이지 타이틀 — addText + shape로 단일 편집 가능 객체
  slide.addText(title.toUpperCase(), {
    x: MARGIN, y: 0.42, w: W - MARGIN * 2, h: 0.5,
    fontSize: 18, bold: true, color: 'ffffff',
    fontFace: FONT_HEAD,
  });

  // 구분선
  slide.addShape('line', {
    x: MARGIN, y: HEADER_H - 0.04, w: W - MARGIN * 2, h: 0,
    line: { color: '252525', width: 0.75 },
  });
}

// ─── 표지 슬라이드 ─────────────────────────────────────────────
function addCoverSlide(pptx: PptxGenJS, project: Project) {
  const slide = pptx.addSlide();
  slide.background = { color: '0f0f0f' };

  // 중앙 가로선
  slide.addShape('rect', {
    x: 0, y: H / 2, w: W, h: 0.02,
    fill: { color: 'ffffff' }, line: { color: 'ffffff', width: 0 },
  });

  slide.addText('System Configuration', {
    x: 1, y: H / 2 - 1.0, w: W - 2, h: 0.35,
    fontSize: 10, color: '666666', align: 'center', fontFace: FONT_HEAD,
    charSpacing: 2,
  });

  // 프로젝트명 — 사각형 안에 텍스트 (단일 편집 가능)
  slide.addText(project.name, {
    x: 1, y: H / 2 - 0.65, w: W - 2, h: 0.65,
    fontSize: 32, bold: true, color: 'ffffff', align: 'center',
    fontFace: FONT_HEAD,
  });

  slide.addText(project.date, {
    x: 1, y: H / 2 + 0.25, w: W - 2, h: 0.35,
    fontSize: 10, color: '555555', align: 'center', fontFace: FONT_BODY,
  });

  // Zone 목록
  if (project.zones.length > 0) {
    const zoneText = project.zones.map((z) => z.name).join('  ·  ');
    slide.addText(zoneText, {
      x: 1, y: H / 2 + 0.7, w: W - 2, h: 0.3,
      fontSize: 9, color: '444444', align: 'center', fontFace: FONT_BODY,
    });
  }
}

// ─── Zone 표지 슬라이드 ────────────────────────────────────────
function addZoneCoverSlide(pptx: PptxGenJS, zone: Zone, project: Project) {
  const slide = pptx.addSlide();
  slide.background = { color: '0f0f0f' };

  slide.addShape('rect', {
    x: 0, y: H / 2 - 0.01, w: W, h: 0.02,
    fill: { color: 'ffffff' }, line: { color: 'ffffff', width: 0 },
  });

  slide.addText(project.name, {
    x: MARGIN, y: H / 2 - 0.75, w: W - MARGIN * 2, h: 0.35,
    fontSize: 9, color: '555555', align: 'center', fontFace: FONT_HEAD,
  });

  slide.addText(zone.name, {
    x: MARGIN, y: H / 2 + 0.05, w: W - MARGIN * 2, h: 0.7,
    fontSize: 26, bold: true, color: 'ffffff', align: 'center',
    fontFace: FONT_HEAD,
  });
}

// ─── System Configuration 슬라이드 ────────────────────────────
function addSystemConfigSlide(pptx: PptxGenJS, zone: Zone, project: Project) {
  const slide = pptx.addSlide();
  addHeader(slide, 'System Configuration', zone.name, project.name);

  const nodePos = normalizePositions(zone.nodes);

  // ── 케이블 연결선 (노드보다 먼저 그려서 뒤에 위치) ──
  zone.edges.forEach((edge) => {
    const src = nodePos[edge.source];
    const tgt = nodePos[edge.target];
    if (!src || !tgt) return;

    // 각 노드의 중심점
    const sx = src.x + NODE_W / 2;
    const sy = src.y + NODE_H / 2;
    const tx = tgt.x + NODE_W / 2;
    const ty = tgt.y + NODE_H / 2;

    // 바운딩 박스 계산
    const bx = Math.min(sx, tx);
    const by = Math.min(sy, ty);
    const bw = Math.max(Math.abs(tx - sx), 0.01);
    const bh = Math.max(Math.abs(ty - sy), 0.01);

    const isHorizontal = Math.abs(ty - sy) < 0.05;
    const isVertical = Math.abs(tx - sx) < 0.05;

    // 직선이면 straightConnector1, 꺾이면 bentConnector3 (단일 연결선 객체)
    const shapeType = isHorizontal || isVertical
      ? STRAIGHT_CONNECTOR
      : BENT_CONNECTOR;

    slide.addShape(shapeType, {
      x: bx, y: by, w: bw, h: bh,
      line: {
        color: col(edge.data.color),
        width: 2,
        dashType: (edge.data as { dashed?: boolean }).dashed ? 'dash' : 'solid',
      },
      flipH: tx < sx,
      flipV: ty < sy,
    });

    // 케이블 타입 레이블 — 연결선 중간 텍스트 박스 (단일 편집 가능)
    if (edge.data.type) {
      slide.addText(edge.data.type, {
        x: (sx + tx) / 2 - 0.5, y: (sy + ty) / 2 - 0.1, w: 1.0, h: 0.18,
        fontSize: 6.5, color: col(edge.data.color), align: 'center',
        fontFace: FONT_BODY,
        fill: { color: '0f0f0f', transparency: 30 },
      });
    }
  });

  // ── 하드웨어 블럭 ──
  zone.nodes.forEach((node) => {
    const pos = nodePos[node.id];
    if (!pos) return;
    const c = col(node.data.color);

    // 색상 바 (상단 얇은 띠) — 별도 rect
    slide.addShape('rect', {
      x: pos.x, y: pos.y, w: NODE_W, h: COLOR_BAR_H,
      fill: { color: c },
      line: { color: c, width: 0 },
    });

    // 메인 블럭 — addText + shape 으로 텍스트가 사각형 안에 포함된 단일 편집 객체
    const nameText = node.data.name + (node.data.quantity > 1 ? ` ×${node.data.quantity}` : '');
    slide.addText(
      [
        {
          text: nameText,
          options: { fontSize: 9, bold: true, color: 'ffffff', breakLine: true },
        },
        {
          text: node.data.model || '',
          options: { fontSize: 6.5, color: '888888', bold: false },
        },
      ],
      {
        x: pos.x,
        y: pos.y + COLOR_BAR_H,
        w: NODE_W,
        h: NODE_H - COLOR_BAR_H,
        shape: 'rect' as PptxGenJS.SHAPE_NAME,
        fill: { color: '1a1a1a' },
        line: { color: c, width: 1.5 },
        fontFace: FONT_HEAD,
        valign: 'middle',
        margin: [0.06, 0.08, 0.06, 0.08],
      }
    );
  });

  // ── Technical List (오른쪽 패널) ──
  const listX = W - TECH_W - MARGIN + 0.05;

  // Technical List 제목
  slide.addText('TECHNICAL LIST', {
    x: listX, y: CVS_Y, w: TECH_W - 0.1, h: 0.22,
    fontSize: 7.5, color: '555555', bold: true, fontFace: FONT_HEAD,
    charSpacing: 1,
  });

  // 구분선
  slide.addShape('line', {
    x: listX, y: CVS_Y + 0.25, w: TECH_W - 0.1, h: 0,
    line: { color: '252525', width: 0.5 },
  });

  let ly = CVS_Y + 0.32;

  // 하드웨어 항목
  const hwItems = Object.values(
    zone.nodes.reduce<Record<string, { name: string; color: string; count: number }>>((acc, n) => {
      const k = n.data.name;
      if (!acc[k]) acc[k] = { name: k, color: n.data.color, count: 0 };
      acc[k].count++;
      return acc;
    }, {})
  );

  if (hwItems.length > 0) {
    slide.addText('Hardware', {
      x: listX, y: ly, w: TECH_W - 0.1, h: 0.18,
      fontSize: 6.5, color: '444444', fontFace: FONT_HEAD,
    });
    ly += 0.2;

    hwItems.forEach((hw) => {
      // 색상 사각형 — 단일 편집 가능 rect
      slide.addShape('rect', {
        x: listX, y: ly + 0.01, w: 0.13, h: 0.13,
        fill: { color: col(hw.color) },
        line: { color: col(hw.color), width: 0 },
      });
      // 텍스트
      slide.addText(`${hw.name}${hw.count > 1 ? ` ×${hw.count}` : ''}`, {
        x: listX + 0.18, y: ly, w: TECH_W - 0.3, h: 0.16,
        fontSize: 7.5, color: 'cccccc', fontFace: FONT_BODY,
      });
      ly += 0.22;
    });
  }

  ly += 0.08;

  // 케이블 항목
  const cableItems = Object.values(
    zone.edges.reduce<Record<string, { type: string; color: string; dashed?: boolean }>>((acc, e) => {
      if (!acc[e.data.type]) {
        acc[e.data.type] = {
          type: e.data.type,
          color: e.data.color,
          dashed: (e.data as { dashed?: boolean }).dashed,
        };
      }
      return acc;
    }, {})
  );

  if (cableItems.length > 0) {
    slide.addText('Cables', {
      x: listX, y: ly, w: TECH_W - 0.1, h: 0.18,
      fontSize: 6.5, color: '444444', fontFace: FONT_HEAD,
    });
    ly += 0.2;

    cableItems.forEach((c) => {
      // 케이블 선 — straightConnector1 (단일 편집 가능 연결선)
      slide.addShape(STRAIGHT_CONNECTOR, {
        x: listX, y: ly + 0.08, w: 0.2, h: 0,
        line: {
          color: col(c.color),
          width: 2,
          dashType: c.dashed ? 'dash' : 'solid',
        },
      });
      slide.addText(c.type, {
        x: listX + 0.25, y: ly, w: TECH_W - 0.37, h: 0.16,
        fontSize: 7.5, color: 'cccccc', fontFace: FONT_BODY,
      });
      ly += 0.22;
    });
  }
}

// ─── Hardware List 슬라이드 ────────────────────────────────────
function addHardwareListSlide(
  pptx: PptxGenJS,
  zone: Zone,
  project: Project,
  type: 'local' | 'imfine'
) {
  const slide = pptx.addSlide();
  const title = type === 'local' ? 'Hardware List (LOCAL)' : 'Hardware List (I M FINE)';
  addHeader(slide, title, zone.name, project.name);

  // 항목 집계
  const rows = Object.values(
    zone.nodes.reduce<
      Record<string, { name: string; model: string; qty: number; notes: string }>
    >((acc, n) => {
      if (n.data.responsibility !== type) return acc;
      const k = `${n.data.name}__${n.data.model}`;
      if (!acc[k]) {
        acc[k] = { name: n.data.name, model: n.data.model, qty: 0, notes: n.data.notes ?? '' };
      }
      acc[k].qty += n.data.quantity;
      return acc;
    }, {})
  );

  if (rows.length === 0) {
    slide.addText('No items in this list', {
      x: MARGIN, y: 3.5, w: W - MARGIN * 2, h: 0.4,
      fontSize: 11, color: '444444', align: 'center', fontFace: FONT_BODY,
    });
    return;
  }

  // Now Brief 구분
  slide.addText('Now Brief', {
    x: MARGIN, y: HEADER_H + 0.05, w: 2, h: 0.28,
    fontSize: 8, color: '555555', fontFace: FONT_HEAD,
  });

  // ── addTable로 진짜 PowerPoint 표 생성 ──
  const headerRow: PptxGenJS.TableRow = [
    { text: 'Hardware', options: { bold: true, color: '888888', fill: { color: '141414' }, fontFace: FONT_HEAD } },
    { text: 'Model', options: { bold: true, color: '888888', fill: { color: '141414' }, fontFace: FONT_HEAD } },
    { text: 'EA', options: { bold: true, color: '888888', fill: { color: '141414' }, fontFace: FONT_HEAD } },
    { text: 'R&R', options: { bold: true, color: '888888', fill: { color: '141414' }, fontFace: FONT_HEAD } },
    { text: 'Remark', options: { bold: true, color: '888888', fill: { color: '141414' }, fontFace: FONT_HEAD } },
  ];

  const dataRows: PptxGenJS.TableRow[] = rows.map((row, i) => {
    const bgColor = i % 2 === 0 ? '111111' : '0f0f0f';
    const rrLabel = type === 'imfine' ? 'I M FINE' : 'Local';
    return [
      { text: row.name, options: { bold: true, color: 'ffffff', fill: { color: bgColor }, fontFace: FONT_HEAD } },
      { text: row.model || '—', options: { color: '888888', fill: { color: bgColor }, fontFace: FONT_BODY } },
      { text: String(row.qty), options: { color: 'cccccc', fill: { color: bgColor }, align: 'center', fontFace: FONT_BODY } },
      { text: rrLabel, options: { color: type === 'imfine' ? 'FF6B6B' : '51CF66', fill: { color: bgColor }, fontFace: FONT_BODY } },
      { text: row.notes, options: { color: '666666', fill: { color: bgColor }, fontFace: FONT_BODY } },
    ];
  });

  slide.addTable([headerRow, ...dataRows], {
    x: MARGIN,
    y: HEADER_H + 0.4,
    w: W - MARGIN * 2,
    fontSize: 8.5,
    rowH: 0.36,
    border: { type: 'solid', color: '1e1e1e', pt: 0.5 },
    align: 'left',
    valign: 'middle',
  });
}

// ─── Cable Guide 슬라이드 ──────────────────────────────────────
function addCableGuideSlide(pptx: PptxGenJS, zone: Zone, project: Project) {
  const slide = pptx.addSlide();
  addHeader(slide, 'Cable Guide', zone.name, project.name);

  const canvasX = MARGIN;
  const canvasY = HEADER_H + 0.05;
  const canvasW = W - MARGIN * 2 - TECH_W - 0.15;
  const canvasH = H - HEADER_H - 0.25;

  // 도면 이미지 배경
  if (zone.floorPlan?.imageDataUrl) {
    slide.addImage({
      data: zone.floorPlan.imageDataUrl,
      x: canvasX, y: canvasY, w: canvasW, h: canvasH,
      transparency: Math.round((1 - zone.floorPlan.opacity) * 100),
    });
  }

  // 하드웨어 블럭 (Cable Guide 위치 기준)
  const pos = zone.cableGuideNodePositions;
  zone.nodes.forEach((node) => {
    const p = pos[node.id];
    if (!p) return;
    const nx = canvasX + (p.x / 100) * canvasW;
    const ny = canvasY + (p.y / 100) * canvasH;
    const c = col(node.data.color);

    slide.addShape('rect', {
      x: nx, y: ny, w: NODE_W * 0.85, h: COLOR_BAR_H,
      fill: { color: c }, line: { color: c, width: 0 },
    });

    slide.addText(node.data.name, {
      x: nx, y: ny + COLOR_BAR_H, w: NODE_W * 0.85, h: NODE_H * 0.7 - COLOR_BAR_H,
      shape: 'rect' as PptxGenJS.SHAPE_NAME,
      fill: { color: '0f0f0f', transparency: 20 },
      line: { color: c, width: 1.5 },
      fontSize: 8, bold: true, color: 'ffffff', fontFace: FONT_HEAD,
      valign: 'middle', align: 'center',
    });
  });

  // 케이블 연결선
  zone.edges.forEach((edge) => {
    const sp = pos[edge.source];
    const tp = pos[edge.target];
    if (!sp || !tp) return;
    const sx = canvasX + (sp.x / 100) * canvasW + (NODE_W * 0.85) / 2;
    const sy = canvasY + (sp.y / 100) * canvasH + (NODE_H * 0.7) / 2;
    const tx = canvasX + (tp.x / 100) * canvasW + (NODE_W * 0.85) / 2;
    const ty = canvasY + (tp.y / 100) * canvasH + (NODE_H * 0.7) / 2;

    const bx = Math.min(sx, tx), by = Math.min(sy, ty);
    const bw = Math.max(Math.abs(tx - sx), 0.01);
    const bh = Math.max(Math.abs(ty - sy), 0.01);

    slide.addShape(BENT_CONNECTOR, {
      x: bx, y: by, w: bw, h: bh,
      line: { color: col(edge.data.color), width: 1.5 },
      flipH: tx < sx, flipV: ty < sy,
    });
  });

  // Technical List (오른쪽)
  addTechListPanel(slide, zone, W - TECH_W - MARGIN + 0.05, CVS_Y);
}

// ─── Electricity & Network 슬라이드 ───────────────────────────
function addElecNetworkSlide(pptx: PptxGenJS, zone: Zone, project: Project) {
  const slide = pptx.addSlide();
  addHeader(slide, 'Electricity & Network', zone.name, project.name);

  const canvasX = MARGIN;
  const canvasY = HEADER_H + 0.05;
  const canvasW = W - MARGIN * 2 - TECH_W - 0.15;
  const canvasH = H - HEADER_H - 0.25;

  // 같은 도면 이미지
  if (zone.floorPlan?.imageDataUrl) {
    slide.addImage({
      data: zone.floorPlan.imageDataUrl,
      x: canvasX, y: canvasY, w: canvasW, h: canvasH,
      transparency: Math.round((1 - zone.floorPlan.opacity) * 100),
    });
  }

  const MARKER_STYLE: Record<string, { color: string; label: string; icon: string }> = {
    '220v':       { color: 'FFD43B', label: '220V',         icon: '⚡' },
    'internet':   { color: '74C0FC', label: 'Internet',     icon: '🌐' },
    'powerstrip': { color: 'A9E34B', label: 'Powerstrip',   icon: '🔌' },
    'usb_repeater':{ color: 'FFA94D', label: 'USB Repeater', icon: '🔗' },
  };

  // 마커 배치 — 각 마커는 단일 편집 가능 shape
  zone.floorMarkers.forEach((m) => {
    const style = MARKER_STYLE[m.type] ?? { color: 'ffffff', label: m.type, icon: '' };
    const mx = canvasX + (m.x / 100) * canvasW;
    const my = canvasY + (m.y / 100) * canvasH;

    slide.addText(style.label, {
      x: mx - 0.4, y: my - 0.15, w: 0.8, h: 0.25,
      shape: 'rect' as PptxGenJS.SHAPE_NAME,
      fill: { color: '0f0f0f' },
      line: { color: style.color, width: 1.5 },
      fontSize: 7.5, bold: true, color: style.color,
      align: 'center', valign: 'middle', fontFace: FONT_HEAD,
    });
    // 핀 라인
    slide.addShape('line', {
      x: mx, y: my + 0.1, w: 0, h: 0.12,
      line: { color: style.color, width: 1 },
    });
    // 핀 점
    slide.addShape('ellipse', {
      x: mx - 0.04, y: my + 0.22, w: 0.08, h: 0.08,
      fill: { color: style.color }, line: { color: style.color, width: 0 },
    });
  });

  // Technical List (마커 범례)
  const listX = W - TECH_W - MARGIN + 0.05;
  slide.addText('TECHNICAL LIST', {
    x: listX, y: CVS_Y, w: TECH_W - 0.1, h: 0.22,
    fontSize: 7.5, color: '555555', bold: true, fontFace: FONT_HEAD, charSpacing: 1,
  });
  slide.addShape('line', {
    x: listX, y: CVS_Y + 0.25, w: TECH_W - 0.1, h: 0,
    line: { color: '252525', width: 0.5 },
  });

  let ly = CVS_Y + 0.35;
  Object.entries(MARKER_STYLE).forEach(([type, style]) => {
    const count = zone.floorMarkers.filter((m) => m.type === type).length;
    if (count === 0) return;
    slide.addText(style.label, {
      x: listX + 0.22, y: ly, w: TECH_W - 0.5, h: 0.2,
      fontSize: 8, color: style.color, fontFace: FONT_BODY,
    });
    slide.addText(`×${count}`, {
      x: listX + TECH_W - 0.5, y: ly, w: 0.4, h: 0.2,
      fontSize: 8, color: '555555', align: 'right', fontFace: FONT_BODY,
    });
    ly += 0.26;
  });
}

// ─── Technical List 패널 (Cable Guide/E&N 공용) ───────────────
function addTechListPanel(
  slide: PptxGenJS.Slide,
  zone: Zone,
  listX: number,
  startY: number
) {
  slide.addText('TECHNICAL LIST', {
    x: listX, y: startY, w: TECH_W - 0.1, h: 0.22,
    fontSize: 7.5, color: '555555', bold: true, fontFace: FONT_HEAD, charSpacing: 1,
  });
  slide.addShape('line', {
    x: listX, y: startY + 0.25, w: TECH_W - 0.1, h: 0,
    line: { color: '252525', width: 0.5 },
  });

  let ly = startY + 0.33;

  // Hardware
  const hwItems = Object.values(
    zone.nodes.reduce<Record<string, { name: string; color: string }>>((acc, n) => {
      if (!acc[n.data.name]) acc[n.data.name] = { name: n.data.name, color: n.data.color };
      return acc;
    }, {})
  );
  hwItems.forEach((hw) => {
    slide.addShape('rect', {
      x: listX, y: ly + 0.01, w: 0.13, h: 0.13,
      fill: { color: col(hw.color) }, line: { color: col(hw.color), width: 0 },
    });
    slide.addText(hw.name, {
      x: listX + 0.18, y: ly, w: TECH_W - 0.3, h: 0.16,
      fontSize: 7.5, color: 'cccccc', fontFace: FONT_BODY,
    });
    ly += 0.22;
  });

  ly += 0.06;

  // Cables
  const cableItems = Object.values(
    zone.edges.reduce<Record<string, { type: string; color: string }>>((acc, e) => {
      if (!acc[e.data.type]) acc[e.data.type] = { type: e.data.type, color: e.data.color };
      return acc;
    }, {})
  );
  cableItems.forEach((c) => {
    slide.addShape(STRAIGHT_CONNECTOR, {
      x: listX, y: ly + 0.08, w: 0.2, h: 0,
      line: { color: col(c.color), width: 2 },
    });
    slide.addText(c.type, {
      x: listX + 0.25, y: ly, w: TECH_W - 0.37, h: 0.16,
      fontSize: 7.5, color: 'cccccc', fontFace: FONT_BODY,
    });
    ly += 0.22;
  });
}

// ─── 메인 진입점 ───────────────────────────────────────────────
export async function exportToPPT(project: Project): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'I M FINE';
  pptx.title = project.name;
  pptx.subject = 'System Configuration';

  // 프로젝트 표지
  addCoverSlide(pptx, project);

  // Zone별 슬라이드 세트
  project.zones.forEach((zone) => {
    addZoneCoverSlide(pptx, zone, project);
    addSystemConfigSlide(pptx, zone, project);
    addCableGuideSlide(pptx, zone, project);
    addElecNetworkSlide(pptx, zone, project);
    addHardwareListSlide(pptx, zone, project, 'local');
    addHardwareListSlide(pptx, zone, project, 'imfine');
  });

  const fileName = `${project.name.replace(/[^a-zA-Z0-9가-힣\s_-]/g, '').replace(/\s+/g, '_')}_SystemConfig.pptx`;
  await pptx.writeFile({ fileName });
}
