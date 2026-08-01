(function() {
/**
 * Personal Hub — 圆形复选框 + 完成动画
 */

const { createElement: h, useState, useEffect, useRef } = React;

function Checkbox({ checked, onChange, size = 24, color = 'var(--color-complete)' }) {
  const [animating, setAnimating] = useState(false);
  const prevChecked = useRef(checked);

  useEffect(() => {
    if (checked !== prevChecked.current) {
      if (checked) {
        setAnimating(true);
        Haptics.success();
        setTimeout(() => setAnimating(false), 600);
      } else {
        Haptics.light();
      }
      prevChecked.current = checked;
    }
  }, [checked]);

  const containerStyle = {
    width: size,
    height: size,
    flexShrink: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: checked ? 'none' : '2px solid var(--color-border)',
    backgroundColor: checked ? color : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease-in-out, border-color 0.2s',
    transform: animating ? 'scale(1.15)' : 'scale(1)',
  };

  const checkStyle = {
    color: '#FFFFFF',
    fontSize: size * 0.6,
    fontWeight: 700,
    opacity: checked ? 1 : 0,
    transform: animating ? 'scale(1)' : (checked ? 'scale(1)' : 'scale(0.5)'),
    transition: 'opacity 0.2s, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  return h('div', {
    onClick: (e) => {
      e.stopPropagation();
      if (onChange) onChange(!checked);
    },
    style: containerStyle,
  }, h('div', { style: circleStyle },
    h('svg', {
      width: size * 0.6,
      height: size * 0.6,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#FFFFFF',
      strokeWidth: 3,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      style: {
        opacity: checked ? 1 : 0,
        transition: 'opacity 0.2s',
      },
    }, h('path', { d: 'M5 12l5 5L20 7' }))
  ));
}

window.Checkbox = Checkbox;

})();
