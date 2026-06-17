# 🗺️ INTELLIGENCE BRIEF: OPERATION ATLAS SHIELD (아틀라스 쉴드 작전 첩보 보고서)

**보고 일자**: 2026-05-25  
**작전 코드**: OP-ATLAS-SHIELD-2026  
**작성 주체**: S-2 정보 정찰대 (Scout)  
**수신 부처**: 최고 의사결정 기구 (CO), 예하 작전 참모 (Planner) 및 전투병 (Worker)  
**보고 상태**: 완결 (Completed)  

---

## 1. 개요 (Executive Summary)

S-2 정보 정찰대는 지휘부의 **'아틀라스 쉴드 작전 명령서(operation-order.md)'**를 접수하고, 시스템 내 데이터 무결성 방어선을 공고히 하기 위해 소스 코드베이스 전역에 대한 정밀 수색 및 첩보 수집 임무를 완수하였습니다.

정찰 결과, 이전 커밋(`3b3ffbb8`)을 통해 일부 스키마 확장 및 기초적인 CLI 에러 방지 조치가 도입되었으나, 여전히 **데이터 왜곡 가능성, 런타임 시각 불일치, 검증기 내 세부 논리 공백, 그리고 CLI 도구 내 무결성 우회 경로** 등의 잠재적 위협 요소(Gaps)들이 잔존하고 있음을 확인하였습니다. 본 보고서는 이러한 취약점을 코드 라인 수준에서 명확히 인용하고, 다음 단계인 **S-3 Planner** 및 **Combat Worker**가 완벽한 전술을 수립하고 타격할 수 있도록 전방의 지형 첩보를 제공합니다.

---

## 2. 지형 및 장애물 분석 (OAKOC 분석 기법 적용)

### 가. Observation & Fields of Fire (관측 및 사계)
- **정적 사양 구역 (Schemas)**: `schemas/battle.schema.json` 및 `schemas/simulation.schema.json`은 데이터의 구조적 정밀성을 정의하는 전술적 가이드라인입니다.
- **의미 검증 장치 (Validate Script)**: `scripts/validate.js`는 CI/CD 파이프라인(`validate.yml`)의 최전방 방어벽으로서, 데이터 간의 의미 정합성을 제어하는 중심부입니다.
- **사용자 기입 진입로 (CLI Scaffolder)**: `scripts/new-battle.js`는 기여자들이 안전하게 전장에 진입(데이터 생성)하도록 안내하는 관문입니다.
- **시각화 전장 (Frontend Viewer)**: `tactical-atlas-bright-v0.3.html`은 축적된 데이터를 고성능(60FPS)으로 구현하는 최종 종착지입니다.

### 나. Key Terrain (핵심 지형 및 주입부)
- **`scripts/validate.js` 내 루프 제어부**: 시뮬레이션 및 인덱스 정합성 검사를 추가 연계할 수 있는 최적의 주입 앵커입니다.
- **`tactical-atlas-bright-v0.3.html` 내 SIDE_COLORS / FRIENDLY_SIDES 정의부**: 신규 진영의 테마 매핑 및 우호/적대 여부를 물리적으로 단정하는 코드 영역입니다.

