const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('Supabase not configured, using mock embeddings');
  module.exports = {
    mockEmbedding,
    upsert: async () => {},
    query: async () => []
  };
  return;
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const DIMENSIONS = 1536;

function mockEmbedding(text) {
  const embedding = new Array(DIMENSIONS).fill(0.1);
  for (let i = 0; i < Math.min(text.length, DIMENSIONS); i++) {
    embedding[i] = (text.charCodeAt(i) / 255.0) * 0.8 + 0.1;
  }
  return embedding;
}

async function upsert(vectorId, embedding, metadata) {
  const { error } = await supabase
    .from('vectors')
    .upsert({ id: vectorId, embedding, metadata });
  if (error) throw error;
}

async function query(queryEmbedding, topK = 5, filter = {}) {
  // Игнорируем filter для простоты; можно расширить позже
  const embeddingStr = queryEmbedding.join(',');
  const { data, error } = await supabase
    .from('vectors')
    .select(`id, metadata, (1 - (embedding <=> '[${embeddingStr}]'::vector)) as score`)
    .order(`embedding <=> '[${embeddingStr}]'::vector`, { ascending: true })
    .limit(topK);
  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    score: row.score,
    metadata: row.metadata
  }));
}

module.exports = {
  supabase,
  mockEmbedding,
  upsert,
  query
};