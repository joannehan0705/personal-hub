(function() {
/**
 * Personal Hub — V3 底部导航栏
 * 三层架构：Bottom Navigation (fixed bottom)
 * 5 slots: 首页 / 泡芙 / ➕(凸起圆形，绝对定位) / Alex / 记账
 * 使用 CSS class .bottom-nav，配合全局三层布局系统
 */

const { createElement: h } = React;

const TABS = [
  { key: 'home',     path: '/',              icon: 'home',     label: '首页' },
  { key: 'puff',     path: '/puff',          icon: 'puff',     label: '泡芙' },
  { key: 'add',      path: null,             icon: 'plus',     label: '' },
  { key: 'alex',     path: '/alex',          icon: 'alex',     label: 'Alex' },
  { key: 'finance',  path: '/finance',       icon: 'finance',  label: '记账' },
];

function TabBar() {
  const { route, dispatch, ACTIONS, navigate } = useApp();

  const currentPath = route.path;
  const activeTab = TABS.find(tab =>
    tab.path && (currentPath.startsWith(tab.path) && tab.path !== '/')
  ) || (currentPath === '/' ? TABS[0] : null);

  const handleAdd = () => {
    Haptics.medium();
    dispatch({ type: ACTIONS.OPEN_QUICK_ADD });
  };

  const tabStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    flex: 1,
    height: '100%',
    cursor: 'pointer',
    color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
    transition: 'color 0.2s, transform 0.1s',
    WebkitTapHighlightColor: 'transparent',
  });

  const labelStyle = {
    fontSize: '10px',
    fontWeight: 400,
    letterSpacing: '0.02em',
    lineHeight: 1,
  };

  // 中心➕按钮 — 绝对定位，底部对齐导航栏内容中心，向上凸出
  // .bottom-nav 内容高度 = --tab-bar-height (56px)
  // 按钮底部放在内容高度的 1/2 处，即 bottom: safe-bottom + tab-bar-height/2
  // 按钮自身高度 48px，所以按钮顶部凸出 = 48 - tab-bar-height/2 = 48 - 28 = 20px
  const centerButtonStyle = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 'calc(var(--safe-bottom) + var(--tab-bar-height) / 2 - 24px)',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(91, 138, 142, 0.35)',
    cursor: 'pointer',
    border: '3px solid var(--color-bg-base)',
    zIndex: 1,
  };

  // 底部导航容器
  return h('div', { className: 'bottom-nav' },
    // 中心➕按钮
    h('div', {
      onClick: handleAdd,
      style: centerButtonStyle,
      onTouchStart: (e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(0.92)'; },
      onTouchEnd: (e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1)'; },
    },
      h(Icon, { name: 'plus', size: 24, color: '#FFFFFF', strokeWidth: 2.5 })
    ),

    // 5个 tab slots（➕位置留空占位）
    TABS.map(tab => {
      if (tab.key === 'add') {
        return h('div', { key: tab.key, style: { flex: 1 } });
      }

      const isActive = activeTab && activeTab.key === tab.key;
      return h('div', {
        key: tab.key,
        onClick: () => { Haptics.light(); navigate(tab.path); },
        style: tabStyle(isActive),
        onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.92)'; },
        onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
      },
        h(Icon, { name: tab.icon, size: 24, color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)', strokeWidth: isActive ? 2.5 : 2 }),
        h('span', { style: labelStyle }, tab.label)
      );
    })
  );
}

window.TabBar = TabBar;

})();
