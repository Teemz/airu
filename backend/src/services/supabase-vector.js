const DIMENSIONS = 1536;

// Function to generate a mock embedding
function mockEmbedding(text) {
  const embedding = new Array(DIMENSIONS).fill(0.1);
  for (let i = 0; i < Math.min(text.length, DIMENSIONS); i++) {
    embedding[i] = (text.charCodeAt(i) / 255.0) * 0.8 + 0.1;
  }
  return embedding;
}

// Function to query vectors from Supabase
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

// Check for Supabase configuration
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Supabase not configured, using mock embeddings');
  module.exports = {
    generateEmbedding: mockEmbedding,
    upsertVectors: async () => {},
    query: async () => []
  };
} else {
  try {
    const { createClient } = require('@supabase/supabase-js');
    // Use the service role key for backend operations
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('Supabase client created successfully with service role.');

    // Function to upsert vectors into Supabase
    async function upsertVectors(vectors) {
        const { error } = await supabase
            .from('vectors')
            .upsert(vectors); // Batch upsert
        if (error) throw error;
    }

    module.exports = {
      supabase,
      generateEmbedding: mockEmbedding, // Exporting the mock for now
      upsertVectors,
      query
    };
  } catch (error) {
    console.error('Failed to load @supabase/supabase-js:', error.message);
    throw error;
  }
}