(function() {
/**
 * Personal Hub — 按钮组件
 */

const { createElement: h } = React;

function Button({ variant = 'primary', size = 'md', onClick, children, style, disabled, fullWidth, className = '' }) {
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'transform 0.1s ease-out, opacity 0.15s',
    fontWeight: 600,
    width: fullWidth ? '100%' : 'auto',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    ...style,
  };

  const sizes = {
    sm: { padding: '8px 16px', fontSize: '15px', height: '36px' },
    compact: { padding: '8px 18px', fontSize: '15px', height: '40px' },
    md: { padding: '12px 20px', fontSize: '17px', height: '50px' },
    lg: { padding: '16px 24px', fontSize: '18px', height: '56px' },
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-accent)',
      color: '#FFFFFF',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-subtle)',
      color: 'var(--color-text-primary)',
    },
    danger: {
      backgroundColor: 'var(--color-deadline)',
      color: '#FFFFFF',
    },
    text: {
      backgroundColor: 'transparent',
      color: 'var(--color-accent)',
      fontWeight: 400,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      fontWeight: 400,
    },
  };

  const handleClick = (e) => {
    if (disabled) return;
    Haptics.light();
    if (onClick) onClick(e);
  };

  return h('button', {
    onClick: handleClick,
    disabled,
    className: `btn btn-${variant} ${className}`,
    style: { ...baseStyle, ...sizes[size], ...variants[variant] },
    onMouseDown: (e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; },
    onMouseUp: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
    onMouseLeave: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
    onTouchStart: (e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  }, children);
}

window.Button = Button;

})();
