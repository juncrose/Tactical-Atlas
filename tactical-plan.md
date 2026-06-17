# 🗺️ TACTICAL PLAN: OPERATION ATLAS SHIELD (아틀라스 쉴드 작전 세부 전술 계획서)

**작전 코드**: OP-ATLAS-SHIELD-2026  
**작성 주체**: S-3 작전참모 (Planner)  
**수신 부처**: 전투 제1제대 (Combat Worker), 최고 의사결정 기구 (CO), 감찰부 (Reviewer)  
**기밀 등급**: 대외비 (Restricted)  
**작전 상태**: 승인 및 실행 대기 (Approved & Ready for Execution)  

---

## 1. 상황 (Situation)

S-2 정보 정찰대(Scout)가 제출한 첩보 보고서(`intelligence-brief.md`)를 분석한 결과, 시스템 무결성을 강화하기 위한 이전의 기초 조치에도 불구하고 다음과 같은 **4대 정밀 전술적 취약점**이 현장에 그대로 노출되어 있음을 식별하였습니다.

### 가. 정적 스키마의 지리적 도메인 제약 부재
`schemas/battle.schema.json` 및 `schemas/simulation.schema.json` 스키마 정의 파일에서 핵심 좌표를 표현하는 `coords`, `bounds`, `pos` 배열 요소들에 대해 물리적/지리적 유효성 제약(`[-90, 90]` 및 `[-180, 180]`)이 누락되어 있습니다. 이로 인해 유효 범위를 벗어나는 임의의 좌표가 입력되어도 스키마 검사가 이를 차단하지 못하고, 프론트엔드 시각화 지도 밖으로 핀이나 유닛이 이탈하는 시각적 장애 요인(UX Distortion)을 유발합니다.

### 나. 프론트엔드 진영 맵 불일치 및 렌더링 누락
- **진영 불일치**: 스키마가 승인하는 역사적 진영인 `soviet`(소련군), `pva`(중공군), `rok`(한국군), `british`(영국군), `french`(프랑스군)가 프론트엔드(`tactical-atlas-bright-v0.3.html`) 내에 하드코딩된 `SIDE_COLORS` 및 `FRIENDLY_SIDES` 상수에 등록되어 있지 않습니다.
- **시각 왜곡**: 적군인 `soviet`/`pva`가 등장 시 강제로 아군(Blue) 색상으로 폴백되나 형상은 Diamond(적군 심볼)를 그려 혼종이 발생하며, 아군인 `rok`/`british`/`french`는 Diamond 적군 프레임을 그리는 심각한 오작동이 나타납니다.
- **렌더링 누락**: 유닛 키프레임에 스키마 상 규정된 `partial` 플래그가 전송되어도, 군 기호 렌더링 엔진(`makeNatoSymbol`)에서 부분 파괴 효과를 렌더링하지 않고 묵살하고 있습니다.

### 다. 의미 검증 스크립트(`validate.js`)의 의미적 검증 공백
- **진영 교차 검증 부재**: 시뮬레이션 내 개별 유닛의 소속 진영(`u.side`)이 실제 해당 전투 정의(`sides[].color`) 내에 존재하는 진영인지 검사하지 않아, 전투에 참여하지 않은 엉뚱한 진영 부대가 시뮬레이션에 묘사되어도 감지하지 못합니다.
- **인덱스 오정렬 방치**: `index.json` 검증 시 단순히 크기 비교만 수행하고 실제 기재된 배열의 세부 길이 일치 여부 및 `year_decimal` 기준 오름차순(Chronological) 정렬 순서의 완벽한 단정(Assertion)이 결여되어 뷰어 타임라인에서 연도가 꼬일 위험이 상존합니다.

### 라. CLI Scaffolder(`new-battle.js`)의 이중 안전 장치 부재
기여자가 CLI를 통해 새 전투를 생성할 때 `s1_color` 및 `s2_color` 질문에 대해 스키마 범위 외의 임의의 문자열(예: `green`, `yellow`)을 입력하더라도, 어떠한 사전 입력 차단 루프도 없이 그대로 파일로 직렬화되어 추후 검증 파이프라인에서 오류를 발생시킵니다.

---

## 2. 임무 (Mission)

본 작전은 시스템 전반의 강력한 데이터 무결성 방어선을 완벽히 수립하기 위해, 식별된 4대 요충지(정적 스키마, 프론트엔드 렌더러, 검증 스크립트, CLI 생성기)를 정밀 조준 타격(수정)하여 데이터 왜곡 가능성을 원천 차단하고 예하 전투병이 안전하고 지속 가능한 데이터 확장을 도모할 수 있도록 한다.

---

## 3. 실행 (Execution) - 전술적 Phasing 로드맵

