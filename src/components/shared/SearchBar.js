(function() {
/**
 * Personal Hub — 搜索栏组件
 */

const { createElement: h, useState, useEffect, useRef } = React;

function SearchBar({ value, onChange, placeholder = '搜索...', autoFocus = false }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [autoFocus]);

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    backgroundColor: 'var(--color-bg-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 16px',
    margin: '0 var(--space-lg) var(--space-md)',
  };

  return h('div', { style: containerStyle },
    h(Icon, { name: 'search', size: 18, color: 'var(--color-text-tertiary)' }),
    h('input', {
      ref: inputRef,
      value,
      onChange: (e) => onChange(e.target.value),
      placeholder,
      style: {
        flex: 1,
        border: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
        fontSize: '17px',
        color: 'var(--color-text-primary)',
      }
    }),
    value && h('button', {
      onClick: () => onChange(''),
      style: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-text-placeholder)',
      }
    }, h(Icon, { name: 'close', size: 14, color: '#FFFFFF' }))
  );
}

window.SearchBar = SearchBar;

})();
