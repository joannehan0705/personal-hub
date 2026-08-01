(function() {
/**
 * Personal Hub — 泡芙菜单新增/编辑表单
 * Monthly Favorite（多选产品）+ Weekly Selection（多选产品）+ 备注
 */

const { createElement: h, useState, useEffect } = React;

function MenuForm({ open, onClose, menu, products }) {
  const { showToast } = useApp();
  const [date, setDate] = useState(DateUtils.today());
  const [monthlyFavorites, setMonthlyFavorites] = useState([]);
  const [weeklySelection, setWeeklySelection] = useState([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (menu) {
        setDate(menu.date || DateUtils.today());
        setMonthlyFavorites(menu.monthlyFavorites || []);
        setWeeklySelection(menu.weeklySelection || []);
        setNotes(menu.notes || '');
      } else {
        setDate(DateUtils.today());
        setMonthlyFavorites([]);
        setWeeklySelection([]);
        setNotes('');
      }
    }
  }, [open, menu]);

  const toggleProduct = (productId, list, setList) => {
    Haptics.selection();
    if (list.includes(productId)) {
      setList(list.filter(id => id !== productId));
    } else {
      setList([...list, productId]);
    }
  };

  const handleSave = async () => {
    const data = {
      date,
      monthlyFavorites,
      weeklySelection,
      notes: notes.trim(),
      archived: menu?.archived || false,
    };

    if (menu) {
      await DAO.menus.update(menu.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.menus.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    onClose();
  };

  return h(Sheet, { open, onClose, title: menu ? '编辑菜单' : '新增菜单' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      h(Input, {
        label: '日期',
        value: date,
        onChange: setDate,
        type: 'date',
      }),

      // Monthly Favorite 多选
      h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '⭐ Monthly Favorite'),
        products.length === 0
          ? h('div', { style: { fontSize: '14px', color: 'var(--color-text-tertiary)' } }, '还没有产品，先去产品页面创建')
          : h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
            products.map(p =>
              h('button', {
                key: p.id,
                onClick: () => toggleProduct(p.id, monthlyFavorites, setMonthlyFavorites),
                style: {
                  padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                  fontSize: '14px', fontWeight: 500,
                  backgroundColor: monthlyFavorites.includes(p.id) ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: monthlyFavorites.includes(p.id) ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, `${CATEGORIES.getProductCategory(p.category).icon} ${p.name}`)
            )
          )
      ),

      // Weekly Selection 多选
      h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '📅 Weekly Selection'),
        products.length === 0
          ? h('div', { style: { fontSize: '14px', color: 'var(--color-text-tertiary)' } }, '还没有产品，先去产品页面创建')
          : h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
            products.map(p =>
              h('button', {
                key: p.id,
                onClick: () => toggleProduct(p.id, weeklySelection, setWeeklySelection),
                style: {
                  padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                  fontSize: '14px', fontWeight: 500,
                  backgroundColor: weeklySelection.includes(p.id) ? 'var(--color-today)' : 'var(--color-bg-subtle)',
                  color: weeklySelection.includes(p.id) ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, `${CATEGORIES.getProductCategory(p.category).icon} ${p.name}`)
            )
          )
      ),

      h(Input, {
        label: '备注',
        value: notes,
        onChange: setNotes,
        placeholder: '添加备注（可选）',
        multiline: true,
        rows: 2,
      }),

      h(Button, { fullWidth: true, onClick: handleSave }, menu ? '保存' : '添加'),
    )
  );
}

window.MenuForm = MenuForm;

})();
