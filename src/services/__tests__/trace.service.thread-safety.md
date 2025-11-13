# TracesService - Thread Safety Solution

## Problema Original

O método `create` da `TracesService` tinha race conditions quando executado em múltiplas threads:

1. **Race Condition**: Entre `incr(redisKey)` e `get(trace_spans:empresa)`, outra thread podia modificar os dados
2. **Operações não atômicas**: Leitura, verificação e escrita não eram atômicas
3. **Perda de dados**: Spans podiam ser perdidos em execução simultânea
4. **Contagem inconsistente**: Contador desincronizado com spans armazenados

## Solução Implementada

### Lua Script Atômico

Implementamos um script Lua que executa todas as operações atomicamente no Redis:

```lua
local countKey = KEYS[1]     -- trace_count:empresa
local spansKey = KEYS[2]     -- trace_spans:empresa  
local limit = tonumber(ARGV[1])      -- LIMIT_SPANS_QUEUE
local newSpans = ARGV[2]             -- JSON dos novos spans
local spansCount = tonumber(ARGV[3]) -- quantidade de spans

-- Operações atômicas:
-- 1. Concatena spans existentes com novos
-- 2. Incrementa contador
-- 3. Verifica limite
-- 4. Se atingiu limite: retorna spans e reseta
-- 5. Caso contrário: continua acumulando
```

### Benefícios

- ✅ **Thread-safe**: Todas as operações são atômicas
- ✅ **Sem race conditions**: Script Lua executa como transação
- ✅ **Sem perda de dados**: Operações garantidas
- ✅ **Performance**: Uma única chamada ao Redis por operação

### Como Testar Multi-threading

```bash
# Com PM2 (4 instâncias)
pm2 start src/server.ts --instances 4

# Com cluster nativo do Node.js
node -e "
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < 4; i++) {
    cluster.fork();
  }
} else {
  require('./dist/server.js');
}
"
```

### Monitoramento

Use o método `getStats()` para monitorar:

```typescript
const stats = await tracesService.getStats('empresa123');
console.log('Count:', stats.count, 'Buffer:', stats.spansInBuffer);
```