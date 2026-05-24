# 기여 가이드

TACTICAL ATLAS는 위키피디아처럼 **누구나 기여할 수 있는 군사사 데이터베이스**를 지향합니다. 코드를 몰라도 기여할 수 있어요.

## 기여 종류

1. [**새 전투 추가**](#새-전투-추가) — JSON 파일 하나만 추가하면 됨
2. [**시뮬레이션 추가**](#시뮬레이션-추가) — 전투의 시간축 작전 재현
3. [**기존 데이터 개선**](#기존-데이터-개선) — 오류 수정, 출처 추가, 위키데이터 ID 채우기
4. [**번역**](#번역) — 영문화/다국어
5. [**코드**](#코드-기여) — 기능 추가, 버그 수정

---

## 새 전투 추가

### 코딩 없이 (Issue 방식)

GitHub 계정만 있으면 됩니다.

1. [**전투 제안 Issue**](../../issues/new?template=battle_request.yml) 열기
2. 양식에 따라 작성:
   - 전투 이름 (한/영)
   - 시기, 좌표
   - 교전 세력, 사령관, 병력, 사상자
   - 사용된 전술 2-4개
   - 전쟁사적 의의 1-2문장
   - 참고 자료
3. 메인테이너가 검토 후 JSON으로 옮겨 PR로 머지

### 직접 PR로 (코딩 가능자)

1. `data/battles/`에 새 파일 추가, 예: `kursk_1943.json`
2. [전투 스키마](schemas/battle.schema.json) 참조해서 작성
3. 로컬 검증:
   ```bash
   npm run validate
   ```
4. PR 열기

#### 최소 예시

```json
{
  "id": "kursk_1943",
  "name": "쿠르스크 전투",
  "name_en": "Battle of Kursk",
  "era": "ww2",
  "year": 1943,
  "year_decimal": 1943.5,
  "date_display": "1943년 7월 5일 - 8월 23일",
  "coords": [51.73, 36.19],
  "sides": [
    {
      "name": "소비에트 연방",
      "commander": "주코프 · 바실리예프스키 · 로코솝스키",
      "troops": 1900000,
      "casualties": 863000,
      "color": "soviet",
      "victor": true,
      "symbol": "armor_combined"
    },
    {
      "name": "독일 국방군",
      "commander": "만슈타인 · 모델 · 클루게",
      "troops": 780000,
      "casualties": 200000,
      "color": "german",
      "victor": false,
      "symbol": "armor_combined"
    }
  ],
  "tactics": [
    {
      "ko": "종심방어",
      "en": "Defense in Depth",
      "desc": "8개 방어선 약 300km 종심, 대전차호와 지뢰지대로 독일 기갑부대 소모"
    },
    {
      "ko": "예비전력 운용",
      "en": "Operational Reserve",
      "desc": "스텝 전선군을 후방 예비로 두고 독일 공세 정점에서 반격"
    }
  ],
  "significance": "<strong>독소전쟁의 결정적 전환점.</strong> 동부전선에서 독일이 마지막으로 전략적 공세를 시도한 전투. 이후 종전까지 독일은 수세에 머물렀다.",
  "description": "독일은 쿠르스크 돌출부를 양익에서 협공하는 '성채 작전(Operation Zitadelle)'을 계획했으나, 소련은 스파이망으로 사전 정보를 입수해 8개 종심방어선을 구축했다. 7월 5일 독일 공세 개시, 7월 12일 프로호로프카에서 사상 최대 기갑전. 8월 소련 반격으로 하리코프 탈환.",
  "influenced_by": ["stalingrad_1942"],
  "influences": [],
  "has_simulation": false,
  "sources": [
    {
      "type": "book",
      "citation": "Glantz, D. & House, J. (1999). The Battle of Kursk. University Press of Kansas."
    }
  ],
  "wikidata_id": "Q156302",
  "wikipedia": {
    "ko": "https://ko.wikipedia.org/wiki/쿠르스크_전투",
    "en": "https://en.wikipedia.org/wiki/Battle_of_Kursk"
  },
  "contributors": [],
  "last_reviewed": null,
  "review_status": "community"
}
```

### 검수 기준 (review_status)

| 단계 | 조건 | 자동/수동 |
| --- | --- | --- |
| `community` | 스키마 통과만 함 | 자동 |
| `reviewed` | 출처 ≥ 1개, 위키데이터 ID 있음, 메인테이너 1명 검토 | 메인테이너 수동 |
| `verified` | 출처 ≥ 2개 (책/논문), 도메인 전문가 1명 검토 | 메인테이너 수동 |

승자(`victor: true`)는 정확히 한 진영이어야 합니다. 무승부 전투는 [GitHub Discussions](../../discussions)에서 분류 방식을 먼저 합의하세요.

---

## 시뮬레이션 추가

전투에 *시간축 부대 기동*을 더하는 작업입니다. 가장 임팩트가 큰 기여예요.

### 키프레임 방식

각 부대를 시간(`t`)과 위치(`pos`)의 키프레임 배열로 표현합니다. 두 키프레임 사이는 자동 보간됩니다.

```json
{
  "battle_id": "kursk_1943",
  "duration_h": 480,
  "bounds": [[50.5, 35.0], [53.0, 38.0]],
  "t_label": { "format": "day_hour", "day_offset": 5 },
  "phases": [
    { "t": 0,   "label": "국면 1 · 북부 모델군 공세 개시" },
    { "t": 24,  "label": "국면 2 · 남부 만슈타인 진격" },
    { "t": 168, "label": "국면 3 · 프로호로프카 전차전" },
    { "t": 240, "label": "국면 4 · 독일 공세 정지" },
    { "t": 360, "label": "국면 5 · 소련 쿠투조프 반격" }
  ],
  "units": [
    {
      "id": "ger_9_army",
      "name": "독일 9군",
      "type": "armor_combined",
      "side": "german",
      "commander": "모델",
      "strength": "약 33만",
      "keyframes": [
        { "t": 0,   "pos": [52.5, 36.5], "status": "공세 준비",      "order": "올호바트카 방향 돌파", "objective": "포니리 점령" },
        { "t": 48,  "pos": [52.3, 36.3], "status": "지뢰지대 돌파 중", "order": "공세 지속" },
        { "t": 168, "pos": [52.2, 36.2], "status": "공세 정지",      "order": "방어 전환",          "objective": "현 위치 사수" },
        { "t": 480, "pos": [52.6, 36.6], "status": "퇴각",           "order": "오룔 방면 후퇴" }
      ]
    }
  ]
}
```

### t_label 모드

| 모드 | 출력 예 | 추가 필드 |
| --- | --- | --- |
| `h_plus` | `H+02:30` | 없음 |
| `wall_clock` | `H+02:30 (현지 07:30)` | `start_wall_time: "05:00"` |
| `day_hour` | `Day 7 14:00` | `day_offset: 5` (1=Day 5 등) |
| `date_hour` | `1943-07-07 14:00` | `start_date: "1943-07-05"` |

### 좌표 정확도

키프레임 좌표는 **소수점 4자리** 이상 권장 (약 10m 정확도). 군사사 책의 그림 지도를 따라 그리고, 가능하면 OpenStreetMap이나 Google Maps에서 실제 지명을 확인하세요.

### 참가자가 너무 많으면

수십 개 사단을 다 그릴 필요 없어요. **결정적이었던 6-12개 부대**만 골라서 작전 전체를 설명하는 게 더 좋은 시뮬레이션입니다.

---

## 기존 데이터 개선

가장 환영하는 기여예요. 우선순위:

1. **위키데이터 ID 채우기** — `data/battles/`에서 `wikidata_id: null`인 전투 찾기
2. **출처 추가** — `sources: []`인 전투에 학술 자료 추가하면 `review_status`를 올릴 수 있음
3. **영향관계 그래프 확장** — `influences`/`influenced_by`는 양방향이어야 함 (검증 스크립트가 체크함)
4. **번역** — `name_en`이 위키피디아 표제어와 다르면 수정

---

## 번역

현재 한국어가 1차 언어, 영어가 2차. 다른 언어를 추가하려면 [Discussions](../../discussions)에서 먼저 논의해주세요. 구조 변경이 필요해요 (`name_ja`, `tactics[].ja` 등).

---

## 코드 기여

```bash
git clone ...
cd tactical-atlas
npm install
npm run dev     # 로컬 개발 서버
npm run build   # 단일 HTML 빌드
npm test        # (예정)
```

PR 전에:
- `npm run validate` 통과해야 함
- 새 의존성 추가는 issue로 먼저 논의
- 단일 HTML 산출물 원칙을 깨지 않을 것 (오프라인 작동 가능해야 함)

---

## 행동 강령

전쟁사는 민감한 주제예요. 본 프로젝트는:

- **역사적 정확성**을 우선 — 정치적 해석보다 검증 가능한 사실
- **양측 관점**을 균형 있게 — 승자의 시각만 담지 않음
- **사상자 통계**는 학술 출처 기반 — 양측 공식 발표가 다를 때 둘 다 명시
- **현재 진행 중인 분쟁**은 다루지 않음 (10년 룰 — 종전 10년 이후)

위반 시 메인테이너가 PR 거부 또는 issue 종료할 수 있습니다.
