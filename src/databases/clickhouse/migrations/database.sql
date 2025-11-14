
-- Tabela de spans
CREATE TABLE IF NOT EXISTS telemetry.spans_raw (
  id_empresa     FixedString(36),
  trace_id       FixedString(32),
  span_id        FixedString(16),
  parent_span_id FixedString(16),

  service_name   LowCardinality(String),
  service_version LowCardinality(String),
  service_environment LowCardinality(String),

  name           String,
  kind           LowCardinality(String),

  start_time     DateTime64(9),
  end_time       DateTime64(9),
  duration_ns    UInt64,

  status_code    UInt8,
  status_message String,

  http_method    LowCardinality(String),
  http_route     LowCardinality(String),
  http_target    String,
  http_status    UInt16,

  db_system      LowCardinality(String),
  db_statement   String,
  db_duration    UInt64,

  attributes     String,

  ingestion_time DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (trace_id, start_time)
PARTITION BY toDate(start_time)
TTL start_time + INTERVAL 30 DAY DELETE
SETTINGS index_granularity = 8192;


-- Tabela de logs
CREATE TABLE IF NOT EXISTS telemetry.logs
(
    `timestamp` DateTime64(9) DEFAULT now(),
    `trace_id` String DEFAULT '',
    `span_id` String DEFAULT '',
    `severity_text` LowCardinality(String),
    `severity_number` UInt8,
    `service_name` LowCardinality(String),
    `environment` LowCardinality(String),
    `host` LowCardinality(String),
    `app_version` LowCardinality(String),
    `logger_name` LowCardinality(String),
    `message` String,
    `attributes` Map(String, String),
    `body` String,
    `exception_type` LowCardinality(String),
    `exception_message` String,
    `exception_stacktrace` String
)
ENGINE = MergeTree
PARTITION BY toDate(timestamp)
ORDER BY (service_name, environment, severity_number, timestamp)
TTL timestamp + INTERVAL 30 DAY DELETE
SETTINGS index_granularity = 8192;
