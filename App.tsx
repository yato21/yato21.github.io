import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import CreateEvent from './pages/CreateEvent';
import EventPage from './pages/EventPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CreateEvent />} />
        <Route path="/event/:eventId" element={<EventPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;