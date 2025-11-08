import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FarmSelection from './components/FarmSelection';
import FarmLayout from './components/FarmLayout';
import Dashboard from './components/Dashboard';
import MinersView from './components/MinersView';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<FarmSelection />} />
            <Route path="/farm/:farmName" element={<FarmLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="miners" element={<MinersView />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;