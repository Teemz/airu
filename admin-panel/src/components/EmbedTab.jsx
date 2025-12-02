import { useState, useEffect } from 'react';
import api from '../utils/api.js';

export default function EmbedTab() {
  const [embedCode, setEmbedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/embed-code')
      .then((res) => {
        setEmbedCode(res.data.code || res.data.embedCode || '');
        setLoading(false);
      })
      .catch(() => {
        setEmbedCode('// Ошибка загрузки embed кода');
        setLoading(false);
      });
  }, []);

  const copyToClipboard = async () => {
    if (navigator.clipboard && embedCode) {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Загрузка embed кода...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Генератор embed кода</h2>
      <div className="bg-gray-50 p-6 rounded-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Вставьте этот код на ваш сайт</p>
            <p className="text-xs text-gray-500">Чат-виджет появится на странице</p>
          </div>
          <button
            onClick={copyToClipboard}
            disabled={!embedCode || copied === 'loading'}
            className={`px-6 py-2 rounded-xl font-medium transition ${
              copied
                ? 'bg-green-600 text-white'
                : embedCode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {copied ? 'Скопировано!' : 'Копировать код'}
          </button>
        </div>
        <pre className="bg-white p-6 rounded-xl border font-mono text-sm overflow-auto select-all">
          {embedCode || '// Embed код не готов'}
        </pre>
      </div>
    </div>
  );
}