본 작전은 상호 영향이 없는 4개의 단계별 실행 안으로 분할하여 수행되며, 예하 전투병(Worker)은 본 계획서에 정의된 정밀 라인 번호와 설계 가이드를 바탕으로 소스코드를 영구적으로 타격합니다.

### Phase 1: 정적 스키마 지리적 제약식 설계 및 반영 (Static Defense Lines)

- **타격 대상 1**: `schemas/battle.schema.json` (라인 41-47 부근)
  - **기존 사양**:
    ```json
        "coords": {
          "type": "array",
          "items": { "type": "number" },
          "minItems": 2,
          "maxItems": 2,
          "description": "[위도, 경도]. 전투의 대표 좌표"
        },
    ```
  - **수정 계획**: JSON Schema Draft-07 규격의 튜플 제약식(배열의 items를 객체 배열로 정의)을 적용하여 첫 번째 요소를 위도(`[-90, 90]`), 두 번째 요소를 경도(`[-180, 180]`)로 단정합니다.
  - **설계 의사코드**:
    ```json
        "coords": {
          "type": "array",
          "items": [
            { "type": "number", "minimum": -90, "maximum": 90, "description": "위도" },
            { "type": "number", "minimum": -180, "maximum": 180, "description": "경도" }
          ],
          "minItems": 2,
          "maxItems": 2,
          "description": "[위도, 경도]. 전투의 대표 좌표"
        },
    ```

- **타격 대상 2**: `schemas/simulation.schema.json` (라인 16-27 및 라인 108-117 부근)
  - **수정 계획**: 초기 뷰포트 범위 `bounds`와 각 유닛의 키프레임 내 `pos` 좌표 배열 역시 동일한 튜플 제약식을 주입하여 검증 규격을 강화합니다.
  - **설계 의사코드 (`bounds` 영역)**:
    ```json
        "bounds": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {
            "type": "array",
            "minItems": 2,
            "maxItems": 2,
            "items": [
              { "type": "number", "minimum": -90, "maximum": 90, "description": "위도" },
              { "type": "number", "minimum": -180, "maximum": 180, "description": "경도" }
            ]
          },
          "description": "[[남위, 서경], [북위, 동경]] 지도 초기 뷰포트"
        },
    ```
  - **설계 의사코드 (`pos` 영역)**:
    ```json
                    "pos": {
                      "type": "array",
                      "items": [
                        { "type": "number", "minimum": -90, "maximum": 90, "description": "위도" },
                        { "type": "number", "minimum": -180, "maximum": 180, "description": "경도" }
                      ],
                      "minItems": 2,
                      "maxItems": 2,
                      "description": "[위도, 경도]"
                    },
    ```

---

### Phase 2: 프론트엔드 진영 데이터 동기화 및 렌더링 엔진 정비 (Visual Presentation Shield)

- **타격 대상**: `tactical-atlas-bright-v0.3.html`
  - **작업 내용 A (라인 2036-2046 부근)**: `SIDE_COLORS`에 신규 진영(`soviet`, `pva`, `rok`, `british`, `french`)의 색상 테마 값을 주입하고, `FRIENDLY_SIDES`에 아군 진영(`rok`, `british`, `french`)을 정확하게 삽입하여 적아식별(IFF) 장애를 제거합니다.
  - **설계 의사코드**:
    ```javascript
    const SIDE_COLORS = {
      blue:     { stroke: '#1a3d5f', fill: '#2c5d8f' },
      red:      { stroke: '#6b1e1e', fill: '#a83232' },
      un:       { stroke: '#1a3d5f', fill: '#2c5d8f' },
      us:       { stroke: '#1a3d5f', fill: '#2c5d8f' },
      german:   { stroke: '#1a3d5f', fill: '#2c5d8f' },
      kpa:      { stroke: '#6b1e1e', fill: '#a83232' },
      russian:  { stroke: '#6b1e1e', fill: '#a83232' },
      japanese: { stroke: '#6b1e1e', fill: '#a83232' },
      soviet:   { stroke: '#6b1e1e', fill: '#a83232' }, // Red-affiliated
      pva:      { stroke: '#6b1e1e', fill: '#a83232' }, // Red-affiliated
      rok:      { stroke: '#1a3d5f', fill: '#2c5d8f' }, // Blue-affiliated
      british:  { stroke: '#1a3d5f', fill: '#2c5d8f' }, // Blue-affiliated
      french:   { stroke: '#1a3d5f', fill: '#2c5d8f' }  // Blue-affiliated
    };
    const FRIENDLY_SIDES = new Set(['blue','un','us','german','rok','british','french']);
    ```
  - **작업 내용 B (라인 2125-2129 부근)**: `makeNatoSymbol` 함수의 SVG 렌더링 레이어 내에 `partial`이 참(true)인 경우를 식별하여 대각선 단일 점선 사선(X자 중 절반) 오버레이를 생성하도록 보강합니다.
  - **설계 의사코드**:
    ```javascript
      // Destroyed or partial overlay (X or dashed diagonal line)
      let overlay = '';
      if (destroyed) {
        overlay = `<line x1="6" y1="14" x2="42" y2="36" stroke="${stroke}" stroke-width="2"/>
                   <line x1="42" y1="14" x2="6" y2="36" stroke="${stroke}" stroke-width="2"/>`;
      } else if (partial) {
        // 부분 격멸 상태: 사선 대각 단일 점선 오버레이
        overlay = `<line x1="6" y1="14" x2="42" y2="36" stroke="${stroke}" stroke-width="2" stroke-dasharray="3 3"/>`;
      }
    ```
  - **작업 내용 C (라인 2595-2599 부근)**: `sideLabel` 매핑에 누락된 역사 국가/진영 명칭을 삽입하여 상세 정보창에 한글이 정상 표시되도록 정비합니다.
  - **설계 의사코드**:
    ```javascript
      const sideLabel = {
        un: '유엔군', us: '미군', german: '독일군',
        kpa: '인민군', russian: '러시아군', japanese: '일본군',
        blue: '아군', red: '적군',
        soviet: '소련군', rok: '한국군', pva: '중공군',
        british: '영국군', french: '프랑스군'
      }[unit.side] || unit.side;
    ```

