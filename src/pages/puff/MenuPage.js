(function() {
/**
 * Personal Hub — 泡芙菜单页面（V2）
 * 摘要卡片 + 产品选择页面入口
 */

const { createElement: h, useState, useEffect } = React;

function MenuPage() {
  const { dataVersion, refreshData, navigate, showToast } = useApp();
  const [menus, setMenus] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [viewMode, setViewMode] = useState('active');

  // 表单状态
  const [formDate, setFormDate] = useState(DateUtils.today());
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => { loadData(); }, [dataVersion, viewMode]);

  const loadData = async () => {
    const data = viewMode === 'archived' ? await DAO.menus.getArchived() : await DAO.menus.getActive();
    const prods = await DAO.products.getActive();
    setMenus(data);
    setProducts(prods);
  };

  const openForm = (menu) => {
    if (menu) {
      setEditingMenu(menu);
      setFormDate(menu.date || DateUtils.today());
      setFormNotes(menu.notes || '');
    } else {
      setEditingMenu(null);
      setFormDate(DateUtils.today());
      setFormNotes('');
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMenu(null);
    refreshData();
  };

  const handleSaveForm = async () => {
    if (!formDate) {
      showToast('请选择日期', 'warning');
      return;
    }
    const data = {
      date: formDate,
      notes: formNotes.trim(),
      archived: editingMenu?.archived || false,
    };
    if (editingMenu) {
      await DAO.menus.update(editingMenu.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.menus.create({
        ...data,
        monthlyFavorites: [],
        weeklySelection: [],
      });
      showToast('菜单已创建，点击卡片选择产品', 'success');
    }
    Haptics.success();
    handleCloseForm();
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此菜单？')) return;
    await DAO.menus.delete(id);
    Haptics.warning();
    showToast('已删除', 'success');
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

  const getProductNames = (ids, max = 3) => {
    if (!ids || ids.length === 0) return null;
    const names = ids.map(id => {
      const p = products.find(p => p.id === id);
      return p ? p.name : '未知';
    });
    if (names.length > max) {
      return names.slice(0, max).join('、') + '……';
    }
    return names.join('、');
  };

  // 摘要卡片
  const renderSummaryCard = (menu, type) => {
    const isMonthly = type === 'monthly';
    const ids = isMonthly ? (menu.monthlyFavorites || []) : (menu.weeklySelection || []);
    const label = isMonthly ? '⭐ Monthly Favorite' : '📅 Weekly Selection';
    const icon = isMonthly ? '⭐' : '📅';
    const productNames = getProductNames(ids);

    return h('div', {
      key: type,
      onClick: () => {
        Haptics.light();
        navigate(`/puff/menus/select?type=${type}&menuId=${menu.id}`);
      },
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-md)',
        backgroundColor: 'var(--color-bg-subtle)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        marginBottom: 'var(--space-xs)',
      }
    },
      h('div', { style: { fontSize: '24px', flexShrink: 0 } }, icon),
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', {
          style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }
        }, label),
        h('div', {
          style: {
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }
        }, ids.length > 0
          ? `已选择 ${ids.length} 个产品 · ${productNames || ''}`
          : '未选择产品'
        )
      ),
      h('div', {
        style: {
          fontSize: '20px',
          color: 'var(--color-text-tertiary)',
          flexShrink: 0,
        }
      }, '›')
    );
  };

  const renderMenu = (menu) =>
    h('div', {
      key: menu.id,
      style: {
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
        padding: 'var(--space-md)',
        marginBottom: 'var(--space-sm)',
      }
    },
      // 日期 + 操作按钮
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-sm)',
        }
      },
        h('div', {
          onClick: () => openForm(menu),
          style: { flex: 1, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }
        }, DateUtils.friendlyDate(menu.date)),
        h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
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
      ),

      // Monthly Favorite 摘要
      renderSummaryCard(menu, 'monthly'),

      // Weekly Selection 摘要
      renderSummaryCard(menu, 'weekly'),

      // 备注
      menu.notes && h('div', {
        style: {
          fontSize: '13px',
          color: 'var(--color-text-tertiary)',
          marginTop: 'var(--space-sm)',
          padding: '0 var(--space-xs)',
        }
      }, menu.notes),
    );

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },

    h(NavBar, {
      title: '菜单', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); openForm(null); },
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

    // 新建/编辑菜单 Sheet
    h(Sheet, {
      open: showForm,
      onClose: handleCloseForm,
      title: editingMenu ? '编辑菜单' : '新建菜单',
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },
        h(Input, {
          label: '日期', value: formDate, onChange: setFormDate,
          type: 'date', required: true,
        }),
        h(Input, {
          label: '备注（可选）', value: formNotes, onChange: setFormNotes,
          placeholder: '如：8月菜单', multiline: true, rows: 2,
        }),
        h(Button, { fullWidth: true, onClick: handleSaveForm }, editingMenu ? '保存' : '创建菜单'),
        h('div', {
          style: {
            fontSize: '13px', color: 'var(--color-text-tertiary)',
            textAlign: 'center', lineHeight: 1.5,
          }
        }, '创建后点击 Monthly Favorite 或 Weekly Selection 卡片选择产品'),
      )
    )
  );
}

window.MenuPage = MenuPage;

})();
