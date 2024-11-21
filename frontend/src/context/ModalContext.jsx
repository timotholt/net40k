import { createContext, useContext, useReducer, useCallback } from 'react';

// Define modal types
export const MODAL_TYPES = {
  ALERT: 'ALERT',
  CONFIRM: 'CONFIRM',
  INPUT: 'INPUT',
  CUSTOM: 'CUSTOM'
};

// Define action types
const ACTIONS = {
  OPEN: 'OPEN',
  CLOSE: 'CLOSE',
  CLOSE_ALL: 'CLOSE_ALL'
};

// Initial state
const initialState = {
  modals: []
};

// Reducer
function modalReducer(state, action) {
  switch (action.type) {
    case ACTIONS.OPEN:
      return {
        ...state,
        modals: [...state.modals, { 
          id: action.payload.id, 
          type: action.payload.type, 
          props: action.payload.props 
        }]
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

const ModalContext = createContext(null);

function ModalProvider({ children }) {
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

function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}

export { ModalProvider, useModal };