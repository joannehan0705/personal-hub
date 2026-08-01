(function() {
/**
 * Personal Hub — V2 快速新增面板
 * 9种类型: todo, shopping, expense, income, alex, pet, order, wishlist, note
 */

const { createElement: h, useState } = React;

const QUICK_ADD_TYPES = [
  { key: 'todo',     label: '待办',      icon: 'checkCircle', color: '#5B8A8E' },
  { key: 'shopping', label: '购物',      icon: 'cart',        color: '#6B9EC4' },
  { key: 'wishlist', label: '心愿',      icon: 'star',        color: '#C4A576' },
  { key: 'expense',  label: '支出',      icon: 'finance',     color: '#E8826B' },
  { key: 'income',   label: '收入',      icon: 'finance',     color: '#7BAE8E' },
  { key: 'alex',     label: 'Alex事项',   icon: 'alex',        color: '#E8C547' },
  { key: 'pet',      label: '宠物记录',   icon: 'paw',         color: '#8B7EC8' },
  { key: 'order',    label: '泡芙订单',   icon: 'puff',        color: '#C4A576' },
  { key: 'note',     label: '灵感',      icon: 'edit',        color: '#E8C547' },
];

function QuickAdd() {
  const { quickAddOpen, dispatch, ACTIONS, navigate } = useApp();
  const [formType, setFormType] = useState(null);

  const handleClose = () => {
    dispatch({ type: ACTIONS.CLOSE_QUICK_ADD });
    setFormType(null);
  };

  const handleNavigateToForm = (type) => {
    handleClose();
    switch (type) {
      case 'todo':     navigate('/todo?new=1'); break;
      case 'shopping': navigate('/shopping?new=1'); break;
      case 'wishlist': navigate('/wishlist?new=1'); break;
      case 'expense':  navigate('/finance?new=expense'); break;
      case 'income':   navigate('/finance?new=income'); break;
      case 'alex':     navigate('/alex?new=1'); break;
      case 'pet':      navigate('/pets?new=1'); break;
      case 'order':    navigate('/puff/orders?new=1'); break;
      case 'note':     navigate('/notes?new=1'); break;
    }
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-md)',
    padding: 'var(--space-sm) 0',
  };

  const itemStyle = (color) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-lg) var(--space-sm)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'transform 0.1s, background-color 0.15s',
  });

  const iconCircleStyle = (color) => ({
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: `${color}20`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  return h(Sheet, { open: quickAddOpen, onClose: handleClose, title: '快速新增' },
    h('div', { style: gridStyle },
      QUICK_ADD_TYPES.map(type =>
        h('div', {
          key: type.key,
          onClick: () => handleNavigateToForm(type.key),
          style: itemStyle(type.color),
          onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'; },
          onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'transparent'; },
        },
          h('div', { style: iconCircleStyle(type.color) },
            h(Icon, { name: type.icon, size: 26, color: type.color })
          ),
          h('span', {
            style: { fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }
          }, type.label)
        )
      )
    )
  );
}

window.QuickAdd = QuickAdd;

})();