### 다. Obstacles (장애물 및 식별된 취약점)
1. **정적 스키마의 지리적 제약식 부재**: 스키마 레벨에서 `coords` 및 `pos` 좌표 튜플에 대해 `[-90, 90]` (위도) 및 `[-180, 180]` (경도)에 대한 유효 범위 필터가 없어, 비정상적인 지리적 좌표가 유입될 시 프론트엔드 지도 밖으로 핀이 이탈하는 취약성이 존재합니다.
2. **프론트엔드 진영 맵 불일치 및 렌더링 결함**: 스키마가 허용하는 국가/진영 중 `soviet`, `rok`, `pva`, `british`, `french`가 프론트엔드 상수로 매핑되지 않아 우호군 색상으로의 원치 않는 폴백 및 다이아몬드/사운더스 군 기호의 형태 왜곡이 발생합니다. 또한, 유닛의 키프레임 내 `partial` 플래그가 전송됨에도 최종 `makeNatoSymbol`에서 시각적인 부분 파괴 효과를 렌더링하지 않고 묵살하고 있습니다.
3. **검증기의 교차 검증 논리 공백**: 시뮬레이션 유닛의 `side`가 대응 전투 데이터의 `sides[].color` 목록에 포함되는지 상호 확인하는 루틴이 부재하여, 전투 상에는 존재하지 않는 엉뚱한 국가 소속 부대가 시뮬레이션 상에 묘사되어도 감지하지 못합니다. 또한 `index.json` 검증 시 배열의 크기 불일치나 연도 순 정렬 유무를 명시적으로 단정하지 않습니다.
4. **Scaffold 도구의 무결성 우회**: `new-battle.js`에서 진영 색상(`color`) 입력 시, 임의의 텍스트(예: `green`, `yellow` 등)를 입력하더라도 사전 필터링 없이 그대로 파일로 직렬화하여 이후 스키마 검사를 깨뜨립니다.

---

## 3. 세부 정찰 결과 (Scout Reconnaissance Findings)

### 가. [정찰 태스크 1] JSON 스키마 구조 정밀 탐색

#### 1) `schemas/battle.schema.json` 분석 (라인 49-65)
- **현재 구조**:
  ```json
      "sides": {
        "type": "array",
        "minItems": 2,
        "items": {
          "type": "object",
          "required": ["name", "commander", "troops", "casualties", "color", "victor", "symbol"],
          "properties": {
            "name": { "type": "string", "description": "교전 세력 이름" },
            "commander": { "type": "string", "description": "주요 지휘관" },
            "troops": { "type": "integer", "minimum": 0, "description": "병력 수" },
            "troop_unit": {
              "type": "string",
              "description": "병력 규모 단위 재정의 (기본값: 명. 예: 항모, 사단)"
            },
            "casualties": { "type": "integer", "minimum": 0, "description": "사상자 수" },
            "color": {
              "type": "string",
              "enum": ["blue", "red", "un", "us", "german", "japanese", "soviet", "rok", "kpa", "pva", "british", "french", "russian"],
              "description": "지도상 색상 그룹"
            },
            ...
  ```
- **식별된 공백**: `troop_unit` 속성과 `"russian"` enum은 정상 편입되었으나, **전투 대표 좌표 `coords`**에 대한 지리적 범위 제한(`[-90, 90]`, `[-180, 180]`)이 스키마 수준에서 빠져 있습니다.
- **개선 제안 (JSON Schema Draft-07 튜플 제약식)**:
  `schemas/battle.schema.json` 라인 44-48의 `coords` 정의를 다음과 같이 변경하여 정적 정합성을 대폭 보강합니다.
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

