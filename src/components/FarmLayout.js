import React, { useState } from 'react';
import { Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import Dashboard from './Dashboard';
import MinersView from './MinersView';
import AlertsPanel from './AlertsPanel';
import '../styles/components/FarmLayout.css';

const FarmLayout = () => {
    const { farmName } = useParams();
    const location = useLocation();
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [unreadAlertsCount, setUnreadAlertsCount] = useState(3);

    // Определяем активную вкладку на основе текущего пути
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/miners')) return 'miners';
        if (path.includes('/alerts')) return 'alerts';
        return 'dashboard';
    };

    const [activeTab, setActiveTab] = useState(getActiveTab());

    const handleTabChange = (tab) => {
        setActiveTab(tab);

        if (tab === 'alerts') {
            setAlertsOpen(true);
            return;
        }

        // Навигация по вкладкам
        const basePath = `/farm/${farmName}`;
        if (tab === 'dashboard') {
            window.history.pushState(null, '', basePath);
        } else if (tab === 'miners') {
            window.history.pushState(null, '', `${basePath}/miners`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('miningAuth');
        window.location.href = '/mining-monitor-web';
    };

    // Если farmName не определен, редиректим на главную
    if (!farmName) {
        return <Navigate to="/" replace />;
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
                <Routes>
                    <Route index element={<Dashboard farmNameProp={farmName} />} />
                    <Route path="miners" element={<MinersView farmNameProp={farmName} />} />
                    <Route path="*" element={<Navigate to={`/farm/${farmName}`} replace />} />
                </Routes>
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