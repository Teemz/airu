const { Pinecone } = require('@pinecone-database/pinecone');

if (!process.env.PINECONE_API_KEY) {
  console.log('Pinecone not configured, using mock embeddings');
  module.exports = {
    mockEmbedding,
    upsert: async () => {},
    query: async () => []
  };
  return;
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

const DIMENSIONS = 1536;

function mockEmbedding(text) {
  const embedding = new Array(DIMENSIONS).fill(0.1);
  for (let i = 0; i < Math.min(text.length, DIMENSIONS); i++) {
    embedding[i] = (text.charCodeAt(i) / 255.0) * 0.8 + 0.1;
  }
  return embedding;
}

async function upsert(vectorId, embedding, metadata) {
  await index.upsert([{
    id: vectorId,
    values: embedding,
    metadata
  }]);
}

async function query(queryEmbedding, topK = 5, filter = {}) {
  const results = await index.query({
    vector: queryEmbedding,
    topK,
    filter,
    includeMetadata: true
  });
  return results.matches.map(match => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata
  }));
}

module.exports = {
  index,
  mockEmbedding,
  upsert,
  query
};