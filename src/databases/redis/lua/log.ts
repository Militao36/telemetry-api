export const ADD_LOG_SCRIPT = `
local countKey = KEYS[1]
local itemKey = KEYS[2]

local limit = tonumber(ARGV[1])
local newItemsJson = ARGV[2]
local itemCount = tonumber(ARGV[3])

-- Decodifica os novos itens (que é um array de logs)
local newItems = cjson.decode(newItemsJson)

-- Obtém os itens existentes
local existingItemsJson = redis.call("GET", itemKey)
local allItems = {}

if existingItemsJson then
    -- Se os itens existem, decodifica e anexa os novos itens
    local existingItems = cjson.decode(existingItemsJson)
    for i = 1, #newItems do
        table.insert(existingItems, newItems[i])
    end
    allItems = existingItems
else
    -- Caso contrário, os novos itens são todos os itens
    allItems = newItems
end

-- Incrementa a contagem total
local currentCount = redis.call("INCRBY", countKey, itemCount)

-- Salva a lista mesclada de volta no Redis
redis.call("SET", itemKey, cjson.encode(allItems))

-- Verifica se o limite foi atingido
if currentCount >= limit then
    -- Obtém os itens a serem enfileirados
    local itemsToQueue = redis.call("GET", itemKey)

    -- Reseta a contagem e exclui a lista de itens
    redis.call("DEL", itemKey)
    redis.call("SET", countKey, "0")

    -- Retorna 1 para indicar que o enfileiramento é necessário, e os próprios itens
    return {1, itemsToQueue}
end

-- Retorna 0 se o limite não foi atingido
return {0, ""}
`;
