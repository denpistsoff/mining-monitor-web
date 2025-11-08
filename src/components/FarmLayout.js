import React, { useState } from 'react';
import { useParams, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import AlertsPanel from './AlertsPanel';
import '../styles/components/FarmLayout.css';

const FarmLayout = () => {
    const { farmName } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [unreadAlertsCount, setUnreadAlertsCount] = useState(3);

    // Определяем активную вкладку на основе текущего пути
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/miners')) return 'miners';
        return 'dashboard';
    };

    const activeTab = getActiveTab();

    const handleTabChange = (tab) => {
        if (tab === 'alerts') {
            setAlertsOpen(true);
            return;
        }

        // Навигация по вкладкам
        if (tab === 'dashboard') {
            navigate(`/farm/${farmName}`);
        } else if (tab === 'miners') {
            navigate(`/farm/${farmName}/miners`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('miningAuth');
        window.location.href = '/';
    };

    if (!farmName) {
        return <div>Ошибка: farmName не определен</div>;
    }

    return (
        <div className="farm-layout">
            <Header
                activeTab={activeTab}
                onTabChange={handleTabChange}
                farmName={farmName}
                onLogout={handleLogout}
                unreadAlertsCount={unreadAlertsCount}
            />

            <main className="farm-content">
                <Outlet context={{ farmNameProp: farmName }} />
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