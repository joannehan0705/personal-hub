(function() {
/**
 * Personal Hub — Wishlist 新增/编辑表单
 * 字段：名称、预计价格、购买链接、备注
 */

const { createElement: h, useState, useEffect } = React;

function WishlistForm({ open, onClose, item }) {
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name || '');
        setEstimatedPrice(item.estimatedPrice ? String(item.estimatedPrice) : '');
        setLink(item.link || '');
        setNotes(item.notes || '');
      } else {
        setName('');
        setEstimatedPrice('');
        setLink('');
        setNotes('');
      }
    }
  }, [open, item]);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('请输入名称', 'warning');
      return;
    }

    const data = {
      name: name.trim(),
      estimatedPrice: parseFloat(estimatedPrice) || 0,
      link: link.trim(),
      notes: notes.trim(),
    };

    if (item) {
      await DAO.wishlist.update(item.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.wishlist.create({ ...data, purchased: false, purchasedAt: null, archived: false });
      showToast('已添加', 'success');
    }
    Haptics.success();
    onClose();
  };

  return h(Sheet, { open, onClose, title: item ? '编辑 Wishlist' : '新增 Wishlist' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      h(Input, {
        label: '名称',
        value: name,
        onChange: setName,
        placeholder: '想买的东西...',
        required: true,
      }),

      h(Input, {
        label: '预计价格',
        value: estimatedPrice,
        onChange: setEstimatedPrice,
        placeholder: '0',
        type: 'number',
      }),

      h(Input, {
        label: '购买链接',
        value: link,
        onChange: setLink,
        placeholder: 'https://...',
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

window.WishlistForm = WishlistForm;

})();
