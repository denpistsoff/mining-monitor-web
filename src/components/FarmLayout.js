import React from 'react';
import { useParams, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import Header from './Header';
import Dashboard from './Dashboard';
import MinersView from './MinersView';
import AlertsPanel from './AlertsPanel';

const FarmLayout = () => {
    const { farmName } = useParams();
    const navigate = useNavigate();

    const handleTabChange = (tab) => {
        navigate(`/farm/${farmName}/${tab}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('miningAuth');
        window.location.href = '/';
    };

    // Определяем активную вкладку из URL
    const getActiveTab = () => {
        const path = window.location.pathname;
        if (path.includes('/miners')) return 'miners';
        if (path.includes('/alerts')) return 'alerts';
        return 'dashboard';
    };

    const activeTab = getActiveTab();

    return (
        <div className="farm-layout">
            <Header
                farmName={farmName}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onLogout={handleLogout}
            />

            <main className="main-content">
                <Routes>
                    <Route index element={<Navigate to={`/farm/${farmName}/dashboard`} replace />} />
                    <Route path="dashboard" element={<Dashboard farmNameProp={farmName} />} />
                    <Route path="miners" element={<MinersView farmNameProp={farmName} />} />
                    <Route path="alerts" element={<AlertsPanel farmNameProp={farmName} />} />
                    <Route path="*" element={<Navigate to={`/farm/${farmName}/dashboard`} replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default FarmLayout;