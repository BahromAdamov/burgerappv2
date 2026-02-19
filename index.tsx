
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Глобальный перехватчик для отладки в Telegram
window.onerror = function(message, source, lineno, colno, error) {
  const errorMsg = `Error: ${message} at ${source}:${lineno}:${colno}`;
  console.error(errorMsg);
  // В режиме разработки можно выводить alert, если нужно поймать на телефоне
  // alert(errorMsg);
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
