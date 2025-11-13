export const ADD_ITEM_SCRIPT = `
    local countKey = KEYS[1]
    local itemKey = KEYS[2]
    local limit = tonumber(ARGV[1])
    local newItem = ARGV[2]
    local itemCount = tonumber(ARGV[3])
    
    -- Adiciona os novos item à lista existente
    local existingItem = redis.call('GET', itemKey)
    local allItem = ""
    
    if existingItem then
      -- Remove as chaves [ e ] para concatenar arrays JSON
      local existing = string.sub(existingItem, 2, -2)
      local new = string.sub(newItem, 2, -2)
      if existing ~= "" and new ~= "" then
        allItem = "[" .. existing .. "," .. new .. "]"
      elseif existing ~= "" then
        allItem = "[" .. existing .. "]"
      else
        allItem = newItem
      end
    else
      allItem = newItem
    end
    
    -- Incrementa o contador
    local currentCount = redis.call('INCRBY', countKey, itemCount)
    
    -- Atualiza os item
    redis.call('SET', itemKey, allItem)
    
    -- Verifica se atingiu o limite
    if currentCount >= limit then
      -- Retorna os item para enviar para a queue
      local itemToQueue = redis.call('GET', itemKey)
      redis.call('DEL', itemKey)
      redis.call('SET', countKey, '0')
      return {1, itemToQueue}
    else
      return {0, ""}
    end
`;
