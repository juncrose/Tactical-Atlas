#!/usr/bin/env node
// 대화형 새 전투 생성 스크립트
// 사용법: npm run new:battle

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = q => new Promise(res => rl.question(q, res));

async function main() {
  console.log('━━━ 새 전투 추가 ━━━\n');
  console.log('각 항목을 입력하세요. (필수)는 비울 수 없습니다.\n');

  const id = await ask('ID (예: kursk_1943) (필수): ');
  if (!/^[a-z][a-z0-9_]*_[0-9]{4}$/.test(id)) {
    console.error('✗ ID 형식 오류. 소문자_이름_연도 (예: kursk_1943)');
    process.exit(1);
  }
  
  const outPath = path.join(__dirname, '..', 'data/battles', `${id}.json`);
  if (fs.existsSync(outPath)) {
    console.error(`✗ ${id}.json이 이미 존재합니다`);
    process.exit(1);
  }

  const name = await ask('한국어 이름 (필수): ');
  const name_en = await ask('영어 이름 (필수): ');
  
  console.log('\n시대: ww1 / interwar / ww2 / korean_war / cold_war / modern');
  let era = await ask('시대 (필수): ');
  const validEras = ['ww1', 'interwar', 'ww2', 'korean_war', 'cold_war', 'modern'];
  while (!validEras.includes(era)) {
    console.log(`⚠ 올바른 시대를 선택해주세요. (${validEras.join(', ')})`);
    era = await ask('시대 (필수): ');
  }
  
  let yearInput = await ask('연도 (필수): ');
  let year = parseInt(yearInput, 10);
  while (isNaN(year) || year < 1886 || year > 2100) {
    console.log('⚠ 올바른 연도를 입력해주세요. (1886 - 2100)');
    yearInput = await ask('연도 (필수): ');
    year = parseInt(yearInput, 10);
  }
  const date_display = await ask('표시용 날짜 (예: 1943년 7월 5일 - 8월 23일): ');
  
  let coordsStr = await ask('좌표 "위도, 경도" (예: 51.73, 36.19): ');
  let coords = coordsStr.split(',').map(s => parseFloat(s.trim()));
  while (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1]) || coords[0] < -90 || coords[0] > 90 || coords[1] < -180 || coords[1] > 180) {
    console.log('⚠ 올바른 형식 및 지리적 범위의 좌표를 입력해주세요. (위도: -90 ~ 90, 경도: -180 ~ 180)');
    coordsStr = await ask('좌표 "위도, 경도" (예: 51.73, 36.19): ');
    coords = coordsStr.split(',').map(s => parseFloat(s.trim()));
  }
  
  const parseInputInt = (val, defaultValue = 0) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 0 ? defaultValue : parsed;
  };

  const validColors = ["blue", "red", "un", "us", "german", "japanese", "soviet", "rok", "kpa", "pva", "british", "french", "russian"];

  console.log('\n--- 진영 1 ---');
  const s1_name = await ask('이름: ');
  const s1_cmdr = await ask('사령관: ');
  const s1_troops = parseInputInt(await ask('병력 수: '), 0);
  const s1_cas = parseInputInt(await ask('사상자 수: '), 0);
  
  let s1_color = await ask('색상 (blue/red/un/us/german/soviet/japanese 등): ');
  while (!validColors.includes(s1_color)) {
    console.log(`⚠ 올바른 색상을 선택해주세요. (${validColors.join(', ')})`);
    s1_color = await ask('색상: ');
  }
  
  const s1_victor = (await ask('승자인가요? (y/n): ')).toLowerCase() === 'y';
  const s1_symbol = await ask('심볼 (infantry/infantry_combined/armor/armor_combined/naval_fleet 등): ');
  
  console.log('\n--- 진영 2 ---');
  const s2_name = await ask('이름: ');
  const s2_cmdr = await ask('사령관: ');
  const s2_troops = parseInputInt(await ask('병력 수: '), 0);
  const s2_cas = parseInputInt(await ask('사상자 수: '), 0);
  
  let s2_color = await ask('색상: ');
  while (!validColors.includes(s2_color)) {
    console.log(`⚠ 올바른 색상을 선택해주세요. (${validColors.join(', ')})`);
    s2_color = await ask('색상: ');
  }
  
  const s2_symbol = await ask('심볼: ');
  
  const significance = await ask('\n전쟁사적 의의 (1-2문장, 50자 이상): ');
  const description = await ask('\n전투 경과 (3-5문장, 80자 이상): ');
  
  const wikidata = await ask('\n위키데이터 ID (예: Q156302, 없으면 엔터): ');
  
  const battle = {
    id, name, name_en, era, year,
    year_decimal: year + 0.5, // 기여자가 나중에 정확한 월로 조정
    date_display, coords,
    sides: [
      {
        name: s1_name, commander: s1_cmdr, troops: s1_troops, casualties: s1_cas,
        color: s1_color, victor: s1_victor, symbol: s1_symbol
      },
      {
        name: s2_name, commander: s2_cmdr, troops: s2_troops, casualties: s2_cas,
        color: s2_color, victor: !s1_victor, symbol: s2_symbol
      }
    ],
    tactics: [
      { ko: 'TODO', en: 'TODO', desc: '⚠ 전술 설명을 채워주세요' }
    ],
    significance,
    description,
    influenced_by: [],
    influences: [],
    has_simulation: false,
    sources: [],
    wikidata_id: wikidata || null,
    wikipedia: { ko: null, en: null },
    contributors: [],
    last_reviewed: null,
    review_status: 'community'
  };
  
  fs.writeFileSync(outPath, JSON.stringify(battle, null, 2) + '\n');
  console.log(`\n✓ 생성됨: ${outPath}`);
  console.log('\n다음 단계:');
  console.log('  1. tactics 배열에 실제 전술 2-4개 채우기');
  console.log('  2. sources 배열에 학술 자료 1개 이상 추가');
  console.log('  3. npm run validate 로 검증');
  console.log('  4. PR 열기');
  
  rl.close();
}

main().catch(e => { console.error(e); process.exit(1); });
