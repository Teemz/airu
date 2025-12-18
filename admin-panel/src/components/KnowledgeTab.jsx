import { useState, useEffect } from 'react';
import api from '../utils/api.js';

export default function KnowledgeTab() {
  const [knowledge, setKnowledge] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = () => {
    api.get('/business/knowledge')
      .then((res) => {
        setKnowledge(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Ошибка сервера');
        setLoading(false);
      });
  };

  const handleUpload = async () => {
   if (!text.trim()) return;
   setUploading(true);
   setError('');
   try {
     const response = await api.post('/business/knowledge', { content: text.trim() });
     setText('');
     // Add the new knowledge to the state without reloading
     setKnowledge(prev => [response.data, ...prev]);
   } catch (err) {
     setError('Ошибка сервера');
   } finally {
     setUploading(false);
   }
 };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Загрузка знаний...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Загрузка знания</h2>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}
        <div className="flex gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Введите текст знания..."
            rows={4}
            className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical transition"
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !text.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-10 px-6 rounded-xl focus:ring-2 focus:ring-green-500 transition whitespace-nowrap"
          >
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">Список знаний ({knowledge.length})</h3>
        {knowledge.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
            Нет загруженных знаний
          </div>
        ) : (
          <div className="grid gap-4">
            {knowledge.map((item) => (
              <div key={item.knowledge_id} className="bg-white p-6 rounded-xl border shadow-sm">
                <p className="text-gray-900 mb-2 whitespace-pre-wrap">{item.knowledge_title || item.content}</p>
                <p className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}