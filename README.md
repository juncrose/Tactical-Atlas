# TACTICAL ATLAS

***해당 프로잭트는 아직 준비되지 않았습니다***

> **전쟁사를 시간축 위에서 재현하는 오픈소스 작전도 시뮬레이터.**

근대 이후 주요 전투의 *기동, 전술, 영향관계*를 인터랙티브 지도 위에 펼쳐 놓는 프로젝트입니다. 위키피디아가 *무엇이 일어났는가*를 다룬다면, TACTICAL ATLAS는 **그것이 어떻게 일어났는가**를 다룹니다.

[![License: MIT](https://img.shields.io/badge/Code-MIT-blue.svg)](LICENSE)
[![Data: CC BY-SA 4.0](https://img.shields.io/badge/Data-CC%20BY--SA%204.0-green.svg)](LICENSE-DATA)
[![Battles](https://img.shields.io/badge/battles-14-orange.svg)](data/battles/)

## 무엇이 다른가요

| 기존 도구 | TACTICAL ATLAS |
| --- | --- |
| Wikipedia 전투 항목 | 시간축 위에서 부대 기동을 *재생* |
| Chronas.org (역사 지도) | 국경 변천 + **전술 시뮬레이션** |
| 군사사 책 | 인터랙티브, 누구나 기여 가능 |

## 어떤 전투를 다루나요

현재 14개 전투, 3개 시뮬레이션. 1차대전 ~ 걸프전 범위.

- **1차대전**: 타넨베르크, 베르됭
- **2차대전**: 프랑스 침공, 미드웨이, 스탈린그라드, 노르망디
- **한국전쟁**: 낙동강, 다부동, 인천, 장진호, 현리, 백마고지
- **현대**: 6일 전쟁, 걸프 전쟁

각 전투에는: 양측 사령관·병력·사상자, 사용된 전술 2-4개, 전쟁사적 의의, 다른 전투와의 영향관계, 위키피디아/위키데이터 링크, 학술 출처가 포함됩니다.

## 기여하는 법

**코드를 몰라도 기여 가능합니다.** 모든 데이터는 사람이 읽기 쉬운 JSON 파일이에요.

| 하고 싶은 것 | 보세요 |
| --- | --- |
| 새 전투 추가 | [CONTRIBUTING.md - 새 전투 추가](CONTRIBUTING.md#새-전투-추가) |
| 시뮬레이션(부대 기동) 추가 | [CONTRIBUTING.md - 시뮬레이션 추가](CONTRIBUTING.md#시뮬레이션-추가) |
| 데이터 오류 신고 | [Issue 열기](../../issues/new?template=data_error.yml) |
| 새 전투 제안 (직접 작성 X) | [Issue 열기](../../issues/new?template=battle_request.yml) |

## 로컬에서 실행

```bash
git clone https://github.com/juncrose/Tactical-Atlas.git
cd Tactical-Atlas
npm install
npm run dev         # 로컬 서버 띄우기
npm run validate    # 데이터 검증
npm run fetch:borders  # CShapes 국경 데이터 받기 (선택)
```

## 라이선스

- **코드** (`src/`, `scripts/`): MIT
- **데이터** (`data/`): CC BY-SA 4.0 — 출처 표기 + 동일 라이선스 공유
- **국경 데이터** (`data/borders/`): CC BY 4.0 (CShapes 2.0, Schvitz et al. 2022)

## 감사

이 프로젝트는 [Chronas](https://chronas.org/) (Dietmar Aumann)의 *누구나 기여하는 역사 지도* 정신에서 영감을 받았습니다. 다만 Chronas가 *광역 역사*에 집중한다면, 본 프로젝트는 *전술 깊이*에 집중합니다.
