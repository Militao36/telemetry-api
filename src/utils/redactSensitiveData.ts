const REDACTED_VALUE = '[REDACTED]';

const DEFAULT_REDACTION_FIELDS = [
  'password',
  'senha',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'set-cookie',
  'api_key',
  'apikey',
  'secret',
  'card_number',
  'credit_card',
  'cvv',
];

export function redactSensitiveData<T>(value: T, extraFields: string[] = []): T | string {
  const sensitiveFields = buildSensitiveFields(extraFields);

  return redactValue(value, sensitiveFields) as T | string;
}

export function redactJsonString(value: unknown, extraFields: string[] = []): string {
  const sensitiveFields = buildSensitiveFields(extraFields);

  if (typeof value !== 'string') {
    return JSON.stringify(redactValue(value, sensitiveFields));
  }

  try {
    return JSON.stringify(redactValue(JSON.parse(value), sensitiveFields));
  } catch {
    return redactSensitiveText(value, sensitiveFields);
  }
}

export function getDefaultRedactionFields(): string[] {
  return [...DEFAULT_REDACTION_FIELDS];
}

function redactValue(value: unknown, sensitiveFields: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, sensitiveFields));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (isOtelAttribute(value)) {
    return redactOtelAttribute(value, sensitiveFields);
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
      if (sensitiveFields.has(normalizeFieldName(key))) {
        return [key, REDACTED_VALUE];
      }

      return [key, redactValue(entryValue, sensitiveFields)];
    }),
  );
}

function redactOtelAttribute(attribute: Record<string, any>, sensitiveFields: Set<string>): Record<string, any> {
  if (!sensitiveFields.has(normalizeFieldName(attribute.key))) {
    return Object.fromEntries(
      Object.entries(attribute).map(([key, value]) => [key, redactValue(value, sensitiveFields)]),
    );
  }

  return {
    ...attribute,
    value: redactOtelValue(attribute.value),
  };
}

function redactOtelValue(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return REDACTED_VALUE;
  }

  const redactedValue = { ...(value as Record<string, unknown>) };

  for (const key of Object.keys(redactedValue)) {
    redactedValue[key] = REDACTED_VALUE;
  }

  if (!Object.keys(redactedValue).length) {
    redactedValue.stringValue = REDACTED_VALUE;
  }

  return redactedValue;
}

function isOtelAttribute(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && typeof (value as Record<string, unknown>).key === 'string' && 'value' in value;
}

function buildSensitiveFields(extraFields: string[]): Set<string> {
  return new Set([...DEFAULT_REDACTION_FIELDS, ...extraFields].map(normalizeFieldName).filter(Boolean));
}

function normalizeFieldName(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function redactSensitiveText(value: string, sensitiveFields: Set<string>): string {
  let redacted = value;

  for (const field of sensitiveFields) {
    const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(${escapedField}\\s*(?:=|:)\\s*)(["']?)[^\\s,'"&}]+\\2`, 'gi');
    redacted = redacted.replace(pattern, `$1$2${REDACTED_VALUE}$2`);
  }

  return redacted;
}