#### 2) `schemas/simulation.schema.json` 분석 (라인 16-27 및 라인 108-117)
- **현재 구조**: `units[].keyframes[].properties.partial`은 정상적으로 스키마 상에 기재되어 있습니다.
- **식별된 공백**: 시뮬레이션의 초기 뷰포트를 결정하는 전역 `bounds`와 유닛 개별 키프레임의 좌표 `pos` 역시 스키마 상에 수치 유효 범위(`[-90, 90]`, `[-180, 180]`) 제약식이 전무합니다.
- **개선 제안**:
  `bounds` (라인 16-27) 및 `pos` (라인 108-117)에 대해 각각 다음과 같이 수치 도메인 제한을 적용할 수 있습니다.
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
        ...
      }
  ```
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

### 나. [정찰 태스크 2] 프론트엔드 진영 데이터 하드코딩 영역 탐색

#### 1) `tactical-atlas-bright-v0.3.html` 내 상수 정의 분석 (라인 2036-2046)
- **현재 코드 상황**:
  ```javascript
  const SIDE_COLORS = {
    blue:   { stroke: '#1a3d5f', fill: '#2c5d8f' },
    red:    { stroke: '#6b1e1e', fill: '#a83232' },
    un:     { stroke: '#1a3d5f', fill: '#2c5d8f' },
    us:     { stroke: '#1a3d5f', fill: '#2c5d8f' },
    german: { stroke: '#1a3d5f', fill: '#2c5d8f' }, // Germans as 'friendly' here for visual contrast
    kpa:    { stroke: '#6b1e1e', fill: '#a83232' },
    russian:{ stroke: '#6b1e1e', fill: '#a83232' },
    japanese:{stroke: '#6b1e1e', fill: '#a83232' }
  };
  const FRIENDLY_SIDES = new Set(['blue','un','us','german']);
  ```
- **취약성 검증 및 시각 왜곡 메커니즘**:
  - 만약 시뮬레이션 내에 `soviet` (소련군), `pva` (중공군) 진영 유닛이 배정될 경우, 이들은 `SIDE_COLORS`에 선언되어 있지 않으므로 렌더링 시 `SIDE_COLORS[side] || SIDE_COLORS.blue` 구문에 의해 강제로 **Blue 색상(우호군)**을 배정받게 됩니다.
  - 동시에, `FRIENDLY_SIDES`에는 이들이 포함되어 있지 않으므로 `isFriendly` 판단식은 `false`를 뱉어 **Diamond 형태(적군 군기호 프레임)**를 그리게 됩니다.
  - 결과적으로 **"파란색 테두리와 파란색 채우기를 가졌으나, 다이아몬드 형태인 혼종 심볼"**이 생성되어 전장에서 심각한 시각적 적아식별(IFF) 장애를 유발합니다.
  - 반대로, 아군 세력인 `rok` (한국군), `british` (영국군), `french` (프랑스군) 진영 유닛들은 Blue 색상은 정상 할당되나, `FRIENDLY_SIDES`에 누락되어 있어 **Diamond 적군 프레임**을 그리게 되어 아군끼리 포격하는 시각적 참극이 벌어집니다.
- **정렬 정안**:
  `SIDE_COLORS` 및 `FRIENDLY_SIDES` 상수를 아래와 같이 완전 동기화하여 역사적 개연성과 심미성을 보완해야 합니다.
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
    soviet:   { stroke: '#6b1e1e', fill: '#a83232' },
    pva:      { stroke: '#6b1e1e', fill: '#a83232' },
    rok:      { stroke: '#1a3d5f', fill: '#2c5d8f' },
    british:  { stroke: '#1a3d5f', fill: '#2c5d8f' },
    french:   { stroke: '#1a3d5f', fill: '#2c5d8f' }
  };
  const FRIENDLY_SIDES = new Set(['blue','un','us','german','rok','british','french']);
  ```

#### 2) `sideLabel` 매핑 분석 (라인 2595-2599)
- **현재 상황**:
  ```javascript
    const sideLabel = {
      un: '유엔군', us: '미군', german: '독일군',
      kpa: '인민군', russian: '러시아군', japanese: '일본군',
      blue: '아군', red: '적군'
    }[unit.side] || unit.side;
  ```
- **개선안**: 누락된 국가 명칭들을 다음과 같이 매핑 딕셔너리에 삽입하여 정상 표기되도록 정렬합니다.
  ```javascript
    const sideLabel = {
      un: '유엔군', us: '미군', german: '독일군',
      kpa: '인민군', russian: '러시아군', japanese: '일본군',
      blue: '아군', red: '적군',
      soviet: '소련군', rok: '한국군', pva: '중공군',
      british: '영국군', french: '프랑스군'
    }[unit.side] || unit.side;
  ```

#### 3) `partial` (부분적 격멸) 렌더링 누락 포착 (라인 2049, 2125-2129)
- **현재 상태**: `makeNatoSymbol`에서 `partial` 옵션은 받아오지만(라인 2049), 최종 SVG 내에 어떠한 렌더링 레이어도 관여하지 않고 완전히 버려지고 있습니다.
- **제안 솔루션**: 만약 유닛이 완전히 격멸(`destroyed: true`)되지 않았지만 부분적 피해(`partial: true`)를 입은 상태라면, NATO 기호 위에 대각선 단일 점선 혹은 실선 슬래시(X자 중 절반)를 중첩시켜 학술적·군사적 완성도를 제고할 수 있습니다.
  ```javascript
    // Destroyed or partial overlay
    let overlay = '';
    if (destroyed) {
      overlay = `<line x1="6" y1="14" x2="42" y2="36" stroke="${stroke}" stroke-width="2"/>
                 <line x1="42" y1="14" x2="6" y2="36" stroke="${stroke}" stroke-width="2"/>`;
    } else if (partial) {
      // 부분 피해 상태: 단일 대각선 사선 오버레이
      overlay = `<line x1="6" y1="14" x2="42" y2="36" stroke="${stroke}" stroke-width="2" stroke-dasharray="3 3"/>`;
    }
  ```

