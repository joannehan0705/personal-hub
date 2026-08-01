(function() {
/**
 * Personal Hub — 左侧 Sidebar 导航抽屉
 * 点击汉堡按钮从左侧滑出，包含所有 section 导航
 */

const { createElement: h, useState, useEffect } = React;

// Sidebar 导航项（包含所有 section，比底部 Tab 更全）
const SIDEBAR_ITEMS = [
  // 主页
  { section: 'main', label: '主页', items: [
    { path: '/',              icon: 'home',     label: '首页',     color: '#5B8A8E' },
    { path: '/todo',          icon: 'checkCircle', label: '待办',  color: '#E8C547' },
    { path: '/shopping',      icon: 'cart',     label: '购物清单', color: '#6B9EC4' },
    { path: '/review',        icon: 'finance',  label: 'Review',   color: '#5B8A8E' },
  ]},
  // 生活管理
  { section: 'life', label: '生活', items: [
    { path: '/finance',       icon: 'finance',  label: '记账',     color: '#7BAE8E' },
    { path: '/alex',          icon: 'alex',     label: 'Alex',    color: '#E8C547' },
    { path: '/pets',          icon: 'paw',      label: '宠物',     color: '#8B7EC8' },
    { path: '/life/recipes',  icon: 'edit',     label: '食谱',     color: '#E8826B' },
    { path: '/wishlist',      icon: 'star',     label: '心愿清单', color: '#C4A576' },
    { path: '/notes',         icon: 'edit',     label: 'Studio',   color: '#E8C547' },
  ]},
  // 泡芙品牌
  { section: 'puff', label: 'anan puff lab', items: [
    { path: '/puff',            icon: 'puff',     label: '主页',     color: '#C4A576' },
    { path: '/puff/orders',     icon: 'tag',      label: '订单',     color: '#C4A576' },
    { path: '/puff/finance',    icon: 'finance',  label: '记账',     color: '#C4A576' },
    { path: '/puff/products',   icon: 'puff',     label: '产品',     color: '#C4A576' },
    { path: '/puff/menus',      icon: 'edit',     label: '菜单',     color: '#C4A576' },
    { path: '/puff/customers',  icon: 'alex',     label: '顾客',     color: '#C4A576' },
    { path: '/puff/recipes',    icon: 'edit',     label: '配方',     color: '#C4A576' },
    { path: '/puff/pickup-points', icon: 'tag',   label: '取货点',   color: '#C4A576' },
    { path: '/puff/inventory',  icon: 'tag',      label: '库存',     color: '#C4A576' },
    { path: '/puff/social',     icon: 'bell',     label: '社交媒体', color: '#C4A576' },
  ]},
  // 设置
  { section: 'settings', label: '设置', items: [
    { path: '/settings',          icon: 'settings', label: '我的',     color: '#9C968B' },
    { path: '/settings/search',   icon: 'search',   label: '搜索',     color: '#9C968B' },
    { path: '/settings/data',     icon: 'download', label: '数据管理', color: '#9C968B' },
    { path: '/settings/about',    icon: 'info',     label: '关于',     color: '#9C968B' },
  ]},
];

function Sidebar({ open, onClose }) {
  const { route, navigate } = useApp();

  // 阻止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleNavigate = (path) => {
    Haptics.light();
    navigate(path);
    onClose();
  };

  const currentPath = route.path;

  // 遮罩
  const overlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'var(--color-overlay)',
    zIndex: 998,
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
    transition: 'opacity 0.25s ease-in-out',
  };

  // Sidebar 主体
  const sidebarStyle = {
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    width: '300px',
    maxWidth: '85vw',
    backgroundColor: 'var(--color-bg-base)',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    transform: open ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
    boxShadow: 'var(--shadow-4)',
    paddingTop: 'var(--safe-top)',
    paddingBottom: 'var(--safe-bottom)',
  };

  // 判断当前路由是否匹配
  const isActive = (path) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return h('div', null,
    // 遮罩
    h('div', { style: overlayStyle, onClick: onClose }),

    // Sidebar
    h('div', { style: sidebarStyle },
      // 顶部品牌区
      h('div', {
        style: {
          padding: 'var(--space-xl) var(--space-xl) var(--space-lg)',
          borderBottom: '1px solid var(--color-border-light)',
        }
      },
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }
        },
          h('div', {
            style: {
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', flexShrink: 0,
            }
          }, '🧁'),
          h('div', null,
            h('div', {
              style: { fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }
            }, 'Personal Hub'),
            h('div', {
              style: { fontSize: '12px', color: 'var(--color-text-tertiary)' }
            }, '你的生活工作台')
          )
        )
      ),

      // 导航列表
      h('div', {
        style: {
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-sm) 0',
          WebkitOverflowScrolling: 'touch',
        }
      },
        SIDEBAR_ITEMS.map(group =>
          h('div', { key: group.section },
            // 分组标题
            h('div', {
              style: {
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-tertiary)',
                padding: 'var(--space-md) var(--space-xl) var(--space-xs)',
                letterSpacing: '0.03em',
              }
            }, group.label.toUpperCase()),

            // 分组项
            group.items.map(item => {
              const active = isActive(item.path);
              return h('div', {
                key: item.path,
                onClick: () => handleNavigate(item.path),
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  padding: '11px var(--space-xl)',
                  cursor: 'pointer',
                  backgroundColor: active ? 'var(--color-accent-light)' : 'transparent',
                  borderLeft: active ? '3px solid var(--color-accent)' : '3px solid transparent',
                  transition: 'background-color 0.15s',
                },
                onTouchStart: (e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
                },
                onTouchEnd: (e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                },
              },
                // 图标
                h('div', {
                  style: {
                    width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                    backgroundColor: active ? item.color : 'var(--color-bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background-color 0.15s',
                  }
                }, h(Icon, {
                  name: item.icon,
                  size: 18,
                  color: active ? '#FFFFFF' : 'var(--color-text-secondary)',
                })),
                // 标签
                h('span', {
                  style: {
                    fontSize: '16px',
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    flex: 1,
                  }
                }, item.label),
                // 活跃指示
                active && h(Icon, {
                  name: 'chevronRight',
                  size: 16,
                  color: 'var(--color-accent)',
                })
              );
            })
          )
        )
      ),

      // 底部信息
      h('div', {
        style: {
          padding: 'var(--space-lg) var(--space-xl)',
          borderTop: '1px solid var(--color-border-light)',
          fontSize: '12px',
          color: 'var(--color-text-tertiary)',
          textAlign: 'center',
        }
      },
        `Personal Hub v${APP_CONFIG.version}`,
        h('br'),
        '100% 本地 · 永久免费'
      )
    )
  );
}

window.Sidebar = Sidebar;
})();
