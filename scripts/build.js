#!/usr/bin/env node
// data/ 의 JSON들을 한 번에 읽어 단일 HTML로 빌드합니다.
// 결과: dist/index.html (오프라인 실행 가능)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'src/template.html');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'index.html');

// === 데이터 수집 ===
const ERAS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/eras.json'), 'utf8'));

const BATTLES = fs.readdirSync(path.join(ROOT, 'data/battles'))
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/battles', f), 'utf8')))
  .sort((a, b) => a.year_decimal - b.year_decimal);

const SIMULATIONS = {};
fs.readdirSync(path.join(ROOT, 'data/simulations'))
  .filter(f => f.endsWith('.json'))
  .forEach(f => {
    const sim = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/simulations', f), 'utf8'));
    // t_label DSL → 런타임 함수로 변환
    SIMULATIONS[sim.battle_id] = sim;
  });

// === 런타임 헬퍼: t_label DSL → 함수 ===
const T_LABEL_RUNTIME = `
function makeTLabel(spec) {
  if (!spec) return h => '';
  switch (spec.format) {
    case 'h_plus':
      return h => {
        const hh = String(Math.floor(h)).padStart(2,'0');
        const mm = String(Math.floor((h % 1) * 60)).padStart(2,'0');
        return 'H+' + hh + ':' + mm;
      };
    case 'wall_clock':
      const [sh, sm] = (spec.start_wall_time || '00:00').split(':').map(Number);
      return h => {
        const hh = String(Math.floor(h)).padStart(2,'0');
        const mm = String(Math.floor((h % 1) * 60)).padStart(2,'0');
        const wh = String((sh + Math.floor(h)) % 24).padStart(2,'0');
        const wm = String((sm + Math.floor((h % 1) * 60)) % 60).padStart(2,'0');
        return 'H+' + hh + ':' + mm + ' (현지 ' + wh + ':' + wm + ')';
      };
    case 'day_hour':
      const off = spec.day_offset || 1;
      return h => {
        const day = Math.floor(h / 24) + off;
        const hr = Math.floor(h % 24);
        const mn = Math.floor((h - Math.floor(h)) * 60);
        return 'Day ' + day + ' ' + String(hr).padStart(2,'0') + ':' + String(mn).padStart(2,'0');
      };
    case 'date_hour':
      const start = new Date(spec.start_date + 'T00:00:00Z');
      return h => {
        const d = new Date(start.getTime() + h * 3600000);
        return d.toISOString().replace('T', ' ').slice(0, 16);
      };
    case 'custom':
      return h => spec.template
        .replace('{h}', Math.floor(h))
        .replace('{m}', Math.floor((h % 1) * 60));
    default:
      return h => 'h=' + h.toFixed(1);
  }
}
// 모든 시뮬레이션의 t_label spec을 함수로 미리 컴파일
Object.keys(SIMULATIONS).forEach(id => {
  const spec = SIMULATIONS[id].t_label;
  SIMULATIONS[id].t_label = makeTLabel(spec);
});
`;

// === 템플릿 로드 (없으면 원본에서 추출) ===
let template;
if (fs.existsSync(TEMPLATE)) {
  template = fs.readFileSync(TEMPLATE, 'utf8');
} else {
  // 원본 HTML에서 데이터 부분을 제거하고 템플릿화
  let originalPath = path.join(ROOT, 'tactical-atlas-bright-v0.3.html');
  if (!fs.existsSync(originalPath)) {
    originalPath = path.join(ROOT, '../tactical-atlas-v2.html');
  }
  const original = fs.readFileSync(originalPath, 'utf8');
  // const ERAS 부터 SIDE_COLORS 직전까지 제거하고 주입 지점만 남김
  const startMark = 'const ERAS = {';
  const endMark = 'const SIDE_COLORS';
  const startIdx = original.indexOf(startMark);
  const endIdx = original.indexOf(endMark);
  if (startIdx < 0 || endIdx < 0) {
    console.error('템플릿 추출 실패. src/template.html을 수동 작성하세요.');
    process.exit(1);
  }
  template = original.slice(0, startIdx) + '/* @@INJECT_DATA@@ */\n' + original.slice(endIdx);
}

// === 데이터 주입 ===
const injection = `
const ERAS = ${JSON.stringify(ERAS, null, 2)};
const BATTLES = ${JSON.stringify(BATTLES, null, 2)};
const SIMULATIONS = ${JSON.stringify(SIMULATIONS, null, 2)};
${T_LABEL_RUNTIME}
`;

const result = template.replace('/* @@INJECT_DATA@@ */', injection);

// === 출력 ===
if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(OUT, result);

const sizeKB = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`✓ 빌드 완료: ${OUT}`);
console.log(`  전투: ${BATTLES.length}, 시뮬레이션: ${Object.keys(SIMULATIONS).length}, 크기: ${sizeKB} KB`);