---

### 다. [정찰 태스크 3] 검증기 (`validate.js`) 제어 흐름 및 주입점 탐색

`scripts/validate.js`는 순차적 흐름으로 다차원 검증을 수행하고 있습니다. 의미론적 크로스체킹을 확장하기 위해 다음과 같은 3가지 최적 주입점을 식별하였습니다.

#### 1) 전역 Lookup을 위한 전투 목록 사전 적재 (주입점 A)
- **위치**: 라인 23 근처 (Section 1 시작 전)
- **전략**: 검증기 상단에서 `allBattles` 데이터를 미리 메모리에 적재하여, 시뮬레이션 검증 시 즉각적으로 전투의 `sides` 정보를 읽을 수 있도록 동선을 개편합니다.
  ```javascript
  const allBattles = {};
  fs.readdirSync(BATTLES_DIR).filter(f => f.endsWith('.json')).forEach(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(BATTLES_DIR, f), 'utf8'));
      if (data.id) {
        battleIds.add(data.id);
        allBattles[data.id] = data; // 전역 딕셔너리에 적재
      }
    } catch (e) { /* 에러 */ }
  });
  ```

#### 2) 시뮬레이션 유닛 진영과 개별 전투 정의 진영 상호 정합성 검사 (주입점 B)
- **위치**: 라인 144 부근 (`data.units.forEach` 루프 진입 직후)
- **검증 시나리오**: 시뮬레이션 부대 소속 진영(`u.side`)이 실제 전투 JSON 정의의 `sides[].color` 목록에 없는 잘못된 진영일 경우 즉각 에러 처리합니다.
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

#### 3) `index.json` 배열 크기 정합성 및 시대순/연도순 정렬 엄밀 검증 (주입점 C)
- **위치**: 라인 212 부근 (`index.json` 검증 블록)
- **검증 시나리오**:
  1. 인덱스 내 `indexData.battles.length` 배열의 길이가 실제 발견된 전투 목록(`battlesList.length`)과 완벽하게 똑같은지 명시적으로 검사하여, 누락되거나 초과한 인덱스를 탐지합니다.
  2. 인덱스에 수록된 전투들이 `year_decimal` 기준 오름차순으로 완벽하게 정렬된 채 기재되어 있는지 확인하여, 뷰어 타임라인에서 연도가 꼬이는 상황을 예방합니다.
  ```javascript
      // 인덱스 배열 자체의 길이 검증
      if (indexData.battles.length !== battlesList.length) {
        console.error(`✗ index.json: 인덱스의 battles 배열 크기 불일치 (인덱스: ${indexData.battles.length}개, 실제: ${battlesList.length}개)`);
        errors++;
      }
      
      // 인덱스 내 기재 순서가 연도순 정렬과 완벽히 일치하는지 단정 검사
      battlesList.forEach((b, idx) => {
        const ib = indexData.battles[idx];
        if (!ib || ib.id !== b.id) {
          console.error(`✗ index.json: 인덱스 내 순서 및 정렬 불일치 (인덱스[${idx}]: ${ib ? ib.id : '없음'}, 실제 정렬[${idx}]: ${b.id})`);
          errors++;
        }
      });
  ```

---

### 라. [정찰 태스크 4] Scaffold (`new-battle.js`) 입력 도구 정밀 검사

