import React, { useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import Header from './Header';
import Dashboard from './Dashboard';
import MinersView from './MinersView';
import AlertsPanel from './AlertsPanel';
import '../styles/components/FarmLayout.css';

const FarmLayout = () => {
    const { farmName } = useParams();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [unreadAlertsCount, setUnreadAlertsCount] = useState(3); // временно для демо

    const handleTabChange = (tab) => {
        setActiveTab(tab);

        // Навигация по вкладкам
        if (tab === 'dashboard') {
            window.history.pushState(null, '', `/farm/${farmName}`);
        } else if (tab === 'miners') {
            window.history.pushState(null, '', `/farm/${farmName}/miners`);
        } else if (tab === 'alerts') {
            setAlertsOpen(true);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('miningAuth');
        window.location.href = '/';
    };

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
                    <Route path="miners" element={<MinerView farmNameProp={farmName} />} />
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