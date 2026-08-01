(function() {
/**
 * Personal Hub — 顶部导航栏
 * 左侧：汉堡按钮 / 返回按钮
 * 中间：标题
 * 右侧：自定义操作
 */

const { createElement: h, useState } = React;

function NavBar({ title, showBack = false, rightAction, onBack }) {
  const { navigate } = useApp();

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 'var(--nav-bar-height)',
    paddingTop: 'var(--safe-top)',
    flexShrink: 0,
    paddingLeft: 'var(--space-lg)',
    paddingRight: 'var(--space-lg)',
    backgroundColor: 'var(--color-bg-base)',
    zIndex: 10,
  };

  const sideStyle = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
  };

  const titleStyle = {
    fontSize: '17px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    flex: 1,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return h('div', { style: navStyle, className: 'nav-bar' },
    // 左侧：返回按钮（子页面）或汉堡按钮（主页面）
    h('div', { style: sideStyle },
      showBack
        ? h('button', {
            onClick: () => { Haptics.light(); onBack ? onBack() : navigate('/'); },
            style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }
          }, h(Icon, { name: 'chevronLeft', size: 24, color: 'var(--color-accent)' }))
        : h('button', {
            onClick: () => {
              Haptics.light();
              window.dispatchEvent(new CustomEvent('toggle-sidebar'));
            },
            style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }
          },
             // 汉堡图标
             h('svg', {
               width: 24, height: 24, viewBox: '0 0 24 24',
               fill: 'none', stroke: 'var(--color-accent)',
               strokeWidth: 2, strokeLinecap: 'round',
             },
               h('path', { d: 'M4 7h16M4 12h16M4 17h16' })
             ))
    ),

    // 标题
    h('div', { style: titleStyle }, title),

    // 右侧操作
    h('div', { style: sideStyle }, rightAction || null)
  );
}

window.NavBar = NavBar;

})();
