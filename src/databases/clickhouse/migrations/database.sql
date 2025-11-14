CREATE TABLE telemetry.spans_http (
  id_empresa     FixedString(36),
  trace_id       FixedString(32),
  span_id        FixedString(16),
  parent_span_id FixedString(16),

  service_name   LowCardinality(String),
  service_version LowCardinality(String),
  service_environment LowCardinality(String),

  start_time     DateTime64(9),
  end_time       DateTime64(9),
  duration_ns    UInt64,

  http_url       LowCardinality(String),
  http_method    LowCardinality(String),
  http_target    String,
  http_status    UInt16,

  attributes     String,
  ingestion_time DateTime64(9) DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (trace_id, start_time)
PARTITION BY toDate(start_time);


CREATE TABLE telemetry.spans_database (
  id_empresa     FixedString(36),
  trace_id       FixedString(32),
  span_id        FixedString(16),
  parent_span_id FixedString(16),

  service_name   LowCardinality(String),
  service_version LowCardinality(String),
  service_environment LowCardinality(String),

  start_time     DateTime64(9),
  end_time       DateTime64(9),
  duration_ns    UInt64,

  db_system      LowCardinality(String),
  db_statement   String,
  db_duration    UInt64,
  db_table       LowCardinality(String),
  db_operation   LowCardinality(String),
  db_user        LowCardinality(String),
  db_name        LowCardinality(String),

  attributes     String,
  ingestion_time DateTime64(9) DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (trace_id, start_time)
PARTITION BY toDate(start_time);


INSERT INTO telemetry.spans_http
SELECT
  id_empresa, trace_id, span_id, parent_span_id,
  service_name, name, start_time, end_time, duration_ns,
  http_method, http_route, http_target, http_status,
  attributes, ingestion_time
FROM telemetry.spans_raw
WHERE span_type = 'http';


INSERT INTO telemetry.spans_database
SELECT
  id_empresa, trace_id, span_id, parent_span_id,
  service_name, name, start_time, end_time, duration_ns,
  db_system, db_statement, db_duration,
  attributes, ingestion_time
FROM telemetry.spans_raw
WHERE span_type = 'db';

