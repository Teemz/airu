import { useState, useEffect } from 'react';
import api from '../utils/api.js';

export default function ProfileTab() {
  const [profile, setProfile] = useState({ business_name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/business/profile')
      .then((res) => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Ошибка загрузки профиля');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/business/profile', profile);
      setEditing(false);
    } catch (err) {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Загрузка профиля...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Профиль бизнеса</h2>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}
      <div className="bg-gray-50 p-6 rounded-xl space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Название компании
          </label>
          <input
            type="text"
            value={profile.business_name || ''}
            onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
            disabled={!editing}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
              editing ? 'border-gray-300' : 'bg-white border-gray-200 cursor-not-allowed'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            disabled={!editing}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
              editing ? 'border-gray-300' : 'bg-white border-gray-200 cursor-not-allowed'
            }`}
          />
        </div>
        <div className="flex space-x-3 pt-4">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl focus:ring-2 focus:ring-green-500 transition disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-3 px-4 rounded-xl focus:ring-2 focus:ring-gray-500 transition"
              >
                Отмена
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
            >
              Редактировать профиль
            </button>
          )}
        </div>
      </div>
    </div>
  );
}