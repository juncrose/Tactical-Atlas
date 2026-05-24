#!/usr/bin/env bash
# CShapes 2.0 데이터를 다운받아 연도별 GeoJSON으로 분할합니다.
# 의존성: curl, unzip, ogr2ogr (gdal-bin), jq

set -euo pipefail

CSHAPES_URL="https://icr.ethz.ch/data/cshapes/CShapes-2.0.zip"
TMPDIR=$(mktemp -d)
OUTDIR="$(cd "$(dirname "$0")/.." && pwd)/data/borders"

echo "→ CShapes 2.0 다운로드 중..."
curl -L "$CSHAPES_URL" -o "$TMPDIR/cshapes.zip"
unzip -q "$TMPDIR/cshapes.zip" -d "$TMPDIR/cshapes"

SHP=$(find "$TMPDIR/cshapes" -name "*.shp" | head -1)
echo "→ Shapefile 발견: $SHP"

# 본 프로젝트가 다루는 연도들 (전투 데이터에서 자동 추출)
YEARS=$(find "$OUTDIR/../battles" -name "*.json" -exec jq -r '.year' {} \; | sort -u)

for Y in $YEARS; do
  OUT="$OUTDIR/${Y}.geojson"
  echo "→ ${Y}년 국경 추출 중..."
  
  # CShapes는 GWSYEAR/GWEYEAR 필드로 국가 존속 기간을 표시
  ogr2ogr -f GeoJSON \
    -where "GWSYEAR <= $Y AND GWEYEAR >= $Y" \
    -select "GWCODE,CNTRY_NAME,CAPNAME" \
    -simplify 0.01 \
    "$OUT" "$SHP"
  
  echo "  ✓ $(jq '.features | length' "$OUT") 개 국가 → $OUT"
done

echo ""
echo "✓ 완료. ${OUTDIR}/에 ${#YEARS[@]}개 GeoJSON 생성됨."
echo "  라이선스: CC BY 4.0 — Schvitz et al. (2022)"
