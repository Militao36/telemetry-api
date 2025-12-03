DROP table spans_database;
DROP table spans_database_hourly_summary;
DROP table spans_database_slowest;
DROP table spans_http;
DROP view spans_agg_mv;
DROP view spans_database_mv;
DROP view spans_http_metrics_by_minute;
DROP view spans_http_slowest_by_target;
DROP table telemetry.logs;

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
        db_operation = 'select', 'SELECT',
        db_operation = 'insert', 'INSERT',
        db_operation = 'update', 'UPDATE',
        db_operation = 'del', 'DEL',
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
-------------- Fim criação de slowest query

--------- inico criação http slowest

CREATE TABLE telemetry.spans_http_slowest_by_target
(
    -- Colunas para agrupar (GROUP BY)
    id_empresa LowCardinality(FixedString(36)),
    http_method LowCardinality(String),
    http_target String,

    -- Coluna para ordenar e encontrar o máximo
    latest_start_time DateTime64(9),

    -- Colunas que queremos guardar do span mais lento
    -- CORREÇÃO: Usar AggregateFunction em vez de SimpleAggregateFunction
    duration_ns AggregateFunction(argMax, UInt64, UInt64),
    trace_id AggregateFunction(argMax, FixedString(32), UInt64),
    span_id AggregateFunction(argMax, FixedString(16), UInt64),
    start_time AggregateFunction(argMax, DateTime64(9), UInt64),
    end_time AggregateFunction(argMax, DateTime64(9), UInt64),
    http_status AggregateFunction(argMax, UInt32, UInt64),
    service_name AggregateFunction(argMax, String, UInt64)
)
ENGINE = AggregatingMergeTree()
PARTITION BY toDate(latest_start_time)
ORDER BY (id_empresa, http_method, http_target);


CREATE MATERIALIZED VIEW telemetry.mv_spans_http_slowest_by_target
TO telemetry.spans_http_slowest_by_target
AS SELECT
    id_empresa,
    http_method,
    http_target,

    -- CORREÇÃO APLICADA AQUI:
    -- Especificar explicitamente "max" da coluna da tabela de origem.
    max(spans_http.start_time) as latest_start_time,
    
    -- Todas as outras agregações também devem ser explícitas.
    argMaxState(spans_http.duration_ns, spans_http.duration_ns) as duration_ns,
    argMaxState(spans_http.trace_id, spans_http.duration_ns) as trace_id,
    argMaxState(spans_http.span_id, spans_http.duration_ns) as span_id,
    argMaxState(spans_http.start_time, spans_http.duration_ns) as start_time,
    argMaxState(spans_http.end_time, spans_http.duration_ns) as end_time,
    argMaxState(spans_http.http_status, spans_http.duration_ns) as http_status,
    argMaxState(spans_http.service_name, spans_http.duration_ns) as service_name
FROM telemetry.spans_http
GROUP BY
    id_empresa,
    http_method,
    http_target;

CREATE TABLE telemetry.spans_http_metrics_by_minute
(
    -- Chaves de Agregação
    time_bucket DateTime,
    id_empresa LowCardinality(FixedString(36)),
    http_method LowCardinality(String),
    http_status UInt32,

    -- Métricas Agregadas
    -- Estado para count()
    request_count AggregateFunction(count),
    -- Estado para avg(duration_ns)
    avg_duration AggregateFunction(avg, UInt64)
)
ENGINE = AggregatingMergeTree()
PARTITION BY toDate(time_bucket)
ORDER BY (id_empresa, http_method, http_status, time_bucket);



CREATE MATERIALIZED VIEW telemetry.mv_spans_http_metrics_by_minute
TO telemetry.spans_http_metrics_by_minute
AS SELECT
    -- Truncar o tempo para o minuto mais próximo
    toStartOfMinute(spans_http.start_time) as time_bucket,
    
    -- Chaves de agrupamento
    id_empresa,
    http_method,
    http_status,

    -- Funções de estado para as métricas
    countState() as request_count,
    avgState(spans_http.duration_ns) as avg_duration
FROM telemetry.spans_http
GROUP BY
    time_bucket,
    id_empresa,
    http_method,
    http_status;

CREATE TABLE telemetry.logs
(
    -- Colunas para identificação e particionamento
    id_empresa LowCardinality(FixedString(36)),
    project_id LowCardinality(FixedString(36)),

    -- Colunas do Log Normalizado
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
    attributes String, -- Armazena o JSON como string
    body String, -- Armazena o JSON do log original como string

    -- Colunas de Exceção
    exception_type String,
    exception_message String,
    exception_stacktrace String,

    -- Coluna para TTL e ingestão
    ingestion_time DateTime64(9, 'UTC') DEFAULT now('UTC')

)
ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (id_empresa, project_id, severity_number, timestamp)
TTL timestamp + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;


CREATE TABLE telemetry.logs_tokens
(
  id_empresa LowCardinality(FixedString(36)),
  project_id LowCardinality(FixedString(36)),
  log_key String,            -- id do log: pode ser concat(trace_id, span_id) ou outro identificador
  token String,
  timestamp DateTime64(9, 'UTC')
)
ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (id_empresa, project_id, token, timestamp);

CREATE MATERIALIZED VIEW telemetry.mv_logs_tokens
TO telemetry.logs_tokens AS
SELECT
  id_empresa,
  project_id,
  concat(trace_id, '-', span_id) AS log_key,
  arrayJoin(arrayFilter(x -> x != '', splitByRegexp('[^\\p{L}\\p{N}]+', lower(message)))) AS token,
  timestamp
FROM telemetry.logs;