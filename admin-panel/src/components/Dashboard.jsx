import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import ProfileTab from './ProfileTab.jsx';
import KnowledgeTab from './KnowledgeTab.jsx';
import EmbedTab from './EmbedTab.jsx';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const { logout, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Панель администратора</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Привет, {user?.business_name || user?.email || 'Админ'}</span>
              <button 
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Профиль
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'knowledge'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Знания
              </button>
              <button
                onClick={() => setActiveTab('embed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'embed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Embed код
              </button>
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'knowledge' && <KnowledgeTab />}
            {activeTab === 'embed' && <EmbedTab />}
          </div>
        </div>
      </div>
    </div>
  );
}