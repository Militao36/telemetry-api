"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADD_ITEM_SCRIPT = void 0;
exports.ADD_ITEM_SCRIPT = `
local countKey = KEYS[1]
local itemKey = KEYS[2]

local limit = tonumber(ARGV[1])
local newItemJson = ARGV[2]
local itemCount = tonumber(ARGV[3])

-- Faz o decode do novo item
local newItem = cjson.decode(newItemJson)

-- Tenta ler o item existente
local existingItemJson = redis.call("GET", itemKey)
local allItems = {}

if existingItemJson then
    local existingItem = cjson.decode(existingItemJson)

    existingItem.spans_http = existingItem.spans_http or {}
    existingItem.spans_database = existingItem.spans_database or {}

    newItem.spans_http = newItem.spans_http or {}
    newItem.spans_database = newItem.spans_database or {}

    for i = 1, #newItem.spans_http do
        table.insert(existingItem.spans_http, newItem.spans_http[i])
    end

    for i = 1, #newItem.spans_database do
        table.insert(existingItem.spans_database, newItem.spans_database[i])
    end

    allItems = existingItem
else
    allItems = newItem
end

-- Incrementa contador
local currentCount = redis.call("INCRBY", countKey, itemCount)

-- Salva os itens atualizados
redis.call("SET", itemKey, cjson.encode(allItems))

-- Verifica se atingiu o limite
if currentCount >= limit then
    local itemsToQueue = redis.call("GET", itemKey)

    redis.call("DEL", itemKey)
    redis.call("SET", countKey, "0")

    return {1, itemsToQueue}
end

return {0, ""}
`;