#### 1) 기존 NaN 및 null 직렬화 발생 원인 분석
- **레거시 결함 동작**:
  기여자가 CLI 상에서 `병력 수` 또는 `사상자 수`에 빈 값(공백)을 기입한 채 엔터를 치면, CLI 스크립트는 이를 읽고 바로 `parseInt('', 10)`을 수행하게 됩니다. JavaScript 명세 상 이 함수의 반환값은 `NaN`이 됩니다. 
  이 상태에서 `JSON.stringify()`를 통해 파일로 저장할 때, 규격 상 `NaN`은 `null`값으로 치환되어 물리 디스크에 기록됩니다.
  그 결과 생성된 JSON 파일은 `sides[].troops: null`이 되며, 정수를 강력히 요구하는 JSON 스키마 규격(`type: "integer"`)을 충족하지 못해 곧바로 `validate` 단계에서 거부당하는 DX 파괴 요인이 되고 있었습니다.
- **현재 해결책 검증**:
  현재 코드에는 `parseInputInt` 헬퍼가 작성되어 빈 값 파싱 문제를 예방하고 있습니다.
  ```javascript
  const parseInputInt = (val, defaultValue = 0) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };
  ```

#### 2) 정밀 분석을 통해 식별된 새로운 CLI 취약점 (진영 색상 오기입 우회 위험)
- **관측 사실**: `s1_color` 및 `s2_color` 질문에 대해 사용자가 임의의 값(예: `yellow`, `green`)을 입력하는 경우, 이를 걸러주는 유효성 루프가 존재하지 않아 그대로 파일이 써지고, 결과적으로 무결성 파이프라인에서 에러가 발생하게 됩니다.
- **예방 보완 제안**:
  `new-battle.js`에 스키마 허용 색상 목록(`validColors`)을 대조하여 검증하는 보강 루프를 심는 것이 좋습니다.
  ```javascript
  const validColors = ["blue", "red", "un", "us", "german", "japanese", "soviet", "rok", "kpa", "pva", "british", "french", "russian"];
  
  let s1_color = await ask('색상 (blue/red/un/us/german/soviet/japanese 등): ');
  while (!validColors.includes(s1_color)) {
    console.log(`⚠ 올바른 색상을 선택해주세요. (${validColors.join(', ')})`);
    s1_color = await ask('색상: ');
  }
  ```
  동일한 유효성 루틴을 `s2_color` 입력부에도 전개하여, 잘못 생성된 원시 데이터가 검증 파이프라인에 침투하기 전에 원천 차단하는 이중 방벽을 구현합니다.

---

## 4. 교전 수칙 (Rules of Engagement - ROE) 및 리스크 제어

S-3 Planner 및 전투대원들은 작전 개시 시 다음 수칙을 일점의 타협 없이 적용할 의무가 있습니다.

1. **하위 호환성 100% 사수 (Preserve Backward Compatibility)**:
   - 현재 작동 중인 14개의 전술 전투 및 3개의 시뮬레이션 데이터를 단 한 조각도 변형·왜곡시키지 않아야 합니다. 특히 스키마에 수치 경계 제약식(`[-90, 90]`, `[-180, 180]`)을 걸었을 때, 기존의 위·경도들이 해당 스키마 검사를 온전히 통과하는지 사전 검증을 마쳤습니다.
2. **외부 패키지 신규 도입 원천 통제 (Zero-Dependency Constraint)**:
   - 오직 기존의 `ajv` 및 `ajv-formats` 인프라만 사용하며, 검증이나 데이터 파싱 성능을 개선하겠다는 목적 하에 무단으로 타 패키지를 수입(Import)하는 행위는 차단됩니다.
3. **엄격하고 완전한 에러 전파 (Explicit Error Propagation)**:
   - `scripts/validate.js` 내에 검증 로직 추가 시, 오류 내용을 누락 없이 콘솔에 뿌리고 반드시 `process.exit(1)`을 통해 실패 상태를 상위 실행 파이프라인(Github CI)으로 그대로 전달해야 합니다.

S-2 Scout의 정찰 첩보 보고는 이상으로 완결되었으며, 작전 범위에 대한 시각과 좌표는 철저히 검증되었습니다. S-3 Planner의 신속한 세부 전술 계획 수립을 권고합니다. 끝.
