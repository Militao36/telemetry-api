ALTER TABLE telemetry.spans_database_hourly_summary MODIFY TTL start_time + INTERVAL 30 DAY;
ALTER TABLE telemetry.spans_database_slowest MODIFY TTL day + INTERVAL 30 DAY;
ALTER TABLE telemetry.spans_http_slowest_by_target MODIFY TTL latest_start_time + INTERVAL 30 DAY;
ALTER TABLE telemetry.spans_http_metrics_by_minute MODIFY TTL time_bucket + INTERVAL 30 DAY;
ALTER TABLE telemetry.logs_tokens MODIFY TTL timestamp + INTERVAL 30 DAY;
