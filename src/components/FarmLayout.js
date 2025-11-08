import React, { useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import Header from './Header';
import Dashboard from './Dashboard';
import MinersView from './MinersView';
import AlertsPanel from './AlertsPanel';
import '../styles/components/FarmLayout.css';
import MinersView from "./MinersView";

const FarmLayout = () => {
    const { farmName } = useParams();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [unreadAlertsCount, setUnreadAlertsCount] = useState(3); // временно для демо

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleLogout = () => {
        localStorage.removeItem('miningAuth');
        window.location.href = '/';
    };

    const handleAlertsClick = () => {
        setAlertsOpen(true);
    };

    return (
        <div className="farm-layout">
            <Header
                activeTab={activeTab}
                onTabChange={handleTabChange}
                farmName={farmName}
                onLogout={handleLogout}
                unreadAlertsCount={unreadAlertsCount}
                onAlertsClick={handleAlertsClick}
            />

            <main className="farm-content">
                <Routes>
                    <Route path="/" element={<Dashboard farmNameProp={farmName} />} />
                    <Route path="/miners" element={<MinerView farmNameProp={farmName} />} />
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