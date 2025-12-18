const axios = require('axios');

const CHROMA_URL = process.env.CHROMA_URL || 'http://chroma:8000';

class ChromaService {
  constructor() {
    this.client = axios.create({
      baseURL: CHROMA_URL,
      timeout: 10000,
    });
  }

  // Создание коллекции для бизнеса
  async createCollection(collectionName) {
    try {
      const response = await this.client.post('/api/v1/collections', {
        name: collectionName,
        get_or_create: true,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        // Fallback for older versions that don't support get_or_create
        return null;
      }
      console.error('Error in createCollection:', error.response?.data || error.message);
      throw error;
    }
  }

  // Добавление документа в коллекцию
  async addDocument(collectionName, document, metadata = {}, id = null) {
    try {
      const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.client.post(`/api/v1/collections/${collectionName}/add`, {
        documents: [document],
        metadatas: [metadata],
        ids: [docId],
      });

      return docId;
    } catch (error) {
      console.error('Error adding document to Chroma:', error);
      throw error;
    }
  }

  // Поиск документов в коллекции
  async queryCollection(collectionName, queryText, nResults = 5) {
    try {
      const response = await this.client.post(`/api/v1/collections/${collectionName}/query`, {
        query_texts: [queryText],
        n_results: nResults,
      });

      return response.data;
    } catch (error) {
      console.error('Error querying Chroma:', error);
      throw error;
    }
  }

  // Удаление документа из коллекции
  async deleteDocument(collectionName, docId) {
    try {
      await this.client.post(`/api/v1/collections/${collectionName}/delete`, {
        ids: [docId],
      });
    } catch (error) {
      console.error('Error deleting document from Chroma:', error);
      throw error;
    }
  }

  // Получение коллекции
  async getCollection(collectionName) {
    try {
      const response = await this.client.get(`/api/v1/collections/${collectionName}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

const chromaService = new ChromaService();

module.exports = {
  chromaService,
  createCollection: (name) => chromaService.createCollection(name),
  addDocument: (collection, doc, meta, id) => chromaService.addDocument(collection, doc, meta, id),
  queryCollection: (collection, query, n) => chromaService.queryCollection(collection, query, n),
  deleteDocument: (collection, id) => chromaService.deleteDocument(collection, id),
  getCollection: (name) => chromaService.getCollection(name),
};