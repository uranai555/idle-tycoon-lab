import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DemoPage from './DemoPage';
import LandingPage from './LandingPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/lp" element={<LandingPage />} />
      <Route path="*" element={<DemoPage />} />
    </Routes>
  );
};

export default App;