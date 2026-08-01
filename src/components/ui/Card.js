(function() {
/**
 * Personal Hub — 卡片组件
 */

const { createElement: h } = React;

function Card({ children, onClick, style, padding = true, className = '' }) {
  const baseStyle = {
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-md)',
    padding: padding ? 'var(--space-lg) var(--space-xl)' : '0',
    boxShadow: 'var(--shadow-2)',
    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  if (onClick) {
    return h('div', {
      onClick: (e) => { Haptics.light(); onClick(e); },
      className: `card ${className}`,
      style: baseStyle,
      onTouchStart: (e) => { e.currentTarget.style.transform = 'translateY(-1px)'; },
      onTouchEnd: (e) => { e.currentTarget.style.transform = 'translateY(0)'; },
    }, children);
  }

  return h('div', { className: `card ${className}`, style: baseStyle }, children);
}

window.Card = Card;

})();
