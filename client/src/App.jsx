import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatList from './pages/ChatList';
import ChatWindow from './pages/ChatWindow';

const App = () => {
  return (
    <Router>
      <div className="text-3xl font-bold text-green-500 text-center">
        WhatsApp Web Clone Running!
      </div>
      <Routes>
        <Route path="/" element={<ChatList />} />
        <Route path="/chat/:wa_id" element={<ChatWindow />} />
      </Routes>
    </Router>
  );
};

export default App;
