(function() {
/**
 * Personal Hub — 产品新增/编辑表单
 */

const { createElement: h, useState, useEffect } = React;

function ProductForm({ open, onClose, product }) {
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState('classic');

  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name || '');
        setDescription(product.description || '');
        setPrice(product.price != null ? String(product.price) : '');
        setCost(product.cost != null ? String(product.cost) : '');
        setCategory(product.category || 'classic');
      } else {
        setName('');
        setDescription('');
        setPrice('');
        setCost('');
        setCategory('classic');
      }
    }
  }, [open, product]);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('请输入产品名称', 'warning');
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      category,
      active: true,
    };

    if (product) {
      await DAO.products.update(product.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.products.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    onClose();
  };

  return h(Sheet, { open, onClose, title: product ? '编辑产品' : '新增产品' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      h(Input, {
        label: '名称',
        value: name,
        onChange: setName,
        placeholder: '输入产品名称',
        required: true,
      }),

      h(Input, {
        label: '描述',
        value: description,
        onChange: setDescription,
        placeholder: '简短描述（可选）',
        multiline: true,
        rows: 2,
      }),

      h(Input, {
        label: '单价',
        value: price,
        onChange: setPrice,
        placeholder: '0',
        type: 'number',
      }),

      h(Input, {
        label: '成本',
        value: cost,
        onChange: setCost,
        placeholder: '0',
        type: 'number',
      }),

      // 分类选择器
      h('div', null,
        h('label', {
          style: {
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            paddingLeft: 'var(--space-xs)',
            display: 'block',
            marginBottom: 'var(--space-xs)',
          }
        }, '分类'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
          CATEGORIES.product.map(cat =>
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
              }
            }, `${cat.icon} ${cat.label}`)
          )
        )
      ),

      h(Button, { fullWidth: true, onClick: handleSave }, product ? '保存' : '添加'),
    )
  );
}

window.ProductForm = ProductForm;

})();
