(function() {
/**
 * Personal Hub — 泡芙菜单页面（V3）
 * 现代极简 UI，单卡片设计，Capsule Chip 产品展示
 */

const { createElement: h, useState, useEffect } = React;

// 英文月份和星期
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function MenuPage() {
  const { dataVersion, refreshData, navigate, showToast } = useApp();
  const [menus, setMenus] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const [openMenuId, setOpenMenuId] = useState(null); // 展开操作菜单的 menuId

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
    setOpenMenuId(null);
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

  const handleDelete = async (menu) => {
    setOpenMenuId(null);
    if (!confirm('确定删除此菜单？')) return;
    await DAO.menus.delete(menu.id);
    Haptics.warning();
    showToast('已删除', 'success');
    refreshData();
  };

  const handleArchive = async (menu) => {
    setOpenMenuId(null);
    await DAO.menus.archive(menu.id);
    Haptics.light();
    showToast('已归档', 'success');
    refreshData();
  };

  const handleUnarchive = async (menu) => {
    setOpenMenuId(null);
    await DAO.menus.unarchive(menu.id);
    Haptics.light();
    showToast('已恢复', 'success');
    refreshData();
  };

  const getProductName = (id) => {
    const p = products.find(p => p.id === id);
    return p ? p.name : '未知';
  };

  // 格式化日期为英文
  const formatDateEn = (dateStr) => {
    if (!dateStr) return { main: '', sub: '' };
    const d = new Date(dateStr + 'T00:00:00');
    return {
      main: `${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
      sub: WEEKDAYS_EN[d.getDay()],
    };
  };

  // Capsule Chip
  const renderChip = (text, key) =>
    h('span', {
      key,
      style: {
        display: 'inline-block',
        padding: '5px 12px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: 'var(--color-bg-subtle)',
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }
    }, text);

  // 产品展示区域（Monthly / Weekly 共用）
  const renderProductSection = (menu, type) => {
    const isMonthly = type === 'monthly';
    const ids = isMonthly ? (menu.monthlyFavorites || []) : (menu.weeklySelection || []);
    const accentColor = isMonthly ? '#E8C547' : '#5B9E8E';
    const icon = isMonthly ? '⭐' : '📅';
    const label = isMonthly ? 'Monthly Features' : 'Weekly Selection';

    const displayIds = ids.slice(0, 3);
    const remaining = ids.length - displayIds.length;

    return h('div', {
      onClick: (e) => {
        e.stopPropagation();
        Haptics.light();
        navigate(`/puff/menus/select?type=${type}&menuId=${menu.id}`);
      },
      style: {
        display: 'flex',
        gap: '10px',
        cursor: 'pointer',
      }
    },
      // 左侧 Accent Bar
      h('div', {
        style: {
          width: '3px',
          borderRadius: '2px',
          backgroundColor: accentColor,
          flexShrink: 0,
        }
      }),
      // 右侧内容
      h('div', { style: { flex: 1, minWidth: 0 } },
        // 标题
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '6px',
          }
        },
          h('span', { style: { fontSize: '13px' } }, icon),
          h('span', {
            style: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }
          }, label)
        ),
        // 产品 Chips
        ids.length === 0
          ? h('span', {
              style: { fontSize: '13px', color: 'var(--color-text-tertiary)' }
            }, '未选择产品')
          : h('div', {
              style: {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                alignItems: 'center',
              }
            },
              displayIds.map((id, i) => renderChip(getProductName(id), i)),
              remaining > 0 && h('span', {
                style: {
                  fontSize: '13px',
                  color: 'var(--color-text-tertiary)',
                  fontWeight: 500,
                  padding: '0 4px',
                }
              }, `+${remaining} more`)
            )
      )
    );
  };

  const renderMenu = (menu) => {
    const { main, sub } = formatDateEn(menu.date);
    const isMenuOpen = openMenuId === menu.id;

    return h('div', {
      key: menu.id,
      style: {
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
        padding: '18px 20px',
        marginBottom: '16px',
      }
    },
      // 日期 + 操作菜单
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '14px',
        }
      },
        h('div', null,
          h('div', {
            style: { fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }
          }, main),
          h('div', {
            style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' }
          }, sub)
        ),
        // "..." 菜单按钮
        h('div', { style: { position: 'relative' } },
          h('button', {
            onClick: (e) => {
              e.stopPropagation();
              Haptics.light();
              setOpenMenuId(isMenuOpen ? null : menu.id);
            },
            style: {
              width: '30px', height: '30px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'transparent',
              fontSize: '20px', color: 'var(--color-text-tertiary)',
              lineHeight: 1,
            }
          }, '···'),
          // 下拉菜单
          isMenuOpen && h('div', {
            style: {
              position: 'absolute',
              top: '34px',
              right: 0,
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-3)',
              zIndex: 50,
              minWidth: '130px',
              overflow: 'hidden',
            }
          },
            h('div', {
              onClick: (e) => { e.stopPropagation(); openForm(menu); },
              style: {
                padding: '10px 16px', fontSize: '14px', color: 'var(--color-text-primary)',
                cursor: 'pointer', borderBottom: '1px solid var(--color-border-light)',
              }
            }, 'Edit'),
            h('div', {
              onClick: (e) => {
                e.stopPropagation();
                viewMode === 'active' ? handleArchive(menu) : handleUnarchive(menu);
              },
              style: {
                padding: '10px 16px', fontSize: '14px', color: 'var(--color-text-primary)',
                cursor: 'pointer', borderBottom: '1px solid var(--color-border-light)',
              }
            }, viewMode === 'active' ? 'Archive' : 'Unarchive'),
            h('div', {
              onClick: (e) => { e.stopPropagation(); handleDelete(menu); },
              style: {
                padding: '10px 16px', fontSize: '14px', color: 'var(--color-deadline)',
                cursor: 'pointer',
              }
            }, 'Delete'),
          )
        )
      ),

      // Monthly Favorite
      renderProductSection(menu, 'monthly'),

      // Divider
      h('div', {
        style: {
          height: '1px',
          backgroundColor: 'var(--color-border-light)',
          margin: '14px 0',
        }
      }),

      // Weekly Selection
      renderProductSection(menu, 'weekly'),

      // 备注
      menu.notes && h('div', {
        style: {
          fontSize: '13px',
          color: 'var(--color-text-tertiary)',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid var(--color-border-light)',
        }
      }, menu.notes),
    );
  };

  return h('div', {
    style: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }
  },

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
      }, 'Active'),
      h('button', {
        onClick: () => { Haptics.selection(); setViewMode('archived'); },
        style: {
          flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
          fontSize: '14px', fontWeight: 500,
          backgroundColor: viewMode === 'archived' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
          color: viewMode === 'archived' ? '#FFFFFF' : 'var(--color-text-secondary)',
        }
      }, 'Archived')
    ),

    h('div', {
      className: 'scroll-container page',
      onClick: () => { if (openMenuId) setOpenMenuId(null); },
    },
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
        }, '创建后点击 Monthly Features 或 Weekly Selection 选择产品'),
      )
    )
  );
}

window.MenuPage = MenuPage;

})();
