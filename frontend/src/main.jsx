import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SoundProvider } from './context/SoundContext';
import { ModalProvider } from './context/ModalContext';
import { SocketProvider } from './context/SocketContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <SoundProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </SoundProvider>
      </SocketProvider>
    </BrowserRouter>
  </StrictMode>
);