CREATE TABLE
  telemetry.spans_http (
    id_empresa FixedString (36),
    trace_id FixedString (32),
    span_id FixedString (16),
    parent_span_id FixedString (16),
    service_name LowCardinality (String),
    service_version LowCardinality (String),
    service_environment LowCardinality (String),
    kind LowCardinality (String),
    name LowCardinality(String),
    start_time DateTime64 (9),
    end_time DateTime64 (9),
    duration_ns UInt64,
    http_url LowCardinality (String),
    http_method LowCardinality (String),
    http_target String,
    http_status UInt32,
    attributes String,
    ingestion_time DateTime64 (9) DEFAULT now ()
  ) ENGINE = MergeTree ()
PARTITION BY toDate(start_time)
ORDER BY (id_empresa, start_time)
TTL start_time + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

CREATE TABLE
  telemetry.spans_database (
    id_empresa FixedString (36),
    trace_id FixedString (32),
    span_id FixedString (16),
    parent_span_id FixedString (16),
    service_name LowCardinality (String),
    service_version LowCardinality (String),
    service_environment LowCardinality (String),
    kind LowCardinality (String),
    name LowCardinality(String),
    start_time DateTime64 (9),
    end_time DateTime64 (9),
    duration_ns UInt64,
    db_system LowCardinality (String),
    db_statement String,
    db_duration UInt64,
    db_table LowCardinality (String),
    db_operation LowCardinality (String),
    db_user LowCardinality (String),
    db_name LowCardinality (String),
    attributes String,
    ingestion_time DateTime64 (9) DEFAULT now ()
  ) ENGINE = MergeTree ()
PARTITION BY toDate(start_time)
ORDER BY (id_empresa, start_time)
TTL start_time + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;
