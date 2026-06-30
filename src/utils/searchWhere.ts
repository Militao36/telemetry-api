export type SearchWhereOperator = 'eq' | 'contains' | 'startsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'exists' | 'notExists';

export interface SearchWhereCondition {
  field: string;
  op: SearchWhereOperator;
  value?: string | number | boolean | Array<string | number | boolean>;
}

export interface SearchWhereGroup {
  and?: SearchWhere[];
  or?: SearchWhere[];
}

export type SearchWhere = SearchWhereCondition | SearchWhereGroup;

export interface BuildSearchWhereResult {
  conditions: string[];
  params: Record<string, any>;
}

type FieldType = 'string' | 'number' | 'datetime';

export interface SearchFieldConfig {
  column: string;
  type: FieldType;
}

const MAX_DEPTH = 3;
const MAX_CONDITIONS = 20;
const MAX_STRING_LENGTH = 500;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function truncateValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim().slice(0, MAX_STRING_LENGTH);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map(truncateValue);
  }

  return value;
}

export function parseSearchWhere(value: unknown): SearchWhere | undefined {
  if (!value) return undefined;

  if (isObject(value)) return value as SearchWhere;

  if (typeof value !== 'string') return undefined;

  try {
    const parsed = JSON.parse(value);
    return isObject(parsed) ? (parsed as SearchWhere) : undefined;
  } catch (_error) {
    return undefined;
  }
}

