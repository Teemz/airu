const { mockEmbedding, query } = require('./supabase-vector');

async function chat(message, business_id) {
  if (!message || !business_id) {
    throw new Error('Message and business_id required');
  }

  const queryEmbedding = mockEmbedding(message);
  const matches = await query(queryEmbedding, 5, { business_id: { $eq: Number(business_id) } });

  const contexts = matches.slice(0, 3)
    .map(match => match.metadata?.content || '')
    .filter(c => c)
    .join('\n\n');

  const systemPrompt = `You are a helpful assistant for the business. Answer the user's question using ONLY the following context from the business knowledge base. If the context does not contain relevant information or you cannot answer confidently, respond with: "Извините, у меня нет информации по этому вопросу." Do not make up information.

Context:
${contexts}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referrer': 'https://airu.app'
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'tngtech/deepseek-r1t2-chimera:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenRouter');
  }

  return data.choices[0].message.content.trim();
}

module.exports = { chat };