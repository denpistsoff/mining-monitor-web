import React, { useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import Header from './Header';
import AlertsPanel from './AlertsPanel';
import '../styles/components/FarmLayout.css';

const FarmLayout = () => {
    const { farmName } = useParams();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [unreadAlertsCount, setUnreadAlertsCount] = useState(3);

    const handleTabChange = (tab) => {
        if (tab === 'alerts') {
            setAlertsOpen(true);
            return;
        }
        setActiveTab(tab);
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