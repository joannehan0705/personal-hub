(function() {
/**
 * Personal Hub — 主应用入口
 * 根组件 + 路由系统 + 全局布局
 */

const { createElement: h, useState, useEffect } = React;

// ===== 路由表 =====
const ROUTES = [
  { pattern: /^\/$/,                        component: () => HomePage,     tab: 'home' },
  { pattern: /^\/todo/,                     component: () => TodoPage,     tab: 'home' },
  { pattern: /^\/shopping/,                 component: () => ShoppingPage, tab: 'home' },
  { pattern: /^\/finance/,                  component: () => FinancePage,  tab: 'finance' },
  { pattern: /^\/alex/,                     component: () => AlexPage,     tab: 'alex' },
  { pattern: /^\/pets/,                     component: () => PetsPage,     tab: 'home' },
  { pattern: /^\/life\/recipes/,            component: () => LifeRecipesPage, tab: null },
  { pattern: /^\/notes/,                    component: () => NotesPage,    tab: null },
  { pattern: /^\/wishlist/,                 component: () => WishlistPage, tab: null },
  { pattern: /^\/puff\/orders/,             component: () => OrdersPage,   tab: 'puff' },
  { pattern: /^\/puff\/products/,           component: () => ProductsPage, tab: 'puff' },
  { pattern: /^\/puff\/customers/,          component: () => CustomersPage,tab: 'puff' },
  { pattern: /^\/puff\/recipes/,            component: () => RecipesPage,  tab: 'puff' },
  { pattern: /^\/puff\/pickup-points/,      component: () => PickupPointsPage, tab: 'puff' },
  { pattern: /^\/puff\/inventory/,          component: () => InventoryPage,tab: 'puff' },
  { pattern: /^\/puff\/social/,             component: () => SocialPage,   tab: 'puff' },
  { pattern: /^\/puff\/finance/,            component: () => PuffFinancePage, tab: 'puff' },
  { pattern: /^\/puff\/menus/,              component: () => MenuPage,     tab: 'puff' },
  { pattern: /^\/puff$/,                    component: () => PuffPage,     tab: 'puff' },
  { pattern: /^\/settings\/search/,         component: () => SearchPage,   tab: null },
  { pattern: /^\/settings\/data/,           component: () => DataManagement, tab: null },
  { pattern: /^\/settings\/icon/,           component: () => IconCustomizePage, tab: null },
  { pattern: /^\/settings\/about/,          component: () => AboutPage,    tab: null },
  { pattern: /^\/settings$/,                component: () => SettingsPage, tab: null },
];

// ===== 路由匹配 =====
function matchRoute(path) {
  for (const route of ROUTES) {
    if (route.pattern.test(path)) {
      return route;
    }
  }
  // 默认回首页
  return ROUTES[0];
}

// ===== Toast 组件 =====
function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  const colors = {
    info: 'var(--color-text-primary)',
    success: 'var(--color-complete)',
    warning: 'var(--color-today)',
    error: 'var(--color-deadline)',
  };

  return h('div', {
    style: {
      position: 'fixed',
      top: 'calc(var(--safe-top) + 60px)',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--color-bg-card)',
      color: colors[toast.type] || colors.info,
      padding: '12px 24px',
      borderRadius: 'var(--radius-pill)',
      fontSize: '15px',
      fontWeight: 500,
      boxShadow: 'var(--shadow-4)',
      zIndex: 2000,
      animation: 'fadeIn 0.2s, slideUp 0.3s',
      maxWidth: '90%',
      textAlign: 'center',
    }
  }, toast.message);
}

// ===== 主应用 =====
function App() {
  const { route } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 监听 NavBar 汉堡按钮事件
  useEffect(() => {
    const handler = () => setSidebarOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handler);
    return () => window.removeEventListener('toggle-sidebar', handler);
  }, []);

  const matched = matchRoute(route.path);
  const PageComponent = matched.component();

  // 主页面判断（用于 NavBar 返回按钮逻辑）
  const mainPages = ['/', '/puff', '/alex', '/finance'];
  const isMainPage = mainPages.includes(route.path);

  return h('div', { className: 'app-shell' },
    // Sidebar 导航抽屉
    h(Sidebar, { open: sidebarOpen, onClose: () => setSidebarOpen(false) }),

    // 页面内容
    h(PageComponent),

    // TabBar — 始终显示在所有页面底部（fixed 定位）
    h(TabBar),

    // 快速新增面板
    h(QuickAdd),

    // Toast
    h(Toast),
  );
}

// ===== 渲染 =====
function renderApp() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    h(AppProvider, null, h(App))
  );
}

// ===== 注册 Service Worker =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      // 检测到新 SW 等待中时，触发激活
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            // 新 SW 安装完成，通知旧 SW skipWaiting
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      // 新 SW 接管后，自动刷新页面（只刷新一次）
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      // 每次打开页面时主动检查更新
      reg.update();
    }).catch(err => {
      console.log('Service Worker 注册失败:', err);
    });
  });
}

// ===== 恢复用户自定义图标 =====
// 必须在渲染之前就应用图标，确保 Safari 在用户点击"添加到主屏幕"时
// 能读到正确的 <link rel="apple-touch-icon"> href
const savedIconKey = localStorage.getItem('ph_app_icon') || 'default';
if (window.applyAppIcon) {
  window.applyAppIcon(savedIconKey);
}

// ===== 等待 DB 就绪后渲染 =====
if (window.db) {
  renderApp();
} else {
  window.dbReady.then(() => renderApp()).catch(err => {
    console.error('应用启动失败:', err);
    document.getElementById('root').innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:20px;text-align:center;font-family:-apple-system,sans-serif;">
        <div style="font-size:48px;margin-bottom:16px">😔</div>
        <div style="font-size:17px;color:#6B665E;margin-bottom:8px">应用启动失败</div>
        <div style="font-size:14px;color:#9C968B">${err.message}</div>
        <div style="font-size:14px;color:#9C968B;margin-top:8px">请尝试使用 Safari 的普通模式（非隐私浏览）</div>
      </div>
    `;
  });
}
})();
