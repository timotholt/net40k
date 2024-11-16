import { createContext, useContext, useReducer, useCallback } from 'react';
import { createPortal } from 'react-dom';

const ModalContext = createContext(null);

// Modal types
export const MODAL_TYPES = {
  GAME_CREATE: 'GAME_CREATE',
  PASSWORD_PROMPT: 'PASSWORD_PROMPT',
  SETTINGS: 'SETTINGS',
  ALERT: 'ALERT',
  CONFIRM: 'CONFIRM'
};

// Action types
const ACTIONS = {
  OPEN: 'OPEN_MODAL',
  CLOSE: 'CLOSE_MODAL',
  CLOSE_ALL: 'CLOSE_ALL_MODALS'
};

// Initial state
const initialState = {
  modals: [] // Stack of active modals
};

// Reducer
function modalReducer(state, action) {
  switch (action.type) {
    case ACTIONS.OPEN:
      return {
        ...state,
        modals: [...state.modals, action.payload]
      };
    case ACTIONS.CLOSE:
      return {
        ...state,
        modals: state.modals.filter(modal => modal.id !== action.payload)
      };
    case ACTIONS.CLOSE_ALL:
      return {
        ...state,
        modals: []
      };
    default:
      return state;
  }
}

export function ModalProvider({ children }) {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const openModal = useCallback((modalType, props = {}) => {
    const id = Date.now().toString();
    dispatch({
      type: ACTIONS.OPEN,
      payload: { id, type: modalType, props }
    });
    return id;
  }, []);

  const closeModal = useCallback((modalId) => {
    dispatch({ type: ACTIONS.CLOSE, payload: modalId });
  }, []);

  const closeAllModals = useCallback(() => {
    dispatch({ type: ACTIONS.CLOSE_ALL });
  }, []);

  return (
    <ModalContext.Provider value={{ 
      modals: state.modals,
      openModal,
      closeModal,
      closeAllModals
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}