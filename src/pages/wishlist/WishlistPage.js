(function() {
/**
 * Personal Hub — Wishlist 页面
 * 不显示在首页，可以填写预计价格和购买链接
 */

const { createElement: h, useState, useEffect } = React;

function WishlistPage() {
  const { dataVersion, refreshData, route, navigate, showToast } = useApp();
  const [items, setItems] = useState([]);
  const [purchased, setPurchased] = useState([]);
  const [stats, setStats] = useState({ total: 0, purchased: 0, remaining: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'archived'

  useEffect(() => {
    if (window.location.hash.includes('new=1')) {
      setShowForm(true);
      setEditingItem(null);
    }
  }, [route]);

  useEffect(() => { loadData(); }, [dataVersion, viewMode]);

  const loadData = async () => {
    if (viewMode === 'archived') {
      const data = await DAO.wishlist.getArchived();
      setItems(data);
      setPurchased([]);
      setStats({ total: 0, purchased: 0, remaining: 0 });
    } else {
      const [unpurchased, purchasedItems, s] = await Promise.all([
        DAO.wishlist.getActive(),
        DAO.wishlist.getPurchased(),
        DAO.wishlist.getStats(),
      ]);
      setItems(unpurchased);
      setPurchased(purchasedItems);
      setStats(s);
    }
  };

  const handleToggle = async (id) => {
    await DAO.wishlist.togglePurchased(id);
    refreshData();
  };

  const handleDelete = async (id) => {
    await DAO.wishlist.delete(id);
    Haptics.warning();
    refreshData();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleArchive = async (id) => {
    await DAO.wishlist.archive(id);
    Haptics.light();
    showToast('已归档', 'success');
    refreshData();
  };

  const handleUnarchive = async (id) => {
    await DAO.wishlist.unarchive(id);
    Haptics.light();
    showToast('已恢复', 'success');
    refreshData();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    refreshData();
    if (window.location.hash.includes('new=1')) navigate('/wishlist');
  };

  const renderItem = (item) => (
    h('div', {
      key: item.id,
      style: {
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-xs)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
      }
    },
      h(Checkbox, { checked: item.purchased, onChange: () => handleToggle(item.id) }),
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { style: { fontSize: '17px', color: 'var(--color-text-primary)', fontWeight: 500 } }, item.name),
        item.notes && h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' } }, item.notes),
      ),
      item.estimatedPrice && h('span', { style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', className: 'numeric' } }, FormatUtils.money(item.estimatedPrice)),
      h('button', {
        onClick: (e) => { e.stopPropagation(); handleArchive(item.id); },
        style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0 }
      }, h(Icon, { name: 'archive', size: 14, color: 'var(--color-text-tertiary)' })),
      h('button', {
        onClick: (e) => { e.stopPropagation(); handleEdit(item); },
        style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0 }
      }, h(Icon, { name: 'edit', size: 14, color: 'var(--color-text-tertiary)' })),
      h('button', {
        onClick: (e) => { e.stopPropagation(); handleDelete(item.id); },
        style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0 }
      }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
    )
  );

  const renderArchivedItem = (item) => (
    h('div', {
      key: item.id,
      style: {
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-xs)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
        opacity: 0.7,
      }
    },
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { style: { fontSize: '17px', color: 'var(--color-text-secondary)' } }, item.name),
      ),
      h('button', {
        onClick: () => handleUnarchive(item.id),
        style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0 }
      }, h(Icon, { name: 'refresh', size: 14, color: 'var(--color-complete)' })),
      h('button', {
        onClick: () => handleDelete(item.id),
        style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0 }
      }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
    )
  );

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: 'Wishlist', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); setEditingItem(null); setShowForm(true); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    // 视图切换
    h('div', {
      style: { display: 'flex', gap: 'var(--space-xs)', padding: '0 var(--space-lg) var(--space-sm)' }
    },
      h('button', {
        onClick: () => { Haptics.selection(); setViewMode('active'); },
        style: {
          flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
          fontSize: '14px', fontWeight: 500,
          backgroundColor: viewMode === 'active' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
          color: viewMode === 'active' ? '#FFFFFF' : 'var(--color-text-secondary)',
        }
      }, '活跃'),
      h('button', {
        onClick: () => { Haptics.selection(); setViewMode('archived'); },
        style: {
          flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
          fontSize: '14px', fontWeight: 500,
          backgroundColor: viewMode === 'archived' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
          color: viewMode === 'archived' ? '#FFFFFF' : 'var(--color-text-secondary)',
        }
      }, '已归档')
    ),

    h('div', { className: 'scroll-container page' },
      viewMode === 'active' ? (
        items.length === 0 && purchased.length === 0
          ? h(EmptyState, { icon: '🎁', title: 'Wishlist 为空', subtitle: '添加你想买的东西' })
          : h('div', null,
              items.map(renderItem),
              purchased.length > 0 && h('div', { className: 'section-header', style: { marginTop: 'var(--space-md)' } },
                h('span', null, '已购买'),
                h('span', { className: 'count' }, `${purchased.length}`)
              ),
              purchased.map(renderItem),
              // 统计
              stats.total > 0 && h(Card, { style: { marginTop: 'var(--space-md)' } },
                h('div', { style: { display: 'flex', justifyContent: 'space-around', textAlign: 'center' } },
                  h('div', null,
                    h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '总价'),
                    h('div', { style: { fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)' }, className: 'numeric' }, FormatUtils.money(stats.total)),
                  ),
                  h('div', null,
                    h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '已购'),
                    h('div', { style: { fontSize: '20px', fontWeight: 600, color: 'var(--color-complete)' }, className: 'numeric' }, FormatUtils.money(stats.purchased)),
                  ),
                  h('div', null,
                    h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '剩余'),
                    h('div', { style: { fontSize: '20px', fontWeight: 600, color: 'var(--color-accent)' }, className: 'numeric' }, FormatUtils.money(stats.remaining)),
                  ),
                )
              )
            )
      ) : (
        items.length === 0
          ? h(EmptyState, { icon: '📦', title: '没有已归档的 Wishlist', subtitle: '' })
          : h('div', null, items.map(renderArchivedItem))
      )
    ),

    h(WishlistForm, { open: showForm, onClose: handleCloseForm, item: editingItem })
  );
}

window.WishlistPage = WishlistPage;

})();
