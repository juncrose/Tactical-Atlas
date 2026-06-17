# Field Manual Chains — 야전교범 기반 pi-subagents 체인

미 육군 야전교범(US Army Field Manuals)의 전술 의사결정 절차를
`pi-subagents`의 `.chain.md` 워크플로우로 변환한 모음.

군 지휘체계 — 정찰조, 작전참모, 야전부대, 지휘관 — 가 의사결정과 실행을
어떻게 분리·연결하는지를 그대로 본떠, 멀티 에이전트 오케스트레이션의
프레임으로 사용한다.

## 구성

```
.pi/chains/field-manual/
├── troop-leading-procedures.chain.md   # TLP 8단계 (메인 체인)
├── clear-hold-build.chain.md           # COIN Clear-Hold-Build
├── zone-reconnaissance.chain.md        # 5가지 정찰형식 병행
└── mission-command.chain.md            # 임무형 지휘 (단일 임무)
docs/
└── references.md                       # 어떤 FM을 어디에 썼는지
```

## 어떤 체인을 언제 쓰는가

| 작업 성격 | 추천 체인 | 비유 |
|---|---|---|
| 일반적인 구현 작업 | `troop-leading-procedures` | 소대장의 표준 8단계 |
| 복잡·장기·다영역 (예: 마이그레이션, 리팩토링) | `clear-hold-build` | 도시 안정화 작전 |
| 미지의 코드베이스 매핑 / 정보 수집 | `zone-reconnaissance` | 정찰부대 병행 투입 |
| 빠르고 작은 단일 임무 | `mission-command` | 분견대 위임 |

## 군 지휘체계 → 에이전트 매핑 요약

| 군 직책 | 에이전트 | 역할 |
|---|---|---|
| S-2 / Scout Platoon | `scout` | 정찰·정보수집 |
| G-2 분석관 | `researcher` | 외부 교리·선례 조사 |
| XO / 참모통합 | `context-builder` | 컨텍스트 통합·WARNO |
| S-3 작전참모 | `planner` | 작전계획·OPORD |
| 야전부대 | `worker` | 임무 실행 |
| IG / 선임 NCO | `reviewer` | AAR·검증 |
| 지휘관 | `oracle` | 의도 일관성 보장 |
| 파견대 | `delegate` | 단발 위임 |

## 핵심 전술 개념 (자세한 출처는 `docs/references.md` 참조)

- **METT-TC** — 임무·적·지형·부대·시간·민간 분석 프레임 (FM 3-21.8)
- **OAKOC** — 지형의 군사적 요소 5가지 (FM 3-21.8)
- **TLP 8단계** — 소대장의 표준 의사결정 사이클 (FM 3-21.8)
- **MDMP / 5단락 OPORD** — 작전참모의 정식 절차 (FM 5-0)
- **Mission Command 6원칙** — 임무형 지휘 (FM 6-0)
- **정찰 7대 원칙** — 정찰조의 작전 철학 (FM 3-90)
- **5가지 정찰형식** — Route/Area/Zone/Force/Special (ADRP 3-90)
- **AAR 4대 질문** — 사후 검토 표준 (FM 7-0)
- **7 Lines of Effort** — COIN 다영역 노력선 (FM 3-24.2)
- **Clear-Hold-Build** — COIN 3단계 접근 (FM 3-24)

## 사용 방법

`pi-subagents`가 설치된 환경에서 본 디렉토리의 `.pi/chains/`를
프로젝트 루트에 두면 자동으로 디스커버리된다.

```text
/run-chain field-manual.troop-leading-procedures -- "사용자 인증 API 추가"
```

## 출처

- 위키피디아: https://en.wikipedia.org/wiki/United_States_Army_Field_Manuals
- 대상 저장소 (체인 포맷): https://github.com/nicobailon/pi-subagents
- 개별 야전교범 인용 — `docs/references.md` 참조
