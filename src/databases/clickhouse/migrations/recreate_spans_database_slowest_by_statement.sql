/*
   Rebuild telemetry.spans_database_slowest to aggregate by normalized query statement.

   IMPORTANT:
   - Stop API/queue ingestion before running this migration.
   - This migration performs a full backfill from telemetry.spans_database and can take a long time
     on large datasets. If needed, run the INSERT backfill manually by day/time ranges instead.
   - Final table/view names remain:
       telemetry.spans_database_slowest
       telemetry.spans_agg_mv
   - The previous aggregate table is kept as telemetry.spans_database_slowest_old.
*/

DROP VIEW IF EXISTS telemetry.spans_agg_mv;
DROP TABLE IF EXISTS telemetry.spans_database_slowest_old;

RENAME TABLE telemetry.spans_database_slowest TO telemetry.spans_database_slowest_old;

CREATE TABLE telemetry.spans_database_slowest
(
    day Date,
    hour DateTime,

    id_empresa LowCardinality(FixedString(36)),
    project_id LowCardinality(FixedString(36)),

    db_table LowCardinality(String),
    normalized_statement String,

    db_statement AggregateFunction(argMax, String, UInt64),
    execution_count AggregateFunction(count),
    sum_duration AggregateFunction(sum, UInt64),
    max_duration AggregateFunction(max, UInt64),

    slowest_trace_id AggregateFunction(argMax, FixedString(32), UInt64),
    slowest_span_id  AggregateFunction(argMax, FixedString(16), UInt64),
    slowest_db_params AggregateFunction(argMax, String, UInt64)
)
ENGINE = AggregatingMergeTree()
PARTITION BY day
ORDER BY (id_empresa, project_id, db_table, normalized_statement, hour)
TTL day + INTERVAL 30 DAY;

/*
   Full backfill.
   For very large datasets, prefer splitting this INSERT by date ranges, for example:

   WHERE db_statement != ''
     AND start_time >= '2026-06-01 00:00:00'
     AND start_time <  '2026-06-02 00:00:00'
*/
INSERT INTO telemetry.spans_database_slowest
(
    day,
    hour,
    id_empresa,
    project_id,
    db_table,
    normalized_statement,
    db_statement,
    execution_count,
    sum_duration,
    max_duration,
    slowest_trace_id,
    slowest_span_id,
    slowest_db_params
)
SELECT
    day,
    hour,

    id_empresa,
    project_id,

    db_table,
    normalized_statement,
    argMaxState(original_db_statement, db_duration) AS db_statement,

    countState() AS execution_count,
    sumState(db_duration) AS sum_duration,
    maxState(db_duration) AS max_duration,

    argMaxState(trace_id, db_duration) AS slowest_trace_id,
    argMaxState(span_id, db_duration) AS slowest_span_id,
    argMaxState(db_params, db_duration) AS slowest_db_params
FROM
(
    SELECT
        toDate(start_time) AS day,
        toDateTime(toStartOfHour(start_time)) AS hour,
        id_empresa,
        project_id,
        db_table,
        db_statement AS original_db_statement,
        lower(trim(replaceRegexpAll(db_statement, '\\s+', ' '))) AS normalized_statement,
        db_duration,
        trace_id,
        span_id,
        db_params
    FROM telemetry.spans_database
    WHERE db_statement != ''
)
GROUP BY
    day,
    hour,
    id_empresa,
    project_id,
    db_table,
    normalized_statement;

CREATE MATERIALIZED VIEW telemetry.spans_agg_mv
TO telemetry.spans_database_slowest
AS SELECT
    day,
    hour,

    id_empresa,
    project_id,

    db_table,
    normalized_statement,
    argMaxState(original_db_statement, db_duration) AS db_statement,

    countState() AS execution_count,
    sumState(db_duration) AS sum_duration,
    maxState(db_duration) AS max_duration,

    argMaxState(trace_id, db_duration) AS slowest_trace_id,
    argMaxState(span_id, db_duration) AS slowest_span_id,
    argMaxState(db_params, db_duration) AS slowest_db_params
FROM
(
    SELECT
        toDate(start_time) AS day,
        toDateTime(toStartOfHour(start_time)) AS hour,
        id_empresa,
        project_id,
        db_table,
        db_statement AS original_db_statement,
        lower(trim(replaceRegexpAll(db_statement, '\\s+', ' '))) AS normalized_statement,
        db_duration,
        trace_id,
        span_id,
        db_params
    FROM telemetry.spans_database
    WHERE db_statement != ''
)
GROUP BY
    day,
    hour,
    id_empresa,
    project_id,
    db_table,
    normalized_statement;