---

### Phase 3: 의미 검증 스크립트(Cross-validator) 교차 검증 주입 (Deep Verification Trench)

- **타격 대상**: `scripts/validate.js`
  - **작업 내용 A (라인 23 부근)**: 검증기 시작 시점에서 모든 전투 파일을 한 차례만 메모리에 읽어들이는 전역 Lookup `allBattles` 사전을 완벽히 보강 및 선언하고, 뒤이은 Section 3(영향관계 검증)에서 파일을 중복하여 읽지 않도록 코드 중복을 정리합니다.
  - **설계 의사코드**:
    ```javascript
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
    ```
    *(기존의 `Section 3` 영향관계 그래프 검증 부분에서는 파일 읽기 부분을 주석 처리 혹은 제거하고 전역 `allBattles`를 그대로 사용합니다)*

  - **작업 내용 B (라인 144 부근 - 시뮬레이션 개별 유닛 루프 내부)**: 시뮬레이션 유닛의 `side`가 해당 전투 파일의 `sides` 목록에 기재된 진영 색상(`color`) 범주에 일치하는지 교차 검증하는 로직을 주입합니다.
  - **설계 의사코드**:
    ```javascript
        // 시뮬레이션 유닛 side가 실제 전투 진영 목록과 매칭되는지 크로스체킹
        const refBattle = allBattles[data.battle_id];
        if (refBattle) {
          const allowedSideColors = refBattle.sides.map(s => s.color);
          if (!allowedSideColors.includes(u.side)) {
            console.error(`✗ ${f}: 유닛 ${u.id}의 진영(side) "${u.side}"가 대응 전투(${refBattle.id})의 진영 색상 목록 [${allowedSideColors.join(', ')}]에 존재하지 않음`);
            errors++;
          }
        }
    ```

  - **작업 내용 C (라인 212 부근 - index.json 검증 블록 내부)**: `index.json` 배열 크기 및 실제 전투 리스트와의 1:1 인덱스 배열 길이 일치성 검사를 명시적으로 단정하고, `year_decimal` 기준 오름차순으로 순서 정렬이 정확히 들어맞는지 철저히 대조합니다.
  - **설계 의사코드**:
    ```javascript
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
    ```

---

### Phase 4: CLI Scaffolder 입력 진입로 이중 잠금 (CLI Entry Guard)

- **타격 대상**: `scripts/new-battle.js`
  - **작업 내용**: `s1_color` 및 `s2_color`를 기입받는 영역에 스키마 허용 색상 목록(`validColors`)을 대조하여 규격을 우회하지 못하도록 안전 유효성 루프를 추가합니다.
  - **설계 의사코드**:
    ```javascript
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
    ```

---

## 4. 지원 (Sustainment / Support) - 리스크 및 교전 수칙(ROE)

### 가. 가정을 배제한 식별된 전술적 리스크 및 예방 대책
1. **정적 스키마 범위 변경으로 인한 기존 데이터 검증 실패 위험**:
   - *리스크*: `coords`, `bounds`, `pos`에 `[-90, 90]` 및 `[-180, 180]` 수치 범위를 추가했을 때, 기존의 14개 전투 데이터와 3개 시뮬레이션 데이터 중 비정상 좌표가 있어 빌드가 깨질 수 있습니다.
   - *예방책*: 본 작전 수립 전 기존 모든 데이터 파일들의 위도 및 경도 데이터를 수집하여 사전 분석한 결과, 모든 기존 위도는 `[-90, 90]` 범위 내에 있으며, 모든 기존 경도는 `[-180, 180]` 범위 내에 확실히 상주함을 대조 확인하였습니다. 따라서 하위 호환성은 100% 보장됩니다.
2. **`index.json` 배열 순서 불일치 위험**:
   - *리스크*: 만약 이미 수록된 인덱스 파일(`data/index.json`) 내 전투 목록의 나열 순서가 `year_decimal` 기준 정밀 오름차순이 아닐 경우, 새로 추가한 검증기assert 단계에서 에러를 뿜으며 파이프라인이 즉각 중단될 수 있습니다.
   - *예방책*: `scripts/validate.js` 실행 전 `data/index.json` 파일의 `battles` 리스트 정렬 상태를 수동으로 분석해 본 결과, 이미 `year_decimal` 기준으로 완전히 정밀 오름차순 정렬되어 있으므로 충돌이 발생하지 않음을 검증하였습니다.

### 나. 교전 수칙 (Rules of Engagement)
- **외부 패키지 신규 수입 절대 금지**: 데이터 분석 편의 등을 유치하고자 무단으로 새로운 NPM 라이브러리(`lodash` 등)를 수입하여 번들 크기를 키우거나 빌드 파이프라인 복잡도를 늘려서는 안 됩니다. 오직 기존의 `ajv`와 `ajv-formats` 만을 사용하여 스키마 제약을 전개하십시오.
- **안전한 무장 해제 및 에러 전파**: `scripts/validate.js`에 검증 단계를 추가할 때, 탐지한 에러의 원인과 파일 위치를 직관적으로 콘솔에 출력하고, 단 하나라도 검증 오류가 발견되면 반드시 `process.exit(1)`을 던져 GitHub Actions CI가 정상적으로 실패하도록 구성해야 합니다.

---

## 5. 지휘 및 통신 (Command & Signal)

### 가. 검증 수칙 (Validation Contract)
작전 타격을 이행한 Combat Worker는 아래의 자가 정밀 테스트 명령어 및 수동 케이스를 통해 작전 성공 여부를 최종 판정해야 합니다.

1. **자동화 검증 파이프라인 테스트**:
   - **명령어**: `npm run validate`
   - **판정 기준**: 콘솔 출력에 오류가 `0`으로 기록되고 최종적으로 `✅ 검증 통과`를 뿜으며 정상 종료(`exit code 0`)되어야 합니다.
2. **배포 빌드 컴파일 테스트**:
   - **명령어**: `npm run build`
   - **판정 기준**: `/home/g2nuyasa/Tactical-Atlas/dist/index.html` 컴파일이 정상적으로 완료되고, 파일이 성공적으로 교체되어야 합니다.
3. **CLI Scaffolder 시뮬레이터 테스트**:
   - **실행법**: `npm run new:battle`를 실행하고 진영 색상 질문에 `yellow` 또는 `green`을 고의로 입력해 봅니다.
   - **판정 기준**: 오류 문구 `⚠ 올바른 색상을 선택해주세요.`를 출력하며 입력 루프를 탈출하지 못하고 재입력을 요구하는지 확인한 후, 정상적인 `blue`와 `red`를 입력하여 임시 데이터가 스키마 통과 가능한 상태로 생성되는지 확인합니다. (임시 생성 파일은 확인 후 안전하게 디스크에서 삭제 조치합니다.)
4. **시각화 렌더링 검사**:
   - 프론트엔드 HTML 파일 `tactical-atlas-bright-v0.3.html` 내의 CSS/JS 변경 사항이 빌드를 통해 정상적으로 `dist/index.html`에 반영되었는지, 브라우저 환경에서 `soviet` 등의 신규 진영이 정상적인 빨간색/적군 프레임으로 올바르게 적아식별(IFF)되어 60FPS로 표출되는지 시뮬레이터 화면을 검증합니다.

### 나. 보고 계통 및 작전 완료 신호
- Combat Worker는 작전 수정을 마친 후, 본 `tactical-plan.md`를 기점으로 작업 성공 여부를 `progress.md`에 반영하십시오.
- `progress.md` 상의 **3단계(Planning) 과업 완수 및 체크리스트 체크**, **4단계(Execution)의 예하 과업들(스키마 보강, 진영 매핑 동기화, 검증기 고도화 등)**에 대해 진행 상태를 신속하게 기재 및 Spot Report를 띄우십시오.

---
[전술 계획서 작성 완료 - 2026-05-25 S-3 작전참모 Planner]
