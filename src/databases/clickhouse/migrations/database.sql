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

--- Inicio para tabela materializada para sumarização hourly
CREATE TABLE IF NOT EXISTS telemetry.spans_database_hourly_summary
(
    start_time DateTime,
    id_empresa   String,
    query_type   String,

    total_queries  AggregateFunction(count),
    duration_state AggregateFunction(avg, UInt64),
    p50_state      AggregateFunction(quantile(0.5), UInt64),
    p90_state      AggregateFunction(quantile(0.9), UInt64),
    p95_state      AggregateFunction(quantile(0.95), UInt64),
    p99_state      AggregateFunction(quantile(0.99), UInt64)

) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(start_time)
ORDER BY (id_empresa, query_type, start_time);


CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry.spans_database_mv TO telemetry.spans_database_hourly_summary AS
SELECT
    toStartOfHour(start_time) AS start_time,
    id_empresa,

    multiIf(
        db_statement LIKE 'SELECT%', 'SELECT',
        db_statement LIKE 'INSERT%', 'INSERT',
        db_statement LIKE 'UPDATE%', 'UPDATE',
        db_statement LIKE 'DELETE%', 'DELETE',
        'OTHER'
    ) AS query_type,

    countState()                    AS total_queries,
    avgState(duration_ns)           AS duration_state,
    quantileState(0.5)(duration_ns) AS p50_state,
    quantileState(0.9)(duration_ns) AS p90_state,
    quantileState(0.95)(duration_ns)AS p95_state,
    quantileState(0.99)(duration_ns)AS p99_state
FROM
    telemetry.spans_database
GROUP BY
    start_time,
    id_empresa,
    query_type;

--- Fim para tabela materializada para sumarização hourly

CREATE TABLE IF NOT EXISTS telemetry.spans_database_by_duration
(
    start_time   DateTime,
    id_empresa   String,
    trace_id     String,
    db_statement String,
    duration_ns  UInt64
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(start_time)
ORDER BY (id_empresa, duration_ns DESC, start_time); 



