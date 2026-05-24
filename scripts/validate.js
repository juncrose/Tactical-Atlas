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

// === 1. 전투 검증 ===
console.log('━━━ 전투 데이터 검증 ━━━');

// 먼저 모든 battle id를 수집 (시뮬 검증 단계에서 참조)
fs.readdirSync(BATTLES_DIR).filter(f => f.endsWith('.json')).forEach(f => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(BATTLES_DIR, f), 'utf8'));
    if (data.id) battleIds.add(data.id);
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
  
  // 참조된 battle_id가 실제 존재하는지
  if (!battleIds.has(data.battle_id)) {
    console.error(`✗ ${f}: battle_id "${data.battle_id}"에 해당하는 전투 파일이 없음`);
    errors++;
    return;
  }
  
  // 키프레임 시간순 정렬 검증
  data.units.forEach(u => {
    for (let i = 1; i < u.keyframes.length; i++) {
      if (u.keyframes[i].t < u.keyframes[i-1].t) {
        console.error(`✗ ${f}: 유닛 ${u.id}의 키프레임이 시간순 정렬 안 됨`);
        errors++;
      }
    }
    
    // 키프레임 t가 duration_h 초과
    const maxT = Math.max(...u.keyframes.map(k => k.t));
    if (maxT > data.duration_h) {
      console.error(`✗ ${f}: 유닛 ${u.id}의 키프레임이 duration_h(${data.duration_h})를 초과 (${maxT})`);
      errors++;
    }
  });
  
  console.log(`  ✓ ${data.battle_id} (${data.units.length} 유닛)`);
});

// === 3. 영향관계 그래프 양방향 검증 ===
console.log('\n━━━ 영향관계 그래프 검증 ━━━');
const allBattles = {};
fs.readdirSync(BATTLES_DIR).filter(f => f.endsWith('.json')).forEach(f => {
  const data = JSON.parse(fs.readFileSync(path.join(BATTLES_DIR, f), 'utf8'));
  allBattles[data.id] = data;
});

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

// === 결과 ===
console.log(`\n━━━ 결과 ━━━`);
console.log(`전투: ${battleIds.size}개, 오류: ${errors}, 경고: ${warnings}`);
if (errors > 0) {
  console.error('\n❌ 검증 실패');
  process.exit(1);
}
console.log('\n✅ 검증 통과');
