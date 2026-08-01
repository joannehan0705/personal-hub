(function() {
/**
 * Personal Hub — 输入框组件
 */

const { createElement: h, useState } = React;

function Input({ label, value = '', onChange, placeholder, type = 'text', multiline = false, rows = 3, style, required, maxLength }) {
  const [focused, setFocused] = useState(false);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    ...style,
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    paddingLeft: 'var(--space-xs)',
  };

  const inputBase = {
    backgroundColor: focused ? 'var(--color-bg-card)' : 'var(--color-bg-subtle)',
    border: focused ? '2px solid var(--color-accent)' : '2px solid transparent',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    fontSize: '17px',
    color: 'var(--color-text-primary)',
    transition: 'border-color 0.2s, background-color 0.2s',
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
  };

  const commonProps = {
    value,
    onChange: (e) => onChange && onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    placeholder,
    required,
    maxLength,
  };

  return h('div', { style: containerStyle },
    label && h('label', { style: labelStyle }, label),
    multiline
      ? h('textarea', { ...commonProps, rows, style: { ...inputBase, lineHeight: '1.5' } })
      : h('input', { ...commonProps, type, style: inputBase })
  );
}

window.Input = Input;

})();