export function buildSearchWhere(where: SearchWhere | undefined, fields: Record<string, SearchFieldConfig>): BuildSearchWhereResult {
  if (!where) {
    return { conditions: [], params: {} };
  }

  let conditionCount = 0;
  let paramCount = 0;
  const params: Record<string, any> = {};

  const nextParam = (value: unknown) => {
    const param = `where_${paramCount++}`;
    params[param] = truncateValue(value);
    return param;
  };

  const buildNode = (node: SearchWhere, depth: number): string | undefined => {
    if (depth > MAX_DEPTH || !isObject(node)) return undefined;

    if (Array.isArray((node as SearchWhereGroup).and)) {
      const parts = (node as SearchWhereGroup).and!.map((item) => buildNode(item, depth + 1)).filter(Boolean);
      return parts.length ? `(${parts.join(' AND ')})` : undefined;
    }

    if (Array.isArray((node as SearchWhereGroup).or)) {
      const parts = (node as SearchWhereGroup).or!.map((item) => buildNode(item, depth + 1)).filter(Boolean);
      return parts.length ? `(${parts.join(' OR ')})` : undefined;
    }

    if (conditionCount >= MAX_CONDITIONS) return undefined;
    conditionCount += 1;

    return buildCondition(node as unknown as SearchWhereCondition);
  };

  const buildCondition = (condition: SearchWhereCondition): string | undefined => {
    if (!condition || typeof condition.field !== 'string' || typeof condition.op !== 'string') return undefined;

    if (condition.field === 'attributes') {
      return buildRawAttributesCondition(condition);
    }

    if (condition.field.startsWith('attributes.')) {
      return buildOtlpAttributeCondition(condition);
    }

    const config = fields[condition.field];
    if (!config) return undefined;

    return buildColumnCondition(config, condition);
  };

  const buildColumnCondition = (config: SearchFieldConfig, condition: SearchWhereCondition): string | undefined => {
    const value = truncateValue(condition.value);

    if (condition.op === 'exists') {
      return config.type === 'string' ? `${config.column} IS NOT NULL AND ${config.column} != ''` : `${config.column} IS NOT NULL`;
    }

    if (condition.op === 'notExists') {
      return config.type === 'string' ? `(${config.column} IS NULL OR ${config.column} = '')` : `${config.column} IS NULL`;
    }

    if (value === undefined || value === null || value === '') return undefined;

    if (condition.op === 'contains' && config.type === 'string') {
      const param = nextParam(`%${value}%`);
      return `${config.column} ILIKE {${param}:String}`;
    }

    if (condition.op === 'startsWith' && config.type === 'string') {
      const param = nextParam(`${value}%`);
      return `${config.column} ILIKE {${param}:String}`;
    }

    if (condition.op === 'in') {
      const values = Array.isArray(value) ? value : [value];
      if (!values.length) return undefined;

      const param = nextParam(values);
      return `${config.column} IN {${param}:Array(${clickHouseType(config.type)})}`;
    }

    const comparator = getComparator(condition.op);
    if (!comparator) return undefined;

    const param = nextParam(value);

    if (config.type === 'datetime') {
      return `${config.column} ${comparator} parseDateTime64BestEffort({${param}:String})`;
    }

    return `${config.column} ${comparator} {${param}:${clickHouseType(config.type)}}`;
  };

  const buildRawAttributesCondition = (condition: SearchWhereCondition): string | undefined => {
    if (condition.op === 'exists') return `attributes != ''`;
    if (condition.op === 'notExists') return `attributes = ''`;
    if (condition.op !== 'contains' || !condition.value) return undefined;

    const param = nextParam(`%${condition.value}%`);
    return `attributes ILIKE {${param}:String}`;
  };

  const buildOtlpAttributeCondition = (condition: SearchWhereCondition): string | undefined => {
    const attributeKey = condition.field.slice('attributes.'.length).trim();
    if (!attributeKey || attributeKey.length > 128) return undefined;

    const keyParam = nextParam(attributeKey);
    const valueRaw = `JSONExtractRaw(attr, 'value')`;
    const valueExpression = `multiIf(JSONHas(${valueRaw}, 'stringValue'), JSONExtractString(${valueRaw}, 'stringValue'), JSONHas(${valueRaw}, 'intValue'), toString(JSONExtractInt(${valueRaw}, 'intValue')), JSONHas(${valueRaw}, 'doubleValue'), toString(JSONExtractFloat(${valueRaw}, 'doubleValue')), JSONHas(${valueRaw}, 'boolValue'), toString(JSONExtractBool(${valueRaw}, 'boolValue')), '')`;
    const base = `JSONExtractString(attr, 'key') = {${keyParam}:String}`;

    if (condition.op === 'exists') {
      return `arrayExists(attr -> ${base}, JSONExtractArrayRaw(attributes))`;
    }

    if (condition.op === 'notExists') {
      return `NOT arrayExists(attr -> ${base}, JSONExtractArrayRaw(attributes))`;
    }

    if (condition.value === undefined || condition.value === null || condition.value === '') return undefined;

    if (condition.op === 'contains') {
      const valueParam = nextParam(`%${condition.value}%`);
      return `arrayExists(attr -> ${base} AND ${valueExpression} ILIKE {${valueParam}:String}, JSONExtractArrayRaw(attributes))`;
    }

    if (condition.op === 'startsWith') {
      const valueParam = nextParam(`${condition.value}%`);
      return `arrayExists(attr -> ${base} AND ${valueExpression} ILIKE {${valueParam}:String}, JSONExtractArrayRaw(attributes))`;
    }

    if (condition.op === 'in') {
      const values = Array.isArray(condition.value) ? condition.value.map(String) : [String(condition.value)];
      if (!values.length) return undefined;

      const valueParam = nextParam(values);
      return `arrayExists(attr -> ${base} AND ${valueExpression} IN {${valueParam}:Array(String)}, JSONExtractArrayRaw(attributes))`;
    }

    const comparator = getComparator(condition.op);
    if (!comparator) return undefined;

    const valueParam = nextParam(String(condition.value));
    return `arrayExists(attr -> ${base} AND ${valueExpression} ${comparator} {${valueParam}:String}, JSONExtractArrayRaw(attributes))`;
  };

  const condition = buildNode(where, 1);

  return {
    conditions: condition ? [condition] : [],
    params,
  };
}

function getComparator(op: SearchWhereOperator): string | undefined {
  switch (op) {
    case 'eq':
      return '=';
    case 'gt':
      return '>';
    case 'gte':
      return '>=';
    case 'lt':
      return '<';
    case 'lte':
      return '<=';
    default:
      return undefined;
  }
}

function clickHouseType(type: FieldType): string {
  return type === 'number' ? 'Float64' : 'String';
}
