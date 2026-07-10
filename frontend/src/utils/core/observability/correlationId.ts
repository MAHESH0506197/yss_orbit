// Frontend correlation ID — attaches trace_id and correlation_id to all requests
export const getCorrelationId = () => crypto.randomUUID();

