(function() {
/**
 * Personal Hub — 产品管理页
 */

const { createElement: h, useState, useEffect } = React;

function ProductsPage() {
  const { dataVersion, refreshData, showToast } = useApp();
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'category'

  useEffect(() => {
    loadProducts();
  }, [dataVersion]);

  const loadProducts = async () => {
    const data = await DAO.products.getAll();
    data.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    setProducts(data);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    refreshData();
  };

  const handleDelete = async (product) => {
    await DAO.products.delete(product.id);
    showToast('已删除', 'success');
    Haptics.success();
    refreshData();
  };

  const renderProduct = (product) => {
    const cat = CATEGORIES.getProductCategory(product.category);

    return h('div', {
      key: product.id,
      style: {
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
      }
    },
      // 图标
      h('div', {
        style: {
          width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', flexShrink: 0,
        }
      }, cat.icon),

      // 信息
      h('div', {
        onClick: () => { Haptics.light(); setEditingProduct(product); setShowForm(true); },
        style: { flex: 1, minWidth: 0 }
      },
        h('div', { style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' } }, product.name),
        h('div', {
          style: { fontSize: '13px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: '2px' }
        },
          viewMode === 'list' && h(Tag, null, cat.label),
          h('span', { className: 'numeric' }, FormatUtils.money(product.price)),
        ),
      ),

      // 删除按钮
      h('button', {
        onClick: () => handleDelete(product),
        style: {
          width: '28px', height: '28px', borderRadius: '50%',
          backgroundColor: 'var(--color-bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }
      }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
    );
  };

  // 按分类分组
  const groupedByCategory = {};
  for (const cat of CATEGORIES.product) {
    groupedByCategory[cat.key] = [];
  }
  for (const p of products) {
    const cat = CATEGORIES.getProductCategory(p.category);
    if (!groupedByCategory[cat.key]) groupedByCategory[cat.key] = [];
    groupedByCategory[cat.key].push(p);
  }

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '产品', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); setEditingProduct(null); setShowForm(true); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    h('div', { className: 'scroll-container page' },
      // 视图切换
      h('div', {
        style: { display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }
      },
        h('button', {
          onClick: () => { Haptics.selection(); setViewMode('list'); },
          style: {
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            fontSize: '14px', fontWeight: 500,
            backgroundColor: viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: viewMode === 'list' ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, '列表'),
        h('button', {
          onClick: () => { Haptics.selection(); setViewMode('category'); },
          style: {
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            fontSize: '14px', fontWeight: 500,
            backgroundColor: viewMode === 'category' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: viewMode === 'category' ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, '分类')
      ),

      products.length === 0
        ? h(EmptyState, { icon: '🧁', title: '还没有产品', subtitle: '点击右上角 + 添加产品' })
        : viewMode === 'list'
          ? h('div', null, products.map(renderProduct))
          : h('div', null,
              CATEGORIES.product.map(cat => {
                const items = groupedByCategory[cat.key] || [];
                if (items.length === 0) return null;
                const total = items.reduce((sum, p) => sum + (p.price || 0), 0);
                return h('div', { key: cat.key },
                  h('div', { className: 'section-header' },
                    h('span', null, `${cat.icon} ${cat.label}`),
                    h('span', { className: 'count' }, `${items.length} 款 · ${FormatUtils.money(total)}`)
                  ),
                  items.map(renderProduct)
                );
              })
            )
    ),

    h(ProductForm, {
      open: showForm,
      onClose: handleCloseForm,
      product: editingProduct,
    })
  );
}

window.ProductsPage = ProductsPage;

})();
