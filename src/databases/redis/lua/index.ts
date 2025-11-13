export const ADD_SPANS_SCRIPT = `
    local countKey = KEYS[1]
    local spansKey = KEYS[2]
    local limit = tonumber(ARGV[1])
    local newSpans = ARGV[2]
    local spansCount = tonumber(ARGV[3])
    
    -- Adiciona os novos spans à lista existente
    local existingSpans = redis.call('GET', spansKey)
    local allSpans = ""
    
    if existingSpans then
      -- Remove as chaves [ e ] para concatenar arrays JSON
      local existing = string.sub(existingSpans, 2, -2)
      local new = string.sub(newSpans, 2, -2)
      if existing ~= "" and new ~= "" then
        allSpans = "[" .. existing .. "," .. new .. "]"
      elseif existing ~= "" then
        allSpans = "[" .. existing .. "]"
      else
        allSpans = newSpans
      end
    else
      allSpans = newSpans
    end
    
    -- Incrementa o contador
    local currentCount = redis.call('INCRBY', countKey, spansCount)
    
    -- Atualiza os spans
    redis.call('SET', spansKey, allSpans)
    
    -- Verifica se atingiu o limite
    if currentCount >= limit then
      -- Retorna os spans para enviar para a queue
      local spansToQueue = redis.call('GET', spansKey)
      redis.call('DEL', spansKey)
      redis.call('SET', countKey, '0')
      return {1, spansToQueue}
    else
      return {0, ""}
    end
  `;