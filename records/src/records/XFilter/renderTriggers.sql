-- after interaction and after data insert

CREATE TRIGGER renderAllState AFTER INSERT

SELECT
  GROUP_CONCAT(bin || ',' || count)
FROM hourChartData WHERE filterId = ;