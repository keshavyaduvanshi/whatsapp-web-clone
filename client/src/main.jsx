// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/tailwind.css'; // अगर तुमने Tailwind सेट किया है

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
