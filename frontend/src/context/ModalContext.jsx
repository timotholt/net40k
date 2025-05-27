import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

// Define modal actions
export const MODAL_TYPES = {
  CUSTOM: 'CUSTOM',
  ALERT: 'ALERT',
  CONFIRM: 'CONFIRM',
  SETTINGS: 'SETTINGS'
};

const ACTIONS = {
  OPEN: 'OPEN',
  CLOSE: 'CLOSE',
  CLOSE_ALL: 'CLOSE_ALL'
};

// Initial state
const initialState = {
  modals: []
};

// Modal reducer with more robust state management
function modalReducer(state, action) {
  console.log('MODALCONTEXT: State Change', {
    action: action.type,
    payload: action.payload
  });

  switch (action.type) {
    case ACTIONS.OPEN:
      // For SETTINGS modal, always allow opening a new one
      if (action.payload.type === MODAL_TYPES.SETTINGS) {
        // Close any existing SETTINGS modal
        const otherModals = state.modals.filter(modal => modal.type !== MODAL_TYPES.SETTINGS);
        return {
          ...state,
          modals: [...otherModals, {
            id: action.payload.id || `${Date.now()}`,
            type: action.payload.type,
            props: action.payload.props || {}
          }]
        };
      }
      
      // For other modals, prevent exact duplicates
      const isDuplicate = state.modals.some(
        modal => modal.type === action.payload.type && 
                 JSON.stringify(modal.props) === JSON.stringify(action.payload.props)
      );

      if (isDuplicate) {
        console.warn('MODALCONTEXT: Prevented duplicate modal');
        return state;
      }

      return {
        ...state,
        modals: [...state.modals, {
          id: action.payload.id || `${Date.now()}`,
          type: action.payload.type,
          props: action.payload.props || {}
        }]
      };

    case ACTIONS.CLOSE:
      // If no specific modal ID is provided, close the last modal
      const modalIdToClose = action.payload || 
        (state.modals.length > 0 ? state.modals[state.modals.length - 1].id : null);

      console.log('MODALCONTEXT: Closing modal', { 
        modalId: modalIdToClose,
        currentModals: state.modals.map(m => m.id)
      });

      return {
        ...state,
        modals: modalIdToClose 
          ? state.modals.filter(modal => modal.id !== modalIdToClose)
          : state.modals
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

// Create context
const ModalContext = createContext();

// Modal Provider Component
export function ModalProvider({ children }) {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  // Open modal with unique ID and type checking
  const openModal = useCallback((modalType, modalProps = {}) => {
    const modalId = `${Date.now()}`;
    
    console.log('MODALCONTEXT: openModal CALLED', { 
      modalType, 
      modalId,
      propsKeys: Object.keys(modalProps),
      currentModalCount: state.modals.length
    });

    dispatch({
      type: ACTIONS.OPEN,
      payload: {
        id: modalId,
        type: modalType,
        props: modalProps
      }
    });

    return modalId;
  }, [state.modals.length]);

  // Close modal with more detailed logging
  const closeModal = useCallback((modalId) => {
    console.log('MODALCONTEXT: closeModal CALLED', { 
      modalId, 
      currentModals: state.modals.map(m => m.id),
      currentModalsCount: state.modals.length
    });

    dispatch({ 
      type: ACTIONS.CLOSE, 
      payload: modalId 
    });
  }, [state.modals]);

  // Close all modals
  const closeAllModals = useCallback(() => {
    console.log('MODALCONTEXT: Closing all modals');
    dispatch({ type: ACTIONS.CLOSE_ALL });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    modals: state.modals,
    openModal,
    closeModal,
    closeAllModals
  }), [state.modals, openModal, closeModal, closeAllModals]);

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
}

// Custom hook to use modal context
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// PropTypes for type checking
ModalProvider.propTypes = {
  children: PropTypes.node.isRequired
};