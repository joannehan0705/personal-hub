(function() {
/**
 * Personal Hub — 全局状态管理
 * 使用 React Context + useReducer
 */

const { createContext, useContext, useReducer, useEffect, useCallback } = React;

// ===== 初始状态 =====
const initialState = {
  // 路由
  route: { path: '/', params: {} },

  // 主题
  theme: localStorage.getItem('ph_theme') || 'auto',

  // 设置
  haptics: localStorage.getItem('ph_haptics') !== 'false',

  // 首页数据
  homeData: {
    todayTodos: [],
    upcomingReminders: [],
    unpurchasedShopping: [],
    todayTransactions: [],
    alexToday: [],
    petReminders: [],
    recentOrders: [],
  },

  // 当前选中状态
  activePet: localStorage.getItem('ph_active_pet') || 'cookie',
  alexCategory: localStorage.getItem('ph_alex_category') || 'school',
  financeMonth: localStorage.getItem('ph_finance_month') || DateUtils.currentMonth(),
  allowanceMonth: localStorage.getItem('ph_allowance_month') || DateUtils.currentMonth(),

  // UI 状态
  quickAddOpen: false,

  // 数据版本（数据变更后递增，触发刷新）
  dataVersion: 0,

  // 首页折叠状态
  homeCollapsed: JSON.parse(localStorage.getItem('ph_home_collapsed') || '{}'),

  // Toast 消息
  toast: null,
};

// ===== Actions =====
const ACTIONS = {
  NAVIGATE: 'NAVIGATE',
  SET_THEME: 'SET_THEME',
  SET_HAPTICS: 'SET_HAPTICS',
  SET_ACTIVE_PET: 'SET_ACTIVE_PET',
  SET_ALEX_CATEGORY: 'SET_ALEX_CATEGORY',
  SET_FINANCE_MONTH: 'SET_FINANCE_MONTH',
  SET_ALLOWANCE_MONTH: 'SET_ALLOWANCE_MONTH',
  OPEN_QUICK_ADD: 'OPEN_QUICK_ADD',
  CLOSE_QUICK_ADD: 'CLOSE_QUICK_ADD',
  UPDATE_HOME_DATA: 'UPDATE_HOME_DATA',
  INCREMENT_DATA_VERSION: 'INCREMENT_DATA_VERSION',
  TOGGLE_HOME_SECTION: 'TOGGLE_HOME_SECTION',
  SHOW_TOAST: 'SHOW_TOAST',
  CLEAR_TOAST: 'CLEAR_TOAST',
};

// ===== Reducer =====
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.NAVIGATE:
      return { ...state, route: action.payload };

    case ACTIONS.SET_THEME:
      localStorage.setItem('ph_theme', action.payload);
      applyTheme(action.payload);
      return { ...state, theme: action.payload };

    case ACTIONS.SET_HAPTICS:
      localStorage.setItem('ph_haptics', String(action.payload));
      Haptics.setEnabled(action.payload);
      return { ...state, haptics: action.payload };

    case ACTIONS.SET_ACTIVE_PET:
      localStorage.setItem('ph_active_pet', action.payload);
      return { ...state, activePet: action.payload };

    case ACTIONS.SET_ALEX_CATEGORY:
      localStorage.setItem('ph_alex_category', action.payload);
      return { ...state, alexCategory: action.payload };

    case ACTIONS.SET_FINANCE_MONTH:
      localStorage.setItem('ph_finance_month', action.payload);
      return { ...state, financeMonth: action.payload };

    case ACTIONS.SET_ALLOWANCE_MONTH:
      localStorage.setItem('ph_allowance_month', action.payload);
      return { ...state, allowanceMonth: action.payload };

    case ACTIONS.OPEN_QUICK_ADD:
      return { ...state, quickAddOpen: true };

    case ACTIONS.CLOSE_QUICK_ADD:
      return { ...state, quickAddOpen: false };

    case ACTIONS.UPDATE_HOME_DATA:
      return { ...state, homeData: action.payload };

    case ACTIONS.INCREMENT_DATA_VERSION:
      return { ...state, dataVersion: state.dataVersion + 1 };

    case ACTIONS.TOGGLE_HOME_SECTION: {
      const collapsed = { ...state.homeCollapsed };
      collapsed[action.payload] = !collapsed[action.payload];
      localStorage.setItem('ph_home_collapsed', JSON.stringify(collapsed));
      return { ...state, homeCollapsed: collapsed };
    }

    case ACTIONS.SHOW_TOAST:
      return { ...state, toast: action.payload };

    case ACTIONS.CLEAR_TOAST:
      return { ...state, toast: null };

    default:
      return state;
  }
}

// ===== 主题应用 =====
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
}

// 初始应用主题
applyTheme(initialState.theme);
Haptics.setEnabled(initialState.haptics);

// ===== Context =====
const AppContext = createContext(null);

// ===== Provider =====
function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 路由监听
  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.slice(1) || '/';
      dispatch({ type: ACTIONS.NAVIGATE, payload: { path: hash, params: {} } });
    };
    handler();
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // 便捷方法
  const navigate = useCallback((path) => {
    window.location.hash = path;
  }, []);

  const refreshData = useCallback(() => {
    dispatch({ type: ACTIONS.INCREMENT_DATA_VERSION });
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    dispatch({ type: ACTIONS.SHOW_TOAST, payload: { message, type } });
    setTimeout(() => dispatch({ type: ACTIONS.CLEAR_TOAST }), 2500);
  }, []);

  const value = {
    ...state,
    dispatch,
    navigate,
    refreshData,
    showToast,
    ACTIONS,
  };

  return React.createElement(AppContext.Provider, { value }, children);
}

// ===== Hook =====
function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

window.AppContext = AppContext;
window.AppProvider = AppProvider;
window.useApp = useApp;

})();
