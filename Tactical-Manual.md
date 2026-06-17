# Tactical Atlas - 작전 교리 가이드 (Field Manual Playbook)

이 문서는 본 프로젝트의 군사 교리(Field Manual) 기반 다중에이전트 지휘 체계를 운영하기 위한 전술 교범입니다. 
상황에 맞는 체인을 선택하여 시스템의 안정성과 무결성을 극대화하십시오.

## 1. 지휘관의 의도 (Commander's Intent)
우리의 목적은 복잡한 소프트웨어 시스템을 제어 불능의 상태(엔트로피 증가)로부터 방어하고, 
모든 변경 사항이 엄격한 교전 수칙(ROE) 하에 안전하게 배포되도록 하는 것입니다.

## 2. 가용 전력 (Assigned Units)
본 작전에는 5개의 특수 목적 에이전트가 투입됩니다.
* **`s2-scout` (S-2 정보참모)**: 현장 정찰, OAKOC 지형 분석, 코드베이스 분석
* **`s3-planner` (S-3 작전참모)**: 5단락 작전명령(OPORD) 작성, 리스크 분석
* **`combat-worker` (전투병)**: 실제 코드 타격(수정), Spot Report 발송
* **`ig-reviewer` (감찰단)**: 교전 수칙 위반 검사, 방어선(테스트) 검열
* **`co-oracle` (최고사령관)**: 사후검토(AAR), 지휘관 의도 이탈(Drift) 감시

## 3. 상황별 전술 체인 (Doctrine Map)

### 🎯 작전명: 구역 정찰 (Zone Reconnaissance)
* **호출어**: `/run-chain field-manual.zone-reconnaissance`
* **투입 조건**: 미확인 영역(레거시)을 정찰하거나 복잡한 버그의 원인을 다각도로 분석해야 할 때.
* **작전 형태**: 3개의 S-2 정찰조가 대상의 Route, Area, Zone을 병행 수색하여 단일 인텔리전스(ISR)로 통합합니다.

### 🧱 작전명: 대반란 안정화 작전 (Clear-Hold-Build)
* **호출어**: `/run-chain field-manual.clear-hold-build`
* **투입 조건**: 악성 레거시 코드를 걷어내고(Clear), 기능을 정상화하며(Hold), 새로운 아키텍처를 세워야(Build) 할 때.
* **작전 형태**: 장기전. 공격적인 리팩토링보다 안정적인 영토 확보에 집중하며, 단계별 엄격한 전환 평가를 거칩니다.

### ⚡ 작전명: 임무형 지휘 (Mission Command)
* **호출어**: `/run-chain field-manual.mission-command`
* **투입 조건**: 목표가 명확하고, 자율적인 수단(How)의 결정이 전투병에게 위임된 작업을 신속히 처리할 때.
* **작전 형태**: 지휘관은 의도(Why)만 전파하고, 전투병이 자율 기동하며, 최종적으로 Oracle이 이탈(Drift) 여부만 감찰합니다.

### 🛡️ 작전명: TLP 8단계 (Troop Leading Procedures)
* **호출어**: `/run-chain field-manual.troop-leading-procedures`
* **투입 조건**: 매우 치명적인 코어 모듈을 수정해야 하여 한 치의 오차도 허용되지 않는 완벽한 기획과 실행이 필요할 때.
* **작전 형태**: 정찰, 외부 자료 조사, 가계획, 실행, 정련에 이르는 교과서적인 8단계 절차를 모두 밟습니다.

### 🔄 작전명: 전투 피해 평가 (BDA Feedback)
* **호출어**: `/run-chain bda-feedback`
* **투입 조건**: 성공적으로 작전이 종료된 후, 전훈(Lessons Learned)을 축적할 때.
* **작전 형태**: 작전 결과를 바탕으로 `.pi/intelligence-db.md`를 업데이트하여 후속 부대에게 정찰 정보를 인계합니다.

## 4. 교전 수칙 및 통신 규약 (SOP)
현장 요원(`combat-worker`)은 작전 중 예기치 않은 모순을 발견하면 절대로 자체 판단(Silent decision)하지 않습니다.
반드시 `contact_supervisor` 도구를 사용하여 `reason: "need_decision"`과 함께 지휘부에 즉시 상황보고(Spot Report)를 전송해야 합니다.
