# OPERATION ORDER: Operation Atlas Shield (작전명: 아틀라스 쉴드)

**작전 코드**: OP-ATLAS-SHIELD-2026  
**발행 일시**: 2026-05-25  
**발행 부처**: 최고 의사결정 기구 (Oracle / CO)  
**수신 부처**: 예하 작전 참모(Planner), 정찰대(Scout), 전투병(Worker), 감찰단(Reviewer)  

---

## 1. 상황 분석 (Situation Analysis)

### 가. 현황 및 의의
본 프로젝트(Tactical Atlas)는 전쟁사의 공간적·시간적 변화를 선언적 JSON 데이터 모델을 통해 단일 파일 독립 실행형 HTML 시뮬레이터로 정교하게 렌더링하고 있습니다. 뛰어난 이식성과 실시간 렌더링 성능(60FPS) 및 철저한 스키마 기반 검증 파이프라인(`scripts/validate.js`)을 갖추어 고성능과 높은 기여 개방성을 확보하고 있습니다.

### 나. 현재 직면한 과제 (Gaps & Vulnerabilities)
수행된 정밀 시스템 평가 결과, 데이터 무결성과 런타임 안전성을 위협하는 다음과 같은 핵심 취약점 및 개선 영역이 식별되었습니다.
1. **정적 스키마의 정보 누수 (Schema Coverage Gaps)**: 
   - `battle.schema.json`에 기재되지 않은 `sides[].troop_unit` 속성과, `simulation.schema.json`에 기재되지 않은 `units[].keyframes[].partial` 속성이 실제 데이터(`midway_1942.json` 등)에서 활용되고 있어 기여 시 유효성 보장이 불가능하고 문서화에 공백이 발생했습니다.
2. **진영 정의 및 색상 매핑 불일치 (Enum & Value Definition Gaps)**:
   - 스키마가 허용하는 진영 색상(예: `pva`, `rok`, `soviet`, `british`, `french`) 중 다수가 프론트엔드(`tactical-atlas-bright-v0.3.html`) 내의 하드코딩된 `SIDE_COLORS` 및 `FRIENDLY_SIDES` 맵에 선언되지 않아, 기여 시 정상적인 시각화가 불가능하고 우호 진영(Blue)으로 강제 폴백되는 시각적 결함이 존재합니다.
   - 반대로, 시뮬레이션 데이터에서 정의하여 사용 중인 `"russian"` 진영은 `battle.schema.json`의 허용 enum에 등재되어 있지 않습니다.
3. **검증 메커니즘의 의미론적 공백 (Semantic Validation Gaps)**:
   - `validate.js`가 시뮬레이션 유닛의 `side` 필드가 대응되는 전투 JSON의 진영 정보(`sides[].color`)와 일치하는지 상호 검증하지 않습니다.
   - 타임라인의 국면(`phases`)이 시간적 오름차순으로 정렬되었는지, 각 국면의 시각 $t$가 시뮬레이션 한계 범위(`duration_h`)를 초과하지 않는지 검증하는 구조적 로직이 미흡합니다.
   - `data/index.json`의 기재 사항이 실제 개별 전투 데이터 세트의 메타데이터와 완전히 동기화되어 있는지 검증하는 루틴이 부재하여 정보 오차가 누적될 수 있습니다.
4. **비계 생성 유틸리티의 치명적 설계 결함 (Scaffolding Defects)**:
   - `new-battle.js` CLI 마법사를 통해 데이터를 생성할 때, 비필수 필드(예: 병력 수, 사상자 수 등)를 공백으로 남겨두면 `parseInt('', 10)`에 의해 `NaN`이 반환되고, 이것이 JSON에 `null`로 직렬화되어 정수형 조건(`integer`)을 요구하는 스키마 검사(`npm run validate`)를 즉각 실패하게 만드는 DX 장애 요인이 발견되었습니다.

### 다. 최종 작전 목표 (Strategic Objectives)
본 작전의 궁극적 목표는 식별된 스키마 격차를 해소하고, 데이터 검증 기능을 보강하며, 데이터 비계(Scaffolding) 도구의 결함을 해결하여 프로젝트의 **데이터 무결성 방어선(Shield)**을 강력하게 유지하는 것입니다.

---

## 2. 작전 명 및 일차 표적 (Operation Name & Primary Targets)

### 가. 작전 명
**Operation Atlas Shield (아틀라스 쉴드 작전)**

### 나. 일차 표적 (Target Areas)
작전 완수를 위해 수정 혹은 신규 생성해야 할 표적 영역은 다음과 같습니다.
1. **`schemas/battle.schema.json`** (전투 스키마 보강)
   - `sides[].troop_unit` 속성 정식 편입
   - `coords` 좌표 튜플의 제약 조건 강화 (위도 `[-90, 90]`, 경도 `[-180, 180]` 도메인 유효 제약식 설정)
   - 진영(color) enum 목록에 프론트엔드 실사용 데이터인 `"russian"` 등 누락 값 보완
2. **`schemas/simulation.schema.json`** (시뮬레이션 스키마 보강)
   - `units[].keyframes[].partial` 속성 정식 편입
