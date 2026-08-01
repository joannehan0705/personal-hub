(function() {
/**
 * Personal Hub — V3 底部导航栏
 * 4 个等宽 tab，移除中间 FAB
 */

const { createElement: h } = React;

const TABS = [
  { key: 'home',    path: '/',         icon: 'home',     label: '首页' },
  { key: 'alex',    path: '/alex',     icon: 'alex',     label: 'Alex' },
  { key: 'puff',    path: '/puff',     icon: 'puff',     label: '泡芙' },
  { key: 'finance', path: '/finance',  icon: 'finance',  label: '记账' },
];

function TabBar() {
  const { route, navigate } = useApp();

  const currentPath = route.path;
  const activeTab = TABS.find(tab =>
    tab.path && (currentPath.startsWith(tab.path) && tab.path !== '/')
  ) || (currentPath === '/' ? TABS[0] : null);

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

  return h('div', { className: 'bottom-nav' },
    TABS.map(tab => {
      const isActive = activeTab && activeTab.key === tab.key;
      return h('div', {
        key: tab.key,
        onClick: () => { Haptics.light(); navigate(tab.path); },
        style: tabStyle(isActive),
        onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.92)'; },
        onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
      },
        h(Icon, {
          name: tab.icon,
          size: 24,
          color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
          strokeWidth: isActive ? 2.5 : 2
        }),
        h('span', { style: labelStyle }, tab.label)
      );
    })
  );
}

window.TabBar = TabBar;

})();
