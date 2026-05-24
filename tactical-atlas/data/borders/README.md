# Historical Borders (역사 국경 데이터)

이 디렉토리는 시대별 국경 GeoJSON을 담습니다. 시간 슬라이더에 맞춰 지도 배경에 그려집니다.

## 데이터 출처

**CShapes 2.0** (Schvitz et al. 2022) — 1886년 이후 전 세계 국경 변천을 학술적으로 정리한 데이터셋.

- 공식 사이트: https://icr.ethz.ch/data/cshapes/
- 라이선스: **CC BY 4.0** (출처 표기만 하면 자유 사용)
- 학술 인용:
  > Schvitz, G., Girardin, L., Rüegger, S., Weidmann, N. B., Cederman, L. E., & Gleditsch, K. S. (2022). Mapping the international system, 1886-2019: The CShapes 2.0 dataset. Journal of Conflict Resolution, 66(1), 144-161.

## 파일 명명 규칙

```
borders/
  1914.geojson    # 1914년 1월 1일 시점의 국경
  1918.geojson    # 1차대전 종전 직후
  1939.geojson    # 2차대전 발발 시점
  1945.geojson    # 2차대전 종전
  1950.geojson    # 한국전쟁 발발
  ...
```

내삽 규칙: 1939와 1945만 있을 때 1942년 국경을 그리려면 **1939년 파일을 사용**합니다 (가장 가까운 과거 시점). 정확도가 중요하면 추가 파일을 기여하세요.

## 어떻게 받나요

CShapes 원본은 Shapefile입니다. GeoJSON으로 변환하려면:

```bash
# scripts/fetch-cshapes.sh 참조
npm run fetch:borders
```

이 명령은:
1. CShapes 2.0 Shapefile을 ICR ETH에서 다운로드
2. ogr2ogr로 GeoJSON 변환
3. 본 프로젝트에서 사용하는 연도별로 분할
4. 좌표 정밀도를 소수점 3자리로 단순화 (파일 크기 절감)

## 기여 방법

**시점 추가**: 본 프로젝트에 새 전투를 추가할 때 해당 연도 GeoJSON이 없으면 함께 PR 해주세요.

**정확도 개선**: 특정 국경에 오류가 있다면 CShapes 원본을 수정하기보다 우리 GeoJSON에 직접 패치하고 PR 메시지에 학술 근거를 첨부해주세요.

## 라이선스 표기

CShapes 데이터를 포함하므로 본 프로젝트의 `borders/` 디렉토리는 **CC BY 4.0** 라이선스이며, 사용 시 위 학술 인용을 표기해야 합니다. 코드(MIT) 라이선스와 별개입니다.
