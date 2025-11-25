DROP table spans_database;
drop table spans_database_hourly_summary;
drop table spans_database_slowest;
drop table spans_http;
drop view spans_agg_mv;
drop view spans_database_mv;


CREATE TABLE telemetry.spans_http 
(
    id_empresa LowCardinality(FixedString(36)),
    project_id LowCardinality(FixedString(36)),

    trace_id FixedString(32),
    span_id FixedString(16),
    parent_span_id FixedString(16),

    service_name LowCardinality(String),
    service_version LowCardinality(String),
    service_environment LowCardinality(String),

    kind LowCardinality(String),
    name LowCardinality(String),

    start_time DateTime64(9),
    end_time DateTime64(9),
    duration_ns UInt64,

    http_url LowCardinality(String),
    http_method LowCardinality(String),
    http_target String,
    http_status UInt32,

    attributes String,
    ingestion_time DateTime64(9) DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toDate(start_time)
ORDER BY (id_empresa, project_id, start_time)
TTL start_time + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;


CREATE TABLE telemetry.spans_database 
(
    id_empresa LowCardinality(FixedString(36)),
    project_id LowCardinality(FixedString(36)),

    trace_id FixedString(32),
    span_id FixedString(16),
    parent_span_id FixedString(16),

    service_name LowCardinality(String),
    service_version LowCardinality(String),
    service_environment LowCardinality(String),

    kind LowCardinality(String),
    name LowCardinality(String),

    start_time DateTime64(9),
    end_time DateTime64(9),
    duration_ns UInt64,

    db_system LowCardinality(String),
    db_statement String,
    db_duration UInt64,
    db_table LowCardinality(String),
    db_operation LowCardinality(String),
    db_user LowCardinality(String),
    db_name LowCardinality(String),

    attributes String,
    ingestion_time DateTime64(9) DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toDate(start_time)
ORDER BY (id_empresa, project_id, start_time)
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
        db_operation LIKE 'select%', 'SELECT',
        db_operation LIKE 'insert%', 'INSERT',
        db_operation LIKE 'update%', 'UPDATE',
        db_operation LIKE 'del%', 'DEL',
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

---- INICIo criacação de slowest query
-- Primeiro, apague a tabela e a view antigas para recriá-las

CREATE TABLE telemetry.spans_database_slowest
(
    -- Dimensões para agrupar (GROUP BY)
    day Date,
    id_empresa LowCardinality(FixedString(36)),
    project_id LowCardinality(FixedString(36)),
    db_table LowCardinality(String),
    db_statement String,
    start_time DateTime,

    -- Métricas agregadas
    execution_count AggregateFunction(count),
    sum_duration AggregateFunction(sum, UInt64),
    max_duration AggregateFunction(max, UInt64),

    -- Colunas para guardar o ID do trace mais lento (usando argMax)
    slowest_trace_id AggregateFunction(argMax, FixedString(32), UInt64),
    slowest_span_id AggregateFunction(argMax, FixedString(16), UInt64)
)
ENGINE = AggregatingMergeTree()
PARTITION BY day
ORDER BY (id_empresa, project_id, db_table, db_statement);


CREATE MATERIALIZED VIEW telemetry.spans_agg_mv TO telemetry.spans_database_slowest
AS SELECT
    toDate(start_time) AS day,
    id_empresa,
    project_id,
    db_table,
    db_statement,
    start_time,
    -- Estados de Agregação
    countState() AS execution_count,
    sumState(db_duration) AS sum_duration,
    maxState(db_duration) AS max_duration,

    -- Calcula o estado do argMax
    argMaxState(trace_id, db_duration) AS slowest_trace_id,
    argMaxState(span_id, db_duration) AS slowest_span_id
FROM
    telemetry.spans_database
WHERE
    db_statement != ''
GROUP BY
    day,
    id_empresa,
    project_id,
    db_table,
    start_time,
    db_statement;
