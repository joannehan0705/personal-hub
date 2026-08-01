(function() {
/**
 * Personal Hub — 购物清单新增/编辑表单（无价格）
 */

const { createElement: h, useState, useEffect } = React;

function ShoppingForm({ open, onClose, item }) {
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('food');
  const [store, setStore] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name || '');
        setCategory(item.category || 'food');
        setStore(item.store || '');
        setNotes(item.notes || '');
      } else {
        setName('');
        setCategory('food');
        setStore('');
        setNotes('');
      }
    }
  }, [open, item]);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('请输入物品名称', 'warning');
      return;
    }

    const data = {
      name: name.trim(),
      category,
      store: store.trim(),
      notes: notes.trim(),
    };

    if (item) {
      await DAO.shopping.update(item.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.shopping.create({ ...data, purchased: false, purchasedAt: null });
      showToast('已添加', 'success');
    }
    Haptics.success();
    onClose();
  };

  return h(Sheet, { open, onClose, title: item ? '编辑物品' : '新增物品' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },
      h(Input, {
        label: '物品名称',
        value: name,
        onChange: setName,
        placeholder: '如：面粉 2kg',
        required: true,
      }),

      // 分类选择
      h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '分类'),
        h('div', {
          style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }
        },
          CATEGORIES.shopping.map(cat =>
            h('button', {
              key: cat.key,
              onClick: () => { Haptics.selection(); setCategory(cat.key); },
              style: {
                padding: '8px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: category === cat.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: category === cat.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                transition: 'background-color 0.2s, color 0.2s',
              }
            }, `${cat.icon} ${cat.label}`)
          )
        )
      ),

      h(Input, {
        label: '购买地点',
        value: store,
        onChange: setStore,
        placeholder: '如：Costco',
      }),

      h(Input, {
        label: '备注',
        value: notes,
        onChange: setNotes,
        placeholder: '添加备注（可选）',
        multiline: true,
        rows: 2,
      }),

      h(Button, { fullWidth: true, onClick: handleSave }, item ? '保存' : '添加'),
    )
  );
}

window.ShoppingForm = ShoppingForm;

})();