3. **`scripts/validate.js`** (의미론적 검증 로직 확장)
   - 시뮬레이션 파일 유무와 전투 파일의 `has_simulation` 플래그 간의 정합성 검사 루틴 주입
   - 시뮬레이션 유닛 진영과 개별 전투 정의 진영 간 상호 크로스체킹 구현
   - 페이즈 타임라인의 오름차순 정렬 및 범위 제한(`duration_h` 이하) 검사 구현
   - `index.json`과 데이터베이스 JSON 파일 간의 메타데이터 일치성 자동 검증 추가
4. **`scripts/new-battle.js`** (입력 유틸리티 정상화)
   - 정수형 입력 미입력 시 `NaN` 생성 원천 차단 및 안정적인 예외/기본값 처리 구현
5. **`tactical-atlas-bright-v0.3.html`** (프론트엔드 정렬)
   - 프론트엔드의 `SIDE_COLORS` 및 `FRIENDLY_SIDES` 매핑에 스키마 정의 국가/진영들이 누락 없이 정확한 테마와 아이콘 스타일을 갖도록 정렬 지원

---

## 3. 교전 수칙 (Rules of Engagement - ROE)

예하 부대와 전투병은 작전 수행 도중 다음 수칙을 일점의 오차도 없이 엄격하게 준수해야 합니다.

1. **하위 호환성 유지 (Preserve Backward Compatibility)**:
   - 기존의 14개 전투 데이터(`data/battles/*.json`)와 3개 시뮬레이션 데이터(`data/simulations/*.json`)가 어떤 형태의 오작동도 일으키지 않고 완벽하게 로드되어야 합니다.
2. **외부 의존성 추가 통제 (Zero-Dependency Constraint)**:
   - 빌드와 검증 단계에서 오직 기존의 `ajv` 및 `ajv-formats` 패키지만을 허용하며, 라이브러리 비대화를 방지하기 위해 새로운 서드파티 모듈 도입을 일체 불허합니다.
3. **예외 처리 및 명확한 에러 전파 (Explicit Error Propagation)**:
   - 검증 도중 하나라도 데이터 왜곡이나 부정합이 감지되면, `scripts/validate.js`는 이를 무시하거나 콘솔에 경고만 남겨서는 안 됩니다. 명확한 이탈 지점 설명과 함께 반드시 프로세스 종료 코드 `1`을 반환하여 배포 파이프라인(CI/CD)을 확실히 중단시켜야 합니다.
4. **임의 확장 통제 및 지휘관 의도 일관성 유지 (Drift Avoidance)**:
   - 작전 범위 밖에 존재하는 뷰어의 외관 디자인 변경, 부가 기능 생성 등 지시되지 않은 범위 외 코드 변경(Scope drift)을 제한합니다.
   - 작업 결과물이 설계 규칙을 따르고 있는지 수시로 테스트하여 교전 수칙 내에서 창의성을 규율 있게 발휘하십시오.

---

## 4. 정찰대(Scout)에 내릴 수색/정보 수집 명령 (Scout Directives)

S-2 정보참모(Scout)는 전방 타격을 개시하기 전 다음 대상 지역을 은밀히 수색하여 정확한 정찰 자산을 수집하고 본부로 리포트하십시오.

1. **정찰 태스크 1: 스키마 정적 구조 상세 정찰**
   - `schemas/battle.schema.json`에서 `sides` 구조와 허용 가능한 `color` enum 목록의 현재 스펙을 정밀 캡처하고, `troop_unit`을 삽입할 적절한 노드 경로를 식별하십시오.
   - `schemas/simulation.schema.json`에서 `keyframes`의 아이템 구조를 조사하여 `partial`이 들어갈 정확한 위치와 타입을 확보하십시오.
2. **정찰 태스크 2: 프론트엔드 진영 데이터 하드코딩 영역 탐색**
   - `tactical-atlas-bright-v0.3.html` 파일 내부에서 `SIDE_COLORS`, `FRIENDLY_SIDES`, `sideLabel` 등이 선언된 정확한 라인 영역과 이들이 다루는 진영의 목록을 수집하십시오. 스키마에 정의되어 있으나 뷰어에서 인색하지 못하는 진영(예: `pva`, `rok`, `soviet`, `british`, `french`)이 실제로 어떻게 동작하게 되는지 모의 시뮬레이션을 작성하고, 정렬에 필요한 코드 수정 위치를 명시하십시오.
3. **정찰 태스크 3: 검증기(`validate.js`) 제어 흐름 추적**
   - `scripts/validate.js` 내에서 루프가 진행되는 플로우를 분석하고, "진영 정합성 검사", "페이즈 정렬 검사", "index.json 동기화 여부 단정 검사"를 삽입할 최적의 주입점(Anchor points)을 매핑하십시오.
4. **정찰 태스크 4: Scaffold 코드 내 NaN 버그 지점 정밀 포착**
   - `scripts/new-battle.js`에서 사용자 프롬프트로부터 정수 및 소수형 값을 입력받는 부위와 수식 처리부를 정밀 검사하여, 입력 누락이 어떻게 `NaN`으로 파싱되고 파일 쓰기 시 `null`로 변환되는지 그 원인 라인과 동작 매커니즘을 밝혀내십시오.

S-2 Scout는 신속하게 지상의 전술 상황을 파악하여 첩보를 올리십시오. 이상.
