import 'dotenv/config';

import { createClient } from '@clickhouse/client';
import { readFile } from 'fs/promises';
import path from 'path';
import { CLICKHOUSE_PASSWORD, CLICKHOUSE_URL, CLICKHOUSE_USER } from '../../env';

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

function splitSqlStatements(sql: string) {
  const statements: string[] = [];
  let current = '';
  let quote: 'single' | 'double' | 'backtick' | null = null;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const previous = sql[index - 1];

    if (!quote && char === "'") {
      quote = 'single';
    } else if (quote === 'single' && char === "'" && previous !== '\\') {
      quote = null;
    } else if (!quote && char === '"') {
      quote = 'double';
    } else if (quote === 'double' && char === '"' && previous !== '\\') {
      quote = null;
    } else if (!quote && char === '`') {
      quote = 'backtick';
    } else if (quote === 'backtick' && char === '`') {
      quote = null;
    }

    if (!quote && char === ';') {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
      continue;
    }

    current += char;
  }

  const lastStatement = current.trim();
  if (lastStatement) statements.push(lastStatement);

  return statements;
}

async function main() {
  const migrationPath = process.argv[2];

  if (!migrationPath) {
    throw new Error('Informe o caminho do arquivo SQL. Ex: npm run clickhouse:migrate -- src/databases/clickhouse/migrations/drop_and_recreate_database.sql');
  }

  if (!CLICKHOUSE_URL) {
    throw new Error('CLICKHOUSE_URL não está configurado no ambiente.');
  }

  const absoluteMigrationPath = path.resolve(process.cwd(), migrationPath);
  const rawSql = await readFile(absoluteMigrationPath, 'utf8');
  const statements = splitSqlStatements(stripSqlComments(rawSql));

  if (!statements.length) {
    throw new Error(`Nenhum statement SQL encontrado em ${migrationPath}.`);
  }

  const client = createClient({
    url: CLICKHOUSE_URL,
    username: CLICKHOUSE_USER,
    password: CLICKHOUSE_PASSWORD,
  });

  try {
    console.log(`Executando migration: ${migrationPath}`);
    console.log(`Statements encontrados: ${statements.length}`);

    for (const [index, statement] of statements.entries()) {
      const statementNumber = index + 1;
      const preview = statement.replace(/\s+/g, ' ').slice(0, 120);

      console.log(`[${statementNumber}/${statements.length}] ${preview}${statement.length > 120 ? '...' : ''}`);

      await client.command({
        query: statement,
        clickhouse_settings: {
          wait_end_of_query: 1,
        },
      });
    }

    console.log('Migration executada com sucesso.');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Falha ao executar migration.');
  console.error(error);
  process.exit(1);
});
