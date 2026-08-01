(function() {
/**
 * Personal Hub — 库存管理页
 * 支持 Essential / Special 两大分类切换显示
 * 旧数据（无 section 字段）默认归为 Essential
 */

const { createElement: h, useState, useEffect } = React;

const INVENTORY_SECTIONS = [
  { key: 'essential', label: 'Essential', icon: '⭐' },
  { key: 'special',   label: 'Special',   icon: '✨' },
];

function InventoryPage() {
  const { dataVersion, refreshData, showToast } = useApp();
  const [items, setItems] = useState([]);
  const [activeSection, setActiveSection] = useState('essential');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // 表单状态
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ingredient');
  const [section, setSection] = useState('essential');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadItems();
  }, [dataVersion]);

  const loadItems = async () => {
    const data = await DAO.inventory.getAll();
    data.sort((a, b) => {
      const aLow = a.quantity <= (a.minQuantity || 0) ? 0 : 1;
      const bLow = b.quantity <= (b.minQuantity || 0) ? 0 : 1;
      if (aLow !== bLow) return aLow - bLow;
      return (a.name || '').localeCompare(b.name || '');
    });
    setItems(data);
  };

  const openForm = (item) => {
    if (item) {
      setEditingItem(item);
      setName(item.name || '');
      setCategory(item.category || 'ingredient');
      setSection(item.section || 'essential');
      setQuantity(item.quantity != null ? String(item.quantity) : '');
      setUnit(item.unit || '');
      setMinQuantity(item.minQuantity != null ? String(item.minQuantity) : '');
      setCost(item.cost != null ? String(item.cost) : '');
      setNotes(item.notes || '');
    } else {
      setEditingItem(null);
      setName('');
      setCategory('ingredient');
      setSection(activeSection);
      setQuantity('');
      setUnit('');
      setMinQuantity('');
      setCost('');
      setNotes('');
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    refreshData();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('请输入物品名称', 'warning');
      return;
    }

    const data = {
      name: name.trim(),
      category,
      section,
      quantity: parseFloat(quantity) || 0,
      unit: unit.trim(),
      minQuantity: parseFloat(minQuantity) || 0,
      cost: parseFloat(cost) || 0,
      notes: notes.trim(),
    };

    if (editingItem) {
      await DAO.inventory.update(editingItem.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.inventory.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    handleCloseForm();
  };

  const handleDelete = async (item) => {
    await DAO.inventory.delete(item.id);
    showToast('已删除', 'success');
    Haptics.success();
    refreshData();
  };

  const isLowStock = (item) => item.quantity <= (item.minQuantity || 0);

  const renderItem = (item) => {
    const cat = CATEGORIES.getInventoryCategory(item.category);
    const low = isLowStock(item);

    return h('div', {
      key: item.id,
      style: {
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
      }
    },
      h('div', {
        style: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }
      },
        h('div', {
          style: {
            width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
            backgroundColor: low ? 'rgba(232, 130, 107, 0.12)' : 'var(--color-bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', flexShrink: 0,
          }
        }, cat.icon),

        h('div', {
          onClick: () => { Haptics.light(); openForm(item); },
          style: { flex: 1, minWidth: 0 }
        },
          h('div', {
            style: {
              fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
            }
          },
            item.name,
            low && h('span', {
              style: {
                fontSize: '11px', fontWeight: 600,
                backgroundColor: 'rgba(232, 130, 107, 0.15)',
                color: 'var(--color-deadline)',
                padding: '2px 6px', borderRadius: 'var(--radius-xs)',
              }
            }, '低库存')
          ),
          h('div', {
            style: {
              fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px',
              display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)',
            }
          },
            h('span', null, cat.label),
            h('span', { className: 'numeric' },
              item.quantity + ' ' + (item.unit || '')
            ),
            (item.minQuantity > 0) && h('span', { style: { color: 'var(--color-text-tertiary)' } },
              '最低 ' + item.minQuantity
            ),
          ),
        ),

        h('button', {
          onClick: () => handleDelete(item),
          style: {
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: 'var(--color-bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }
        }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
      )
    );
  };

  // 按当前选中的 section 过滤（旧数据无 section 字段默认归 essential）
  const filteredItems = items.filter(item => (item.section || 'essential') === activeSection);
  const lowStockCount = filteredItems.filter(isLowStock).length;

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '库存', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); openForm(null); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    // Essential / Special 切换按钮
    h('div', {
      style: {
        display: 'flex', gap: 'var(--space-xs)',
        padding: '0 var(--space-lg) var(--space-sm)',
      }
    },
      INVENTORY_SECTIONS.map(s =>
        h('button', {
          key: s.key,
          onClick: () => { Haptics.selection(); setActiveSection(s.key); },
          style: {
            flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
            fontSize: '15px', fontWeight: 600,
            backgroundColor: activeSection === s.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: activeSection === s.key ? '#FFFFFF' : 'var(--color-text-secondary)',
            transition: 'background-color 0.2s, color 0.2s',
          }
        }, s.icon + ' ' + s.label)
      )
    ),

    h('div', { className: 'scroll-container page' },
      lowStockCount > 0 && h('div', {
        style: {
          padding: 'var(--space-sm) var(--space-lg)',
          backgroundColor: 'rgba(232, 130, 107, 0.08)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--space-sm)',
          fontSize: '14px',
          color: 'var(--color-deadline)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
        }
      },
        h(Icon, { name: 'warning', size: 16, color: 'var(--color-deadline)' }),
        lowStockCount + ' 项物品库存不足'
      ),

      filteredItems.length === 0
        ? h(EmptyState, { icon: '📦', title: activeSection === 'essential' ? 'Essential 库存为空' : 'Special 库存为空', subtitle: '点击右上角 + 添加物品' })
        : h('div', null, filteredItems.map(renderItem))
    ),

    // 新增/编辑表单
    h(Sheet, {
      open: showForm,
      onClose: handleCloseForm,
      title: editingItem ? '编辑物品' : '新增物品',
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

        h(Input, {
          label: '名称',
          value: name,
          onChange: setName,
          placeholder: '输入物品名称',
          required: true,
        }),

        // Essential / Special 选择
        h('div', null,
          h('label', {
            style: {
              fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)',
              paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)',
            }
          }, '大类'),
          h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
            INVENTORY_SECTIONS.map(s =>
              h('button', {
                key: s.key,
                onClick: () => { Haptics.selection(); setSection(s.key); },
                style: {
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                  fontSize: '15px', fontWeight: 500,
                  backgroundColor: section === s.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: section === s.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, s.icon + ' ' + s.label)
            )
          )
        ),

        // 细分类别选择器
        h('div', null,
          h('label', {
            style: {
              fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)',
              paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)',
            }
          }, '分类'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
            CATEGORIES.inventory.map(cat =>
              h('button', {
                key: cat.key,
                onClick: () => { Haptics.selection(); setCategory(cat.key); },
                style: {
                  padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: '14px', fontWeight: 500,
                  backgroundColor: category === cat.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: category === cat.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, cat.icon + ' ' + cat.label)
            )
          )
        ),

        h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
          h(Input, {
            label: '数量',
            value: quantity,
            onChange: setQuantity,
            placeholder: '0',
            type: 'number',
            style: { flex: 1 }
          }),
          h(Input, {
            label: '单位',
            value: unit,
            onChange: setUnit,
            placeholder: 'kg / 个',
            style: { flex: 1 }
          }),
        ),

        h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
          h(Input, {
            label: '最低库存',
            value: minQuantity,
            onChange: setMinQuantity,
            placeholder: '0',
            type: 'number',
            style: { flex: 1 }
          }),
          h(Input, {
            label: '成本',
            value: cost,
            onChange: setCost,
            placeholder: '0',
            type: 'number',
            style: { flex: 1 }
          }),
        ),

        h(Input, {
          label: '备注',
          value: notes,
          onChange: setNotes,
          placeholder: '如：供应商、保质期等',
          multiline: true,
          rows: 2,
        }),

        h(Button, { fullWidth: true, onClick: handleSave }, editingItem ? '保存' : '添加'),
      )
    )
  );
}

window.InventoryPage = InventoryPage;

})();
