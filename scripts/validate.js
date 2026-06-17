#!/usr/bin/env node
// 모든 battles/*.json과 simulations/*.json을 스키마로 검증합니다.
// GitHub Actions에서 PR마다 실행되어 잘못된 데이터를 자동 거부합니다.

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ROOT = path.resolve(__dirname, '..');
const BATTLES_DIR = path.join(ROOT, 'data/battles');
const SIMS_DIR = path.join(ROOT, 'data/simulations');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const battleSchema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas/battle.schema.json'), 'utf8'));
const simSchema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas/simulation.schema.json'), 'utf8'));

const validateBattle = ajv.compile(battleSchema);
const validateSim = ajv.compile(simSchema);

let errors = 0;
let warnings = 0;
const battleIds = new Set();
const allBattles = {}; // 전역 사전 로드 대상

// === 1. 전투 검증 ===
console.log('━━━ 전투 데이터 검증 ━━━');

// 먼저 모든 battle id 및 데이터를 수집 (시뮬 검증 및 그래프 검증 단계에서 활용)
fs.readdirSync(BATTLES_DIR).filter(f => f.endsWith('.json')).forEach(f => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(BATTLES_DIR, f), 'utf8'));
    if (data.id) {
      battleIds.add(data.id);
      allBattles[data.id] = data; // 전역 딕셔너리에 데이터 사전 적재
    }
  } catch (e) { /* 별도 보고됨 */ }
});

