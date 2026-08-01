(function() {
/**
 * Personal Hub — V2 购物清单页面
 * 移除价格显示（不再有 estimatedPrice/actualPrice）
 * 移除底部统计栏
 */

const { createElement: h, useState, useEffect } = React;

function ShoppingPage() {
  const { dataVersion, refreshData, route, navigate } = useApp();
  const [items, setItems] = useState([]);
  const [purchased, setPurchased] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (window.location.hash.includes('new=1')) {
      setShowForm(true);
      setEditingItem(null);
    }
  }, [route]);

  useEffect(() => {
    loadData();
  }, [dataVersion]);

  const loadData = async () => {
    const [unpurchased, purchasedItems] = await Promise.all([
      DAO.shopping.getUnpurchased(),
      DAO.shopping.getPurchased(),
    ]);
    setItems(unpurchased);
    setPurchased(purchasedItems);
  };

  const handleToggle = async (id) => {
    await DAO.shopping.togglePurchased(id);
    refreshData();
  };

  const handleDelete = async (id) => {
    await DAO.shopping.delete(id);
    Haptics.warning();
    refreshData();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    refreshData();
    if (window.location.hash.includes('new=1')) navigate('/shopping');
  };

  // 按分类分组
  const grouped = {};
  for (const item of items) {
    const cat = item.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  const renderItem = (item) => h('div', {
    key: item.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      padding: 'var(--space-md) var(--space-lg)',
      marginBottom: 'var(--space-xs)',
    },
    onClick: () => handleEdit(item),
  },
    h(Checkbox, {
      checked: item.purchased,
      onChange: () => handleToggle(item.id),
    }),
    h('div', { style: { flex: 1, minWidth: 0 } },
      h('div', {
        style: {
          fontSize: '17px',
          color: 'var(--color-text-primary)',
        }
      }, item.name),
      h('div', {
        style: {
          fontSize: '13px',
          color: 'var(--color-text-tertiary)',
          display: 'flex',
          gap: 'var(--space-sm)',
        }
      },
        item.store && h('span', null, `📍 ${item.store}`),
        item.notes && h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, item.notes),
      )
    ),
    h('button', {
      onClick: (e) => { e.stopPropagation(); handleDelete(item.id); },
      style: {
        width: '28px', height: '28px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0,
      }
    }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
  );

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '购物清单', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); setEditingItem(null); setShowForm(true); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    h('div', { className: 'scroll-container page' },
      items.length === 0 && purchased.length === 0
        ? h(EmptyState, { icon: '🛒', title: '购物清单是空的', subtitle: '点击右上角 + 添加' })
        : h('div', null,
            // 未购买：按分类分组
            CATEGORIES.shopping.map(cat => {
              const catItems = grouped[cat.key];
              if (!catItems || catItems.length === 0) return null;
              return h('div', { key: cat.key },
                h('div', { className: 'section-header' },
                  h('span', null, `${cat.icon} ${cat.label}`),
                  h('span', { className: 'count' }, catItems.length)
                ),
                catItems.map(renderItem)
              );
            }),

            // 已购买
            purchased.length > 0 && h('div', null,
              h('div', { className: 'section-header' },
                h('span', null, '✓ 已购买'),
                h('span', { className: 'count' }, purchased.length)
              ),
              purchased.map(item => h('div', {
                key: item.id,
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md) var(--space-lg)',
                  marginBottom: 'var(--space-xs)',
                  opacity: 0.5,
                }
              },
                h(Checkbox, { checked: true, onChange: () => handleToggle(item.id) }),
                h('div', { style: { flex: 1 } },
                  h('span', {
                    style: { fontSize: '17px', textDecoration: 'line-through', color: 'var(--color-text-tertiary)' }
                  }, item.name)
                ),
                h('button', {
                  onClick: () => handleDelete(item.id),
                  style: {
                    width: '28px', height: '28px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0,
                  }
                }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
              ))
            )
          )
    ),

    h(ShoppingForm, {
      open: showForm,
      onClose: handleCloseForm,
      item: editingItem,
    })
  );
}

window.ShoppingPage = ShoppingPage;

})();
