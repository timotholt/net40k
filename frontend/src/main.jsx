import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import { SoundProvider } from './context/SoundContext';
import { ModalProvider } from './context/ModalContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <SoundProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </SoundProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);