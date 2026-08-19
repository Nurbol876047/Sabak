export async function callAnthropic(prompt, options) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Не найден VITE_ANTHROPIC_API_KEY");

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API Error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  return { text, raw: data };
}

export async function callGemini(prompt, options) {
  const apiKeyString = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKeyString) throw new Error("Не найден VITE_GEMINI_API_KEY");

  const keys = apiKeyString.split(',').map(k => k.trim()).filter(Boolean);
  const apiKey = keys[Math.floor(Math.random() * keys.length)];

  const model = options.geminiModel || 'gemini-1.5-flash';
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature || 0.7,
    }
  };

  if (options.requireJSON) {
    body.generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API Error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text, raw: data };
}

export async function callAI(prompt, options = {}) {
  const provider = options.provider || 'anthropic';

  try {
    if (provider === 'gemini') {
      return await callGemini(prompt, options);
    } else {
      return await callAnthropic(prompt, options);
    }
  } catch (err) {
    // Единая точка логирования ошибок AI
    console.error(`AI call failed (${provider}):`, err);
    throw err;
  }
}

export function parseAIJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Пытаемся извлечь JSON, если AI добавил лишний текст
    const objMatch = text.match(/\{[\s\S]*\}/);
    const arrMatch = text.match(/\[[\s\S]*\]/);
    
    if (objMatch && arrMatch) {
      // Возвращаем то, что начинается раньше
      const match = objMatch.index < arrMatch.index ? objMatch[0] : arrMatch[0];
      return JSON.parse(match);
    } else if (objMatch) {
      return JSON.parse(objMatch[0]);
    } else if (arrMatch) {
      return JSON.parse(arrMatch[0]);
    }
    
    throw new Error("Не удалось распарсить JSON из ответа AI");
  }
}
