(function() {
/**
 * Personal Hub — 预算管理页面（Sheet 弹出）
 */

const { createElement: h, useState, useEffect } = React;

function BudgetPage({ open, onClose, categorySummary, month, onRefresh }) {
  const { showToast } = useApp();
  const [editingCat, setEditingCat] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (cat) => {
    setEditingCat(cat.key);
    setEditValue(String(cat.limit || ''));
  };

  const handleSave = async (catKey) => {
    const limit = parseFloat(editValue) || 0;
    await DAO.budgets.setBudget(catKey, month, limit);
    setEditingCat(null);
    onRefresh();
    showToast('预算已更新', 'success');
  };

  return h(Sheet, { open, onClose, title: `预算管理 · ${DateUtils.monthLabel(month)}` },
    h('div', null,
      h('div', {
        style: {
          fontSize: '13px',
          color: 'var(--color-text-tertiary)',
          padding: '0 0 var(--space-md)',
        }
      }, '为每个支出分类设置月度预算，进度条会实时显示使用情况。'),

      CATEGORIES.expense.map(cat => {
        const data = categorySummary[cat.key] || { ...cat, actual: 0, limit: 0, hasBudget: false };
        const isEditing = editingCat === cat.key;
        const percent = data.limit > 0 ? data.actual / data.limit : 0;

        return h(Card, {
          key: cat.key,
          style: { marginBottom: 'var(--space-sm)' },
          onClick: () => !isEditing && handleEdit(data),
        },
          h('div', {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-sm)',
            }
          },
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
              }
            },
              h('span', { style: { fontSize: '20px' } }, cat.icon),
              h('span', { style: { fontSize: '17px', fontWeight: 500 } }, cat.label),
            ),
            isEditing
              ? h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' } },
                  h('input', {
                    type: 'number',
                    value: editValue,
                    onChange: (e) => setEditValue(e.target.value),
                    autoFocus: true,
                    style: {
                      width: '80px',
                      fontSize: '17px',
                      textAlign: 'right',
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '6px 10px',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--color-text-primary)',
                    }
                  }),
                  h('button', {
                    onClick: (e) => { e.stopPropagation(); handleSave(cat.key); },
                    style: {
                      width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: 'var(--color-accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }
                  }, h(Icon, { name: 'check', size: 18, color: '#FFFFFF' }))
                )
              : h('span', {
                  style: {
                    fontSize: '15px',
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                  },
                  className: 'numeric'
                }, data.hasBudget ? `${FormatUtils.money(data.actual)} / ${FormatUtils.money(data.limit)}` : '设置预算 →')
          ),

          data.hasBudget && !isEditing && h(ProgressBar, { value: data.actual, max: data.limit }),
        )
      })
    )
  );
}

window.BudgetPage = BudgetPage;

})();
