// src/components/FarmLayout.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Dashboard from './Dashboard';
import MinersView from './MinersView';
import AlertsPanel from './AlertsPanel';
import '../styles/components/FarmLayout.css';

const FarmLayout = ({ currentUser }) => {
    const { farmName } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [unreadAlertsCount, setUnreadAlertsCount] = useState(3);

    useEffect(() => {
        console.log('🏭 FarmLayout mounted for farm:', farmName);

        // Проверяем, есть ли доступ к этой ферме
        if (currentUser && !currentUser.farms.includes(farmName)) {
            console.log('⛔ No access to farm:', farmName);
            navigate('/');
        }
    }, [farmName, currentUser, navigate]);

    const handleTabChange = (tab) => {
        console.log('📌 Tab changed:', tab);
        if (tab === 'alerts') {
            setAlertsOpen(true);
            return;
        }
        setActiveTab(tab);

        // Обновляем URL в зависимости от вкладки
        if (tab === 'dashboard') {
            navigate(`/farm/${farmName}/dashboard`);
        } else if (tab === 'miners') {
            navigate(`/farm/${farmName}/miners`);
        }
    };

    const handleLogout = () => {
        console.log('🚪 Logging out from farm layout');
        // Очищаем данные и перенаправляем
        localStorage.removeItem('miningAuth');
        window.location.href = '/mining-monitor-web/';
    };

    const handleBackToFarms = () => {
        console.log('🔙 Going back to farms');
        navigate('/');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'miners':
                return <MinersView farmNameProp={farmName} />;
            case 'dashboard':
            default:
                return <Dashboard farmNameProp={farmName} />;
        }
    };

    return (
        <div className="farm-layout">
            <Header
                activeTab={activeTab}
                onTabChange={handleTabChange}
                farmName={farmName}
                onLogout={handleLogout}
                onBack={handleBackToFarms}
                unreadAlertsCount={unreadAlertsCount}
            />

            <main className="farm-content">
                {renderContent()}
            </main>

            <AlertsPanel
                farmNameProp={farmName}
                isOpen={alertsOpen}
                onClose={() => setAlertsOpen(false)}
            />
        </div>
    );
};

export default FarmLayout;