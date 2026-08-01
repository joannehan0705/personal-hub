(function() {
/**
 * Personal Hub — 底部 Sheet 组件
 */

const { createElement: h, useState, useEffect, useRef } = React;

function Sheet({ open, onClose, title, children, maxHeight = '85vh' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setVisible(false), 250);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!visible && !open) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'var(--color-overlay)',
    zIndex: 999,
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
    transition: 'opacity 0.25s ease-in-out',
  };

  const sheetStyle = {
    position: 'fixed',
    left: 0, right: 0, bottom: 0,
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
    maxHeight,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transform: open ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
    boxShadow: 'var(--shadow-5)',
    paddingBottom: 'var(--safe-bottom)',
    pointerEvents: open ? 'auto' : 'none',
  };

  return h('div', null,
    // 遮罩
    h('div', { style: overlayStyle, onClick: onClose }),

    // Sheet
    h('div', { style: sheetStyle },
      // 拖拽指示器
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'center',
          padding: 'var(--space-sm) 0',
          flexShrink: 0,
        }
      }, h('div', {
        style: {
          width: '40px',
          height: '4px',
          borderRadius: '2px',
          backgroundColor: 'var(--color-border)',
        }
      })),

      // 标题
      title && h('div', {
        style: {
          fontSize: '17px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          padding: '0 var(--space-xl) var(--space-md)',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }
      },
        h('span', null, title),
        h('button', {
          onClick: onClose,
          style: {
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-bg-subtle)',
          }
        }, h(Icon, { name: 'close', size: 16, color: 'var(--color-text-tertiary)' }))
      ),

      // 内容
      h('div', {
        style: {
          flex: 1,
          overflowY: 'auto',
          padding: '0 var(--space-xl) var(--space-xl)',
          WebkitOverflowScrolling: 'touch',
        }
      }, children)
    )
  );
}

window.Sheet = Sheet;

})();
