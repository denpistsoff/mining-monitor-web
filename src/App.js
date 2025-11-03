import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AlertsPanel from './components/AlertsPanel';
import './styles/dark-theme.css';
import './App.css';

function App() {
  const [farmName, setFarmName] = useState('main-farm');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.tgApp?.isTelegram) {
      const user = window.tgApp.getUser();
      if (user?.username) {
        setFarmName(user.username);
      }
      
      // Настройка кнопки обновления
      window.tgApp.setupMainButton('🔄 Обновить', () => {
        window.location.reload();
      });
    }

    // Установка заголовка
    document.title = 'Mining Monitor 🏭';
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard farmName={farmName} />;
      case 'alerts':
        return <AlertsPanel farmName={farmName} />;
      default:
        return <Dashboard farmName={farmName} />;
    }
  };

  return (
    <div className="app">
      <Header 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        farmName={farmName}
      />
      
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Глобальные уведомления */}
      <AlertsPanel farmName={farmName} />
    </div>
  );
}

export default App;