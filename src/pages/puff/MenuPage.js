(function() {
/**
 * Personal Hub — 泡芙菜单页面
 * Monthly Favorite + Weekly Selection
 */

const { createElement: h, useState, useEffect } = React;

function MenuPage() {
  const { dataVersion, refreshData, navigate, showToast } = useApp();
  const [menus, setMenus] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [viewMode, setViewMode] = useState('active');

  useEffect(() => { loadData(); }, [dataVersion, viewMode]);

  const loadData = async () => {
    const data = viewMode === 'archived' ? await DAO.menus.getArchived() : await DAO.menus.getActive();
    const prods = await DAO.products.getActive();
    setMenus(data);
    setProducts(prods);
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await DAO.menus.delete(id);
    Haptics.warning();
    refreshData();
  };

  const handleArchive = async (id) => {
    await DAO.menus.archive(id);
    Haptics.light();
    showToast('已归档', 'success');
    refreshData();
  };

  const handleUnarchive = async (id) => {
    await DAO.menus.unarchive(id);
    Haptics.light();
    showToast('已恢复', 'success');
    refreshData();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMenu(null);
    refreshData();
  };

  const getProductName = (productId) => {
    const p = products.find(p => p.id === productId);
    return p ? p.name : '未知';
  };

  const renderMenu = (menu) => (
    h('div', {
      key: menu.id,
      onClick: () => handleEdit(menu),
      style: {
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
      }
    },
      h('div', { style: { fontSize: '15px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-xs)' } }, DateUtils.friendlyDate(menu.date)),
      // Monthly Favorite
      menu.monthlyFavorites && menu.monthlyFavorites.length > 0 && h('div', { style: { marginBottom: 'var(--space-xs)' } },
        h('div', { style: { fontSize: '13px', color: 'var(--color-accent)', fontWeight: 600 } }, '⭐ Monthly Favorite'),
        h('div', { style: { fontSize: '15px', color: 'var(--color-text-primary)' } },
          menu.monthlyFavorites.map(id => getProductName(id)).join(' · ')
        ),
      ),
      // Weekly Selection
      menu.weeklySelection && menu.weeklySelection.length > 0 && h('div', { style: { marginBottom: 'var(--space-xs)' } },
        h('div', { style: { fontSize: '13px', color: 'var(--color-today)', fontWeight: 600 } }, '📅 Weekly Selection'),
        h('div', { style: { fontSize: '15px', color: 'var(--color-text-primary)' } },
          menu.weeklySelection.map(id => getProductName(id)).join(' · ')
        ),
      ),
      // 备注
      menu.notes && h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-xs)' } }, menu.notes),
      // 操作按钮
      h('div', { style: { display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)' } },
        viewMode === 'active'
          ? h('button', {
              onClick: (e) => { e.stopPropagation(); handleArchive(menu.id); },
              style: { padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '12px', backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-tertiary)' }
            }, '归档')
          : h('button', {
              onClick: (e) => { e.stopPropagation(); handleUnarchive(menu.id); },
              style: { padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '12px', backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-complete)' }
            }, '恢复'),
        h('button', {
          onClick: (e) => { e.stopPropagation(); handleDelete(menu.id); },
          style: { padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '12px', backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-tertiary)' }
        }, '删除'),
      )
    )
  );

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '菜单', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); setEditingMenu(null); setShowForm(true); },
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
      menus.length === 0
        ? h(EmptyState, { icon: '📅', title: viewMode === 'archived' ? '没有已归档的菜单' : '还没有菜单', subtitle: '点击右上角 + 创建菜单' })
        : h('div', null, menus.map(renderMenu))
    ),

    h(MenuForm, { open: showForm, onClose: handleCloseForm, menu: editingMenu, products })
  );
}

window.MenuPage = MenuPage;

})();
