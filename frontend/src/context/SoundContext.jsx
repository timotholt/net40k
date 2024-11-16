import { createContext, useContext } from 'react';
import { soundManager } from '../services/SoundManager';
import { howlerImplementation } from '../services/HowlerSoundImplementation';

const SoundContext = createContext(null);

export function SoundProvider({ children }) {
  // Initialize once during provider creation
  if (!soundManager.implementation) {
    soundManager.implementation = howlerImplementation;
    soundManager.initialize();
  }

  return (
    <SoundContext.Provider value={soundManager}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}