#!/bin/bash

# U.S. Albers
PROJECTION='d3.geoAlbersUsa().scale(1280).translate([480, 300])'

# The state FIPS codes.
STATES="01 02 04 05 06 08 09 10 11 12 13 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 44 45 46 47 48 49 50 51 53 54 55 56"

# The ACS 5-Year Estimate vintage.
YEAR=2014

# The display size.
WIDTH=960
HEIGHT=680

# Download the census tract boundaries.
# Extract the shapefile (.shp) and dBASE (.dbf).
# Download the census tract population estimates.
for STATE in ${STATES}; do
  if [ ! -f cb_${YEAR}_${STATE}_tract_500k.shp ]; then
    curl -o cb_${YEAR}_${STATE}_tract_500k.zip \
      "http://www2.census.gov/geo/tiger/GENZ${YEAR}/shp/cb_${YEAR}_${STATE}_tract_500k.zip"
    unzip -o \
      cb_${YEAR}_${STATE}_tract_500k.zip \
      cb_${YEAR}_${STATE}_tract_500k.shp \
      cb_${YEAR}_${STATE}_tract_500k.dbf
  fi
  if [ ! -f cb_${YEAR}_${STATE}_tract_B01003.json ]; then
    curl -o cb_${YEAR}_${STATE}_tract_B01003.json \
      "http://api.census.gov/data/${YEAR}/acs5?get=B01003_001E&for=tract:*&in=state:${STATE}&key=${CENSUS_KEY}"
  fi
done

# Construct TopoJSON.
if [ ! -f topo.json ]; then
  geo2topo -n \
    tracts=<(for STATE in ${STATES}; do \
        ndjson-join 'd.id' \
          <(shp2json -n cb_${YEAR}_${STATE}_tract_500k.shp \
            | geoproject -n "${PROJECTION}" \
            | ndjson-map 'd.id = d.properties.GEOID, d') \
          <(ndjson-cat cb_${YEAR}_${STATE}_tract_B01003.json \
            | ndjson-split 'd.slice(1)' \
            | ndjson-map '{id: d[1] + d[2] + d[3], B01003: +d[0]}') \
          | ndjson-map -r d3=d3-array 'd[0].properties = {density: d3.bisect([1, 10, 50, 200, 500, 1000, 2000, 4000], (d[1].B01003 / d[0].properties.ALAND || 0) * 2589975.2356)}, d[0]'; \
      done) \
    | topomerge -k 'd.id.slice(0, 5)' counties=tracts \
    | topomerge -k 'd.id.slice(0, 2)' states=counties \
    | topomerge --mesh -f 'a !== b' counties=counties \
    | topomerge --mesh -f 'a !== b' states=states \
    | topomerge -k 'd.properties.density' tracts=tracts \
    | toposimplify -p 1 -f \
    | topoquantize 1e5 \
    > topo.json
fi