fs.readdirSync(BATTLES_DIR).filter(f => f.endsWith('.json')).forEach(f => {
  const filePath = path.join(BATTLES_DIR, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // 스키마 검증
  if (!validateBattle(data)) {
    console.error(`✗ ${f}`);
    validateBattle.errors.forEach(e => console.error(`    ${e.instancePath} ${e.message}`));
    errors++;
    return;
  }
  
  // 좌표 범위 검증 [-90, 90] 및 [-180, 180]
  if (data.coords[0] < -90 || data.coords[0] > 90 || data.coords[1] < -180 || data.coords[1] > 180) {
    console.error(`✗ ${f}: 전투 대표 좌표가 유효한 지리적 범위를 벗어남 [${data.coords[0]}, ${data.coords[1]}]`);
    errors++;
  }
  
  // 시뮬레이션 파일 존재성 상호 크로스체크
  const simPath = path.join(SIMS_DIR, `${data.id}.json`);
  const hasSimFile = fs.existsSync(simPath);
  if (data.has_simulation && !hasSimFile) {
    console.error(`✗ ${f}: has_simulation이 true이지만 실제 시뮬레이션 파일(${data.id}.json)이 존재하지 않음`);
    errors++;
  } else if (!data.has_simulation && hasSimFile) {
    console.warn(`⚠ ${f}: 시뮬레이션 파일이 존재하지만 has_simulation이 false로 되어 있음`);
    warnings++;
  }
  
  // 파일명-id 일치
  const expectedFile = `${data.id}.json`;
  if (f !== expectedFile) {
    console.error(`✗ ${f}: 파일명이 id와 다름 (예상: ${expectedFile})`);
    errors++;
    return;
  }
  
  // 경고: 출처 없음
  if (!data.sources || data.sources.length === 0) {
    console.warn(`⚠ ${data.id}: 출처(sources)가 비어있음 — review_status를 'reviewed' 이상으로 올리려면 필수`);
    warnings++;
  }
  
  // 경고: 위키데이터 없음
  if (!data.wikidata_id) {
    console.warn(`⚠ ${data.id}: wikidata_id 없음`);
    warnings++;
  }
  
  // 승자 정확히 한 진영
  const victors = data.sides.filter(s => s.victor).length;
  if (victors !== 1) {
    console.error(`✗ ${data.id}: 승자가 정확히 1개여야 함 (현재 ${victors}개)`);
    errors++;
  }
  
  console.log(`  ✓ ${data.id}`);
});

// === 2. 시뮬레이션 검증 ===
console.log('\n━━━ 시뮬레이션 검증 ━━━');
fs.readdirSync(SIMS_DIR).filter(f => f.endsWith('.json')).forEach(f => {
  const filePath = path.join(SIMS_DIR, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!validateSim(data)) {
    console.error(`✗ ${f}`);
    validateSim.errors.forEach(e => console.error(`    ${e.instancePath} ${e.message}`));
    errors++;
    return;
  }
  
  // 뷰포트 Bounds 좌표 범위 검증
  if (data.bounds) {
    data.bounds.forEach((b, idx) => {
      if (b[0] < -90 || b[0] > 90 || b[1] < -180 || b[1] > 180) {
        console.error(`✗ ${f}: bounds[${idx}]가 유효한 지리적 범위를 벗어남 [${b[0]}, ${b[1]}]`);
        errors++;
      }
    });
  }
  
  // 국면(phases) 타임라인 순서 및 범위 검증
  if (data.phases) {
    for (let i = 0; i < data.phases.length; i++) {
      const p = data.phases[i];
      if (p.t < 0 || p.t > data.duration_h) {
        console.error(`✗ ${f}: 국면 "${p.label}"의 시점(t=${p.t})이 범위를 벗어남 (0 ~ duration_h)`);
        errors++;
      }
      if (i > 0 && p.t < data.phases[i-1].t) {
        console.error(`✗ ${f}: 국면들의 시점(t)이 시간순으로 정렬되지 않음 ("${data.phases[i-1].label}" t=${data.phases[i-1].t} > "${p.label}" t=${p.t})`);
        errors++;
      }
    }
  }
  
  // 참조된 battle_id가 실제 존재하는지
  if (!battleIds.has(data.battle_id)) {
    console.error(`✗ ${f}: battle_id "${data.battle_id}"에 해당하는 전투 파일이 없음`);
    errors++;
    return;
  }
  
  // 키프레임 시간순 정렬 검증
  const validSides = new Set(["blue", "red", "un", "us", "german", "japanese", "soviet", "rok", "kpa", "pva", "british", "french", "russian"]);
  
  data.units.forEach(u => {
    // 유닛의 side 검증
    if (!validSides.has(u.side)) {
      console.error(`✗ ${f}: 유닛 ${u.id}의 진영(side) "${u.side}"가 유효하지 않음`);
      errors++;
    }

    // 시뮬레이션 유닛 side가 실제 전투 진영 목록과 매칭되는지 크로스체킹
    const refBattle = allBattles[data.battle_id];
    if (refBattle) {
      const allowedSideColors = refBattle.sides.map(s => s.color);
      if (!allowedSideColors.includes(u.side)) {
        console.error(`✗ ${f}: 유닛 ${u.id}의 진영(side) "${u.side}"가 대응 전투(${refBattle.id})의 진영 색상 목록 [${allowedSideColors.join(', ')}]에 존재하지 않음`);
        errors++;
      }
    }
    
    for (let i = 1; i < u.keyframes.length; i++) {
      if (u.keyframes[i].t < u.keyframes[i-1].t) {
        console.error(`✗ ${f}: 유닛 ${u.id}의 키프레임이 시간순 정렬 안 됨`);
        errors++;
      }
    }
    
    // 키프레임 t가 duration_h 초과 및 좌표 지리적 범위 검증
    u.keyframes.forEach((k, kIdx) => {
      if (k.t > data.duration_h) {
        console.error(`✗ ${f}: 유닛 ${u.id}의 키프레임[${kIdx}] t(${k.t})가 duration_h(${data.duration_h})를 초과`);
        errors++;
      }
      if (k.pos[0] < -90 || k.pos[0] > 90 || k.pos[1] < -180 || k.pos[1] > 180) {
        console.error(`✗ ${f}: 유닛 ${u.id}의 키프레임[${kIdx}] (t=${k.t}) 좌표가 유효한 지리적 범위를 벗어남 [${k.pos[0]}, ${k.pos[1]}]`);
        errors++;
      }
    });
  });
  
  console.log(`  ✓ ${data.battle_id} (${data.units.length} 유닛)`);
});

// === 3. 영향관계 그래프 양방향 검증 ===
console.log('\n━━━ 영향관계 그래프 검증 ━━━');

Object.values(allBattles).forEach(b => {
  (b.influences || []).forEach(targetId => {
    if (!allBattles[targetId]) {
      console.error(`✗ ${b.id}: influences에 존재하지 않는 ID "${targetId}"`);
      errors++;
      return;
    }
    // 양방향 일치 — target의 influenced_by에 b.id가 있어야 함
    if (!(allBattles[targetId].influenced_by || []).includes(b.id)) {
      console.warn(`⚠ ${b.id} → ${targetId} 영향관계가 한쪽만 기록됨`);
      warnings++;
    }
  });
});
console.log('  완료');

// === 4. index.json 동기화 검증 ===
console.log('\n━━━ index.json 동기화 검증 ━━━');
const indexPath = path.join(ROOT, 'data/index.json');
if (!fs.existsSync(indexPath)) {
  console.error('✗ data/index.json 파일이 존재하지 않음');
  errors++;
} else {
  try {
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const battlesList = Object.values(allBattles).sort((a, b) => a.year_decimal - b.year_decimal || a.id.localeCompare(b.id));
    
    if (indexData.total_battles !== battlesList.length) {
      console.error(`✗ index.json: 전투 개수 불일치 (인덱스: ${indexData.total_battles}개, 실제: ${battlesList.length}개)`);
      errors++;
    }
    
    const actualSimCount = fs.readdirSync(SIMS_DIR).filter(f => f.endsWith('.json')).length;
    if (indexData.total_simulations !== actualSimCount) {
      console.error(`✗ index.json: 시뮬레이션 개수 불일치 (인덱스: ${indexData.total_simulations}개, 실제: ${actualSimCount}개)`);
      errors++;
    }
    
    // 인덱스 배열 자체의 길이 정밀 검증
    if (indexData.battles.length !== battlesList.length) {
      console.error(`✗ index.json: 인덱스의 battles 배열 크기 불일치 (인덱스: ${indexData.battles.length}개, 실제: ${battlesList.length}개)`);
      errors++;
    }
    
    // 인덱스 내 기재 순서가 연도순 정렬과 완벽히 일치하는지 단정 검사
    battlesList.forEach((b, idx) => {
      const ib = indexData.battles[idx];
      if (!ib) {
        console.error(`✗ index.json: 인덱스에 실제 정렬 순서의 [${idx}] 요소가 유실됨 (예상: ${b.id})`);
        errors++;
      } else if (ib.id !== b.id) {
        console.error(`✗ index.json: 인덱스 내 순서 및 정렬 불일치 (인덱스[${idx}]: ${ib.id}, 실제 정렬[${idx}]: ${b.id})`);
        errors++;
      }
    });
    
    // 개별 전투 정보 일치 여부 비교
    battlesList.forEach((b) => {
      const ib = indexData.battles.find(item => item.id === b.id);
      if (!ib) {
        console.error(`✗ index.json: 실제 전투 "${b.id}"가 인덱스에 존재하지 않음`);
        errors++;
        return;
      }
      
      const fieldsToCheck = ['name', 'name_en', 'era', 'year', 'year_decimal', 'date_display', 'has_simulation'];
      fieldsToCheck.forEach(field => {
        if (JSON.stringify(ib[field]) !== JSON.stringify(b[field])) {
          console.error(`✗ index.json: "${b.id}"의 ${field} 필드 값이 불일치함 (인덱스: ${JSON.stringify(ib[field])}, 실제: ${JSON.stringify(b[field])})`);
          errors++;
        }
      });
      
      if (JSON.stringify(ib.coords) !== JSON.stringify(b.coords)) {
        console.error(`✗ index.json: "${b.id}"의 coords 좌표가 불일치함 (인덱스: ${JSON.stringify(ib.coords)}, 실제: ${JSON.stringify(b.coords)})`);
        errors++;
      }
    });
    
    console.log('  완료');
  } catch (e) {
    console.error(`✗ index.json 파싱 또는 검증 중 오류: ${e.message}`);
    errors++;
  }
}

// === 결과 ===
console.log(`\n━━━ 결과 ━━━`);
console.log(`전투: ${battleIds.size}개, 오류: ${errors}, 경고: ${warnings}`);
if (errors > 0) {
  console.error('\n❌ 검증 실패');
  process.exit(1);
}
console.log('\n✅ 검증 통과');
