(function() {
/**
 * Personal Hub — 泡芙产品选择页面
 * 用于菜单的 Monthly Favorite / Weekly Selection 产品选择
 * 支持搜索、分类筛选、两列 Grid 布局
 */

const { createElement: h, useState, useEffect } = React;

function ProductSelectPage() {
  const { navigate, showToast, refreshData } = useApp();
  const [menu, setMenu] = useState(null);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  // 从 hash 解析参数
  const hash = window.location.hash || '';
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const type = params.get('type') || 'monthly'; // 'monthly' | 'weekly'
  const menuId = params.get('menuId');

  useEffect(() => {
    loadData();
  }, [menuId, type]);

  const loadData = async () => {
    if (!menuId) return;
    const m = await DAO.menus.getById(menuId);
    if (!m) {
      showToast('菜单不存在', 'error');
      navigate('/puff/menus');
      return;
    }
    setMenu(m);

    const prods = await DAO.products.getActive();
    setProducts(prods);

    if (type === 'monthly') {
      setSelected(m.monthlyFavorites || []);
    } else {
      setSelected(m.weeklySelection || []);
    }
  };

  const toggleProduct = (productId) => {
    Haptics.selection();
    setSelected(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleDone = async () => {
    if (!menu || saving) return;
    setSaving(true);
    try {
      const updates = type === 'monthly'
        ? { monthlyFavorites: selected }
        : { weeklySelection: selected };
      await DAO.menus.update(menu.id, updates);
      Haptics.success();
      showToast('已保存', 'success');
      refreshData();
      navigate('/puff/menus');
    } catch (err) {
      showToast('保存失败', 'error');
    }
    setSaving(false);
  };

  // 过滤产品
  const filtered = products.filter(p => {
    if (filter !== 'all' && p.category !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // 分类选项
  const categories = [
    { key: 'all',      label: 'All' },
    { key: 'classic',  label: 'Classic' },
    { key: 'testing',  label: 'Testing' },
    { key: 'seasonal', label: 'Seasonal' },
    { key: 'special',  label: 'Special' },
  ];

  const title = type === 'monthly' ? '⭐ Monthly Favorite' : '📅 Weekly Selection';

  // 产品卡片
  const renderProductCard = (product) => {
    const isSelected = selected.includes(product.id);
    const cat = CATEGORIES.getProductCategory(product.category);

    return h('div', {
      key: product.id,
      onClick: () => toggleProduct(product.id),
      style: {
        backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-bg-card)',
        border: isSelected ? 'none' : '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-md) var(--space-sm)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minHeight: '72px',
        justifyContent: 'center',
        transition: 'all 0.15s',
        boxShadow: 'var(--shadow-1)',
      }
    },
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }
      },
        h('span', {
          style: {
            fontSize: '14px',
            flexShrink: 0,
            color: isSelected ? '#FFFFFF' : 'var(--color-text-tertiary)',
          }
        }, isSelected ? '✓' : '○'),
        h('span', {
          style: {
            fontSize: '14px',
            fontWeight: 600,
            color: isSelected ? '#FFFFFF' : 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }
        }, product.name),
      ),
      h('div', {
        style: {
          fontSize: '11px',
          color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--color-text-tertiary)',
          paddingLeft: '20px',
        }
      }, cat.label)
    );
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },

    h(NavBar, {
      title,
      showBack: true,
      onBack: () => navigate('/puff/menus'),
    }),

    // 搜索框
    h('div', {
      style: { padding: 'var(--space-sm) var(--space-lg)' }
    },
      h('input', {
        type: 'text',
        value: search,
        onChange: (e) => setSearch(e.target.value),
        placeholder: '搜索产品…',
        style: {
          width: '100%',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border-light)',
          backgroundColor: 'var(--color-bg-subtle)',
          fontSize: '15px',
          color: 'var(--color-text-primary)',
          outline: 'none',
          boxSizing: 'border-box',
        }
      })
    ),

    // 分类筛选
    h('div', {
      style: {
        display: 'flex',
        gap: 'var(--space-xs)',
        padding: '0 var(--space-lg) var(--space-sm)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }
    },
      categories.map(c =>
        h('button', {
          key: c.key,
          onClick: () => { Haptics.selection(); setFilter(c.key); },
          style: {
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: filter === c.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: filter === c.key ? '#FFFFFF' : 'var(--color-text-secondary)',
            flexShrink: 0,
          }
        }, c.label)
      )
    ),

    // 产品 Grid
    h('div', {
      className: 'scroll-container page',
      style: {
        paddingBottom: '120px',
      }
    },
      filtered.length === 0
        ? h('div', {
            style: { textAlign: 'center', padding: 'var(--space-xl) 0', color: 'var(--color-text-tertiary)', fontSize: '14px' }
          }, '没有找到产品')
        : h('div', {
            style: {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-sm)',
              padding: '0 var(--space-lg)',
            }
          }, filtered.map(renderProductCard))
    ),

    // 底部固定栏
    h('div', {
      style: {
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px var(--space-lg)',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--color-bg-card)',
        borderTop: '1px solid var(--color-border-light)',
        zIndex: 1000,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      }
    },
      h('span', {
        style: { fontSize: '15px', fontWeight: 500, color: 'var(--color-text-secondary)' }
      }, `已选择 ${selected.length} 个产品`),
      h('button', {
        onClick: handleDone,
        disabled: saving,
        style: {
          padding: '10px 28px',
          borderRadius: 'var(--radius-pill)',
          fontSize: '15px',
          fontWeight: 600,
          backgroundColor: 'var(--color-accent)',
          color: '#FFFFFF',
          border: 'none',
          opacity: saving ? 0.6 : 1,
        }
      }, 'Done')
    )
  );
}

window.ProductSelectPage = ProductSelectPage;

})();
