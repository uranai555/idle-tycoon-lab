import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DemoPage from './DemoPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/demo" element={<DemoPage />} />
      <Route path="*" element={<DemoPage />} />
    </Routes>
  );
};

export default App;