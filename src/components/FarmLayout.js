import React from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import Header from './Header';
import Dashboard from './Dashboard';
import MinersView from './MinersView';
import AlertsPanel from './AlertsPanel';
import '../styles/components/FarmLayout.css';

const FarmLayout = ({ tab = 'dashboard' }) => {
    const { farmName } = useParams();
    const navigate = useNavigate();

    const handleTabChange = (newTab) => {
        navigate(`/farm/${farmName}/${newTab}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('miningAuth');
        window.location.href = '/';
    };

    const renderContent = () => {
        switch (tab) {
            case 'dashboard':
                return <Dashboard farmName={farmName} />;
            case 'miners':
                return <MinersView farmName={farmName} />;
            case 'alerts':
                return <AlertsPanel farmName={farmName} />;
            default:
                return <Dashboard farmName={farmName} />;
        }
    };

    return (
        <div className="farm-layout">
            <Header
                activeTab={tab}
                onTabChange={handleTabChange}
                farmName={farmName}
                onLogout={handleLogout}
            />

            <main className="main-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default FarmLayout;