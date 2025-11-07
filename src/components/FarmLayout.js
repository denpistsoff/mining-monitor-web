import React from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import Header from './Header';

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

    return (
        <div className="farm-layout">
            <Header
                activeTab={tab}
                onTabChange={handleTabChange}
                farmName={farmName}
                onLogout={handleLogout}
            />

            <main className="main-content">
                <Outlet context={{ farmName, tab }} />
            </main>
        </div>
    );
};

export default FarmLayout;