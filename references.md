# 참고자료 정리 (References)

본 디렉토리의 `.chain.md` 파일들이 어떤 미 육군 야전교범(Field Manual)을
참고했고, 각 교범의 어떤 전술 개념이 `pi-subagents` 에이전트 체인의 어느 단계에
매핑되었는지를 정리한 문서.

출처 위키 페이지: https://en.wikipedia.org/wiki/United_States_Army_Field_Manuals
대상 저장소: https://github.com/nicobailon/pi-subagents

---

## 1. 군 지휘체계 ↔ pi-subagents 에이전트 매핑

| 군 직책 / 부대 | 핵심 기능 | 매핑된 에이전트 | 주 근거 FM |
|---|---|---|---|
| S-2 (정보참모) / Scout Platoon | 정찰·정보수집·지형평가 | `scout` | FM 3-90, FM 7-92, ATP 3-21.8 |
| S-3 (작전참모) | 작전계획·OPORD 작성 | `planner` | FM 3-0, FM 3-21.8, FM 5-0 |
| G-2 분석관 / S-2 | 외부 정보·교리·선례 조사 | `researcher` | FM 2-22.3, FM 34-52 |
| 부지휘관(XO) / 참모통합 | 컨텍스트 통합·WARNO | `context-builder` | FM 5-0, FM 3-24.2 |
| 야전부대(Maneuver Element) | 임무 실행·기동 | `worker` | FM 3-21.8, FM 6-0 |
| 감독관(IG) / 선임 NCO | AAR·검증·표준 | `reviewer` | FM 6-22, FM 7-0 |
| 지휘관(CDR) | 의도 일관성·결정권 | `oracle` | FM 6-0, ADP 6-0 |
| 파견대(Detachment) / Fire Team | 단발 위임 임무 | `delegate` | FM 3-21.8 (Fire Team) |

---

## 2. 체인 파일별 참고 교범

### 2.1 `troop-leading-procedures.chain.md`
**소대장의 표준 8단계 의사결정 사이클 (TLP)에 기반한 메인 체인.**

| TLP 단계 | 에이전트 | 근거 FM | 핵심 개념 |
|---|---|---|---|
| 1. Receive the Mission (임무 수령) | `scout` | FM 3-21.8 §5-21 | 임무 수신, 가용시간 분석 |
| 2. Issue a Warning Order (경고명령) | `context-builder` | FM 3-21.8 §5-22 | 예하 병행 준비 시작 |
| 3. Make a Tentative Plan (가계획) | `planner` | FM 3-21.8 §5-23 | METT-TC, OAKOC 분석 |
| 4. Initiate Movement (이동 개시) | `worker` | FM 3-21.8 §5-29 | 즉시 이동 시작 |
| 5. Conduct Reconnaissance (정찰) | `scout` (재호출) | FM 3-90, FM 7-92 | 정찰 7대 원칙 |
| 6. Complete the Plan (계획 완성) | `context-builder` (재호출) | FM 5-0 (MDMP) | 정찰 결과 통합 |
| 7. Issue the OPORD (작전명령) | `planner` (완성) | FM 5-0 | 5단락 OPORD |
| 8. Supervise and Refine (감독·정련) | `reviewer` | FM 7-0 (AAR) | 4대 AAR 질문 |

주요 인용 개념:
- **METT-TC**: Mission, Enemy, Terrain & weather, Troops, Time, Civil considerations
  - 출처: FM 3-21.8 §5-31~5-43, FM 5-0
- **OAKOC**: Observation/fields of fire, Avenues of approach, Key terrain, Obstacles, Cover/concealment
  - 출처: FM 3-21.8 §5-31, FM 3-0
- **CCIR**: Commander's Critical Information Requirements (PIR, FFIR, EEFI)
  - 출처: FM 3-0, FM 5-0
- **1/3-2/3 Rule**: 사용 가능 시간의 1/3은 지휘부, 2/3는 예하 — FM 3-21.8 §1-31
- **5-Paragraph OPORD**: SITUATION → MISSION → EXECUTION → SUSTAINMENT → COMMAND AND SIGNAL
  - 출처: FM 5-0, FM 3-21.8
- **AAR 4 Questions**: What was supposed / actually happened? Why? What can we do better?
  - 출처: FM 7-0, TC 25-20

### 2.2 `clear-hold-build.chain.md`
**COIN(대반란작전) 3단계 작전 — 복잡·장기·다영역 작업.**

| 단계 | 에이전트 | 근거 FM | 핵심 개념 |
|---|---|---|---|
| Phase 0: Area Assessment | `scout` | FM 3-24.2 §3 | PMESII-PT, 7 LOE |
| Phase 1: Clear 계획 | `context-builder` | FM 3-24.2 §3-IV | 합법성 보존 격멸 |
| Clear 실행 | `planner` | FM 3-24.2 §5 | Shape-Engage-Stabilize-Transition |
| Phase 2: Hold | `worker` | FM 3-24.2 §6 | 지속적 보안 제공 |
| Phase 3: Build 평가 | `reviewer` | FM 3-24.2 §3 | MOE/MOP, 전환 기준 |

주요 인용 개념:
- **PMESII-PT**: Political, Military, Economic, Social, Information, Infrastructure, Physical environment, Time
  - 출처: FM 3-24.2 §1, FM 3-0
- **7 Lines of Effort (LOE)**: Civil security, Civil control, HN security forces, Governance, Economic/infrastructure, Information engagement, Other
  - 출처: FM 3-24.2 §3, "Tactics in Counterinsurgency" 2009
- **Robert Thompson's 5 Principles**: Clear political aim, Lawful operations, Overall plan, Defeat political subversion first, Secure base areas first
  - 출처: FM 3-24.2 §3-9 (역사적 이론 섹션)
- **Galula's 4 Laws**: 인구 지지가 결정적, 적극적 소수가 결정, 능동적 소수의 지지 획득, 행동의 강도와 폭
  - 출처: FM 3-24.2 §3-9
- **Clear-Hold-Build**: 위협 제거 → 통제 유지 → 합법성 구축
  - 출처: FM 3-24.2 §3-IV, FM 3-24 (2014)
- **MOE / MOP**: Measures of Effectiveness / Performance — 결과 vs 활동
  - 출처: FM 3-24.2 §4, FM 5-0

### 2.3 `zone-reconnaissance.chain.md`
**FM 3-90 5가지 정찰형식 중 3가지를 병행 — 미확인 영역 매핑용.**

| 정찰 형식 | 에이전트 | 근거 FM | 적용 시기 |
|---|---|---|---|
| Route Reconnaissance (노상정찰) | `scout` (병렬 #1) | FM 3-90 §13-8 | 특정 경로/체인 |
| Area Reconnaissance (지역정찰) | `scout` (병렬 #2) | FM 3-90 §13-12 | 좁은 영역 깊이 |
| Zone Reconnaissance (구역정찰) | `scout` (병렬 #3) | FM 3-90 §13-10, FM 7-92 | 넓은 슬라이스 |
| ISR Synthesis | `context-builder` | FM 3-90.2 §4 | 다출처 융합 |
| COA Decision Point | `planner` | FM 5-0 | 행동방안 비교 |

주요 인용 개념:
- **정찰 7대 원칙 (7 Fundamentals of Reconnaissance)**:
  1. Ensure continuous reconnaissance
  2. Do not keep reconnaissance assets in reserve
  3. Orient on the reconnaissance objective
  4. Report information rapidly and accurately
  5. Retain freedom of maneuver
  6. Gain and maintain enemy contact
  7. Develop the situation rapidly
  - 출처: FM 3-90 §13, ADRP 3-90
- **5 Forms of Reconnaissance**: Route, Area, Zone, Reconnaissance in Force, Special Reconnaissance
  - 출처: ADRP 3-90, FM 3-90
- **Reconnaissance Pull vs Push**:
  - Pull: 적 상황 불명확 → 정찰이 계획을 끌어옴
  - Push: 계획 확정 → 정찰이 그것을 검증
  - 출처: FM 3-90.2 §4, "From the Screen Line" (Armor Magazine 2015)
- **Zone Recon Methods**: Fan, Box, Converging Routes
  - 출처: FM 7-92 §4, ATP 3-21.8 §6-215~6-218

### 2.4 `mission-command.chain.md`
**FM 6-0 임무형 지휘 — 빠르고 작은 임무용.**

| 단계 | 에이전트 | 근거 FM | 핵심 개념 |
|---|---|---|---|
| Commander's Intent | `context-builder` | FM 6-0, ADP 6-0 | Purpose/Key Tasks/End State |
| Mission Orders 실행 | `worker` | FM 6-0 6원칙 | 의도 내 적응 |
| Consistency Check | `oracle` | FM 7-0 AAR | Drift 검출 |

주요 인용 개념:
- **임무형 지휘 6원칙 (Principles of Mission Command)**:
  1. Build cohesive teams through mutual trust
  2. Create shared understanding
  3. Provide a clear commander's intent
  4. Exercise disciplined initiative
  5. Use mission orders
  6. Accept prudent risk
  - 출처: FM 6-0, ADP 6-0
- **Commander's Intent 3요소**: Purpose, Key Tasks, End State
  - 출처: FM 5-0, FM 3-0, ADP 6-0
- **Discipline of Initiative**: 명시된 임무 범위를 벗어나도 의도를 달성하는 자율성
  - 출처: ADP 6-0

---

## 3. 참고한 야전교범 목록 (위키 페이지 기준)

다음 교범들은 위키피디아의 "United States Army Field Manuals" 페이지에 명시된
야전교범 중 본 작업에 직접 또는 간접적으로 참고된 것들이다.

### 3.1 직접 인용된 교범 (전술 개념을 실제 사용)

| FM 번호 | 제목 | 사용처 |
|---|---|---|
| FM 3-0 | Operations | 6 Warfighting Functions, 전반 작전 프레임 |
| FM 3-21.8 | The Infantry Rifle Platoon and Squad | TLP 8단계, METT-TC, OAKOC, Mission Command |
| FM 3-24 / 3-24.2 | Insurgencies and Countering Insurgencies / Tactics in Counterinsurgency | LOE 7개, Clear-Hold-Build, PMESII-PT, Galula, Thompson |
| FM 3-90 | Tactics | 5가지 정찰형식, 정찰 7원칙, Pull/Push |
| FM 5-0 | Army Planning and Orders Production | MDMP, 5단락 OPORD |
| FM 6-0 | Mission Command | 임무형 지휘 6원칙, Commander's Intent |
| FM 6-22 | Leader Development | Be-Know-Do, 직접·조직·전략 리더십, SOAR 피드백 |
| FM 7-0 | Training for Full Spectrum Operations | AAR 4대 질문 |
| FM 7-92 | The Infantry Reconnaissance Platoon and Squad | Fan/Box/Converging 정찰 기법 |

### 3.2 보완 / 간접 참조 교범

| FM 번호 | 제목 | 비고 |
|---|---|---|
| FM 1 | The Army | 위키 페이지 명시 — Army의 기본 원칙 (capstone) |
| FM 2-22.3 | Human Intelligence Collector Operations | researcher 매핑 근거 |
| FM 3-04 | Army Aviation | 위키 PDF 링크 존재, 직접 인용은 없음 |
| FM 27-10 | The Law of Land Warfare (1956) | ROE / 합법성 제약의 근거 |
| FM 34-52 | Intelligence Interrogation | researcher 매핑 근거 (FM 2-22.3로 대체됨) |
| ADP 3-0 | Operations (현행) | FM 3-0의 압축 버전, Warfighting Functions |
| ADP 6-22 | Army Leadership and the Profession | FM 6-22의 현행 버전, 리더 속성/역량 |
| ADRP 3-90 | Offense and Defense | 5가지 정찰형식의 현행 정의 |

### 3.3 참고했으나 직접 매핑은 없는 교범 (위키 페이지 명시)

다음 교범들은 위키피디아 페이지에 명시되어 있으나, 본 체인 설계에는
직접적으로 매핑되지 않았다. 그러나 향후 확장 가능성이 있다:

- FM 1-100 / FM 1-112 / FM 1-113 / FM 1-116 — 육군 항공 작전
- FM 3-01.11 — 방공포병 핸드북
- FM 3-04.126 — 공격정찰헬기 작전
- FM 3-05.70 (구 FM 21-76) — 생존 매뉴얼
- FM 3-09.34 — Kill Box 전술
- FM 3-13 — Inform and Influence Activities
- FM 3-14 — 육군 우주 작전
- FM 3-18 — 특수작전 부대
- FM 3-19.15 — 시위 진압 작전
- FM 3-22.5 — 제식훈련
- FM 3-25.150 — Combatives (격투술)
- FM 5-15 — Field Fortifications (1783~1972 다년판)
- FM 5-31 — 부비트랩 (1965, 비활성)
- FM 20-3 — 위장·은폐·기만(decoy)
- FM 21-15 — 개인 피복 및 장비
- FM 24-1 — 전투 통신
- FM 31-27 — 특작 짐승 운용
- FM 90-10-1 — 시가전(Urban warfare)
- FM 100-5 — Operations (FM 3-0으로 대체된 이전판)

위키 페이지 원문에 따르면 "2007년 7월 기준 542개의 야전교범이 사용 중"이며,
"Doctrine 2015" 이니셔티브 이후 핵심 교리는 ADP / ADRP로 이관되었다.

---

## 4. 디렉토리 구조 (pi-subagents 규약 준수)

```
.pi/
└── chains/
    └── field-manual/                          # 패키지 명
        ├── troop-leading-procedures.chain.md  # 메인: 8단계 TLP
        ├── clear-hold-build.chain.md          # COIN 3단계
        ├── zone-reconnaissance.chain.md       # 정찰 병행
        └── mission-command.chain.md           # 단일 임무 위임
docs/
└── references.md                              # 본 문서
```

`pi-subagents` 디스커버리 규약에 따라:
- `.pi/chains/**/*.chain.md` — 프로젝트 스코프 (재귀 검색됨)
- 패키지 명: `field-manual` (frontmatter `package` 필드)
- 런타임 이름: `field-manual.troop-leading-procedures` 등

사용 예:
```text
/run-chain field-manual.troop-leading-procedures -- 새 기능 구현
/run-chain field-manual.clear-hold-build -- 레거시 모듈 현대화
/run-chain field-manual.zone-reconnaissance -- 인증 시스템 전체 매핑
/run-chain field-manual.mission-command -- 단일 버그 픽스
```

---

## 5. 설계 철학 요약

본 체인들의 공통 원칙 — FM 6-0 임무형 지휘에서 차용:

1. **의도 우선 (Intent over procedure)** — 모든 체인이 "왜"를 먼저 명시한다.
   *(FM 6-0, FM 3-0)*

2. **추측보다 정찰 (Reconnaissance over assumption)** — 가정 위에 행동하지 않는다.
   *(FM 3-90 정찰 7원칙)*

3. **계층화된 자율성 (Layered autonomy)** — 예하는 의도 범위 내에서 자유롭게,
   범위를 벗어나면 즉시 보고. *(FM 6-0)*

4. **검증된 일관성 (Verified consistency)** — `oracle`이 의도 일관성을 보장,
   `reviewer`가 결과 표준을 검증. *(FM 7-0 AAR, FM 6-22)*

5. **시간의 규율 (Discipline of time)** — 1/3-2/3 원칙 등 시간 분배.
   *(FM 3-21.8)*

6. **보고의 신속성 (Rapid reporting)** — SALUTE / SITREP / Spot Report 형식.
   `contact_supervisor`는 야전의 무전 보고와 같다. *(FM 3-21.8, FM 3-90)*

---

## 6. 작성 메모

- 위키 페이지의 PDF 링크 일부(globalsecurity.org, irp.fas.org, archived FAS 미러)는
  네트워크 정책상 직접 다운로드가 불가하여, 본 문서의 인용 절·문단 번호는
  공개된 텍스트 발췌(위키, 학술 미러, ROTC 교재 PDF, marines.mil 미러)에서 확인된 것에 한정한다.
- 위키 페이지 자체에서 직접 인용된 PDF 링크 목록:
  - FM 1-100, 1-112, 1-113, 1-116 — Wayback Machine 미러
  - FM 3-04, FM 3-04.126 — FAS IRP 미러
  - FM 3-21.8 — armypubs.army.mil
  - FM 3-24 — armypubs.army.mil
  - FM 5-15 (1783~1972) — 다중 미러
  - FM 27-10 — Wayback Machine 미러
- FM 번호 체계는 2010 "Doctrine 2015" 이후 ADP/ADRP/ATP로 일부 이관되었으나,
  본 작업은 위키 페이지가 명시한 FM 번호를 우선 사용했다.
