import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext();

// Action types
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  SET_SACCO_DATA: 'SET_SACCO_DATA',
  SET_USER_STATS: 'SET_USER_STATS'
};

// Initial state
const initialState = {
  loading: false,
  error: null,
  success: null,
  saccoData: null,
  userStats: null,
  notifications: []
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case ACTION_TYPES.SET_SUCCESS:
      return {
        ...state,
        success: action.payload,
        loading: false
      };

    case ACTION_TYPES.CLEAR_NOTIFICATION:
      return {
        ...state,
        error: null,
        success: null
      };

    case ACTION_TYPES.SET_SACCO_DATA:
      return {
        ...state,
        saccoData: action.payload
      };

    case ACTION_TYPES.SET_USER_STATS:
      return {
        ...state,
        userStats: action.payload
      };

    default:
      return state;
  }
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  // Actions
  const setLoading = (loading) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error });
  };

  const setSuccess = (success) => {
    dispatch({ type: ACTION_TYPES.SET_SUCCESS, payload: success });
  };

  const clearNotification = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_NOTIFICATION });
  };

  const setSaccoData = (data) => {
    dispatch({ type: ACTION_TYPES.SET_SACCO_DATA, payload: data });
  };

  const setUserStats = (stats) => {
    dispatch({ type: ACTION_TYPES.SET_USER_STATS, payload: stats });
  };

  // Auto-clear notifications after 5 seconds
  useEffect(() => {
    if (state.error || state.success) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.error, state.success]);

  // Clear notifications when user changes
  useEffect(() => {
    clearNotification();
  }, [user]);

  const value = {
    ...state,
    setLoading,
    setError,
    setSuccess,
    clearNotification,
    setSaccoData,
    setUserStats
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};