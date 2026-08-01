(function() {
/**
 * Personal Hub — 标签、进度条、空状态、确认对话框、选择器
 */

const { createElement: h, useState, useEffect } = React;

// ===== Tag =====
function Tag({ children, color, onClick, style }) {
  const tagStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    backgroundColor: color ? `${color}20` : 'var(--color-accent-light)',
    color: color || 'var(--color-accent)',
    fontSize: '13px',
    fontWeight: 500,
    padding: '3px 8px',
    borderRadius: 'var(--radius-xs)',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };
  return h('span', { onClick, style: tagStyle }, children);
}

// ===== ProgressBar =====
function ProgressBar({ value, max = 1, height = 6, color }) {
  const percent = Math.min(max > 0 ? (value / max) : 0, 1.5);
  const barColor = color || (percent > 1 ? 'var(--color-deadline)' : percent > 0.8 ? 'var(--color-today)' : 'var(--color-complete)');

  return h('div', {
    style: {
      width: '100%',
      height,
      backgroundColor: 'var(--color-bg-subtle)',
      borderRadius: height / 2,
      overflow: 'hidden',
    }
  }, h('div', {
    style: {
      width: `${Math.min(percent * 100, 100)}%`,
      height: '100%',
      backgroundColor: barColor,
      borderRadius: height / 2,
      transition: 'width 0.3s ease-out',
    }
  }));
}

// ===== EmptyState =====
function EmptyState({ icon = '📭', title, subtitle }) {
  return h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4xl) var(--space-xl)',
      textAlign: 'center',
    }
  },
    h('div', { style: { fontSize: '48px', marginBottom: 'var(--space-md)', opacity: 0.5 } }, icon),
    h('div', {
      style: { fontSize: '15px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-xs)' }
    }, title),
    subtitle && h('div', {
      style: { fontSize: '13px', color: 'var(--color-text-tertiary)' }
    }, subtitle),
  );
}

// ===== ConfirmDialog =====
function ConfirmDialog({ open, title, message, confirmText = '确认', cancelText = '取消', onConfirm, onCancel, danger = false }) {
  if (!open) return null;

  return h('div', {
    style: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--color-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-xl)',
      animation: 'fadeIn 0.2s',
    },
    onClick: onCancel,
  },
    h('div', {
      style: {
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)',
        maxWidth: '320px',
        width: '100%',
        boxShadow: 'var(--shadow-5)',
        animation: 'scaleIn 0.2s',
      },
      onClick: (e) => e.stopPropagation(),
    },
      title && h('div', {
        style: { fontSize: '17px', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }
      }, title),
      message && h('div', {
        style: { fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-xl)' }
      }, message),
      h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
        h(Button, {
          variant: 'secondary',
          fullWidth: true,
          onClick: onCancel,
        }, cancelText),
        h(Button, {
          variant: danger ? 'danger' : 'primary',
          fullWidth: true,
          onClick: () => { Haptics.warning(); onConfirm(); },
        }, confirmText),
      )
    )
  );
}

// ===== Select =====
function Select({ label, value, onChange, options, style }) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    ...style,
  };

  return h('div', { style: containerStyle },
    label && h('label', {
      style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)' }
    }, label),
    h('div', {
      style: {
        backgroundColor: 'var(--color-bg-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
      },
      onClick: (e) => {
        // 简单实现：用原生 select 覆盖
        const select = e.currentTarget.querySelector('select');
        if (select) select.click();
      }
    },
      h('span', {
        style: {
          fontSize: '17px',
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-placeholder)',
        }
      }, options.find(o => o.key === value)?.label || options.find(o => o.value === value)?.label || '请选择'),
      h(Icon, { name: 'chevronDown', size: 18, color: 'var(--color-text-tertiary)' }),
      h('select', {
        value,
        onChange: (e) => onChange && onChange(e.target.value),
        style: {
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'auto',
          width: '100%',
          height: '100%',
          left: 0,
          top: 0,
        },
      }, options.map(opt =>
        h('option', {
          key: opt.key || opt.value,
          value: opt.key || opt.value,
        }, opt.label)
      ))
    )
  );
}

window.Tag = Tag;
window.ProgressBar = ProgressBar;
window.EmptyState = EmptyState;
window.ConfirmDialog = ConfirmDialog;
window.Select = Select;

})();
