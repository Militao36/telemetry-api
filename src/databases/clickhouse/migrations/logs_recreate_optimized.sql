/*
  WARNING: DESTRUCTIVE MIGRATION
  This script drops telemetry logs tables/views and recreates them optimized.
  All existing data in telemetry.logs and telemetry.logs_tokens will be lost.
*/

DROP VIEW IF EXISTS telemetry.mv_logs_tokens;
DROP TABLE IF EXISTS telemetry.logs_tokens;
DROP TABLE IF EXISTS telemetry.logs;

CREATE TABLE telemetry.logs
(
    id_empresa LowCardinality(FixedString(36)),
    project_id LowCardinality(FixedString(36)),

    timestamp DateTime64(9, 'UTC'),
    trace_id FixedString(32),
    span_id FixedString(16),
    severity_text LowCardinality(String),
    severity_number UInt8,
    service_name LowCardinality(String),
    environment LowCardinality(String),
    host LowCardinality(String),
    app_version LowCardinality(String),
    logger_name LowCardinality(String),

    message String,
    attributes String,
    body String,

    exception_type String,
    exception_message String,
    exception_stacktrace String,

    ingestion_time DateTime64(9, 'UTC') DEFAULT now('UTC'),

    INDEX idx_trace_id_bf trace_id TYPE bloom_filter(0.01) GRANULARITY 4,
    INDEX idx_span_id_bf span_id TYPE bloom_filter(0.01) GRANULARITY 4,
    INDEX idx_message_ngrambf message TYPE ngrambf_v1(3, 256, 3, 0) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (id_empresa, project_id, timestamp, severity_number)
TTL timestamp + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

CREATE TABLE telemetry.logs_tokens
(
  id_empresa LowCardinality(FixedString(36)),
  project_id LowCardinality(FixedString(36)),
  log_key String,
  token String,
  timestamp DateTime64(9, 'UTC')
)
ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (id_empresa, project_id, token, timestamp)
TTL timestamp + INTERVAL 30 DAY;

CREATE MATERIALIZED VIEW telemetry.mv_logs_tokens
TO telemetry.logs_tokens AS
SELECT
  id_empresa,
  project_id,
  concat(trace_id, '-', span_id) AS log_key,
  arrayJoin(arrayFilter(x -> x != '', splitByRegexp('[^\\p{L}\\p{N}]+', lower(message)))) AS token,
  timestamp
FROM telemetry.logs;
