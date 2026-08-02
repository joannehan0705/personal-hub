(function() {
/**
 * Personal Hub — 固定收入管理页面
 * 管理每月固定收入记录（不算入收支结余，仅显示）
 */

const { createElement: h, useState, useEffect } = React;

function FixedIncomePage() {
  const { showToast, navigate, financeMonth } = useApp();
  const [records, setRecords] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    loadData();
  }, [financeMonth]);

  const loadData = async () => {
    const [all, activeTotal] = await Promise.all([
      DAO.fixedIncome.getAll(),
      DAO.fixedIncome.getMonthlyTotal(financeMonth),
    ]);
    // 按开始日期降序排列
    all.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    setRecords(all);
    setMonthlyTotal(activeTotal);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (record) => {
    await DAO.fixedIncome.delete(record.id);
    Haptics.warning();
    showToast('已删除', 'success');
    loadData();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    loadData();
  };

  // 渲染单条固定收入 card
  const renderRecord = (record) => {
    const pt = record.paymentTag ? CATEGORIES.getPaymentTag(record.paymentTag) : null;

    return h('div', {
      key: record.id,
      onClick: () => handleEdit(record),
      style: {
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-xs)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
        cursor: 'pointer',
      }
    },
      h('div', { style: { fontSize: '24px', width: '32px', textAlign: 'center' } }, '💰'),
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { style: { fontSize: '17px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center' } },
          h('span', null, record.description || '未命名'),
          pt && h('span', { style: { fontSize: '11px', backgroundColor: 'var(--color-bg-subtle)', padding: '1px 6px', borderRadius: 'var(--radius-pill)', marginLeft: '6px', flexShrink: 0 } }, pt.icon),
        ),
        h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } },
          `${DateUtils.friendlyDate(record.startDate)} – ${record.endDate ? DateUtils.friendlyDate(record.endDate) : '持续'}`
        ),
      ),
      h('span', {
        style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-complete)', flexShrink: 0 },
        className: 'numeric'
      }, FormatUtils.money(record.amount)),
      h('button', {
        onClick: (e) => { e.stopPropagation(); handleDelete(record); },
        style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0 }
      }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
    );
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, { title: '固定收入', showBack: true }),

    h('div', { className: 'scroll-container page-with-action-bar' },
      // 当月固定收入总额
      h(Card, { style: { marginBottom: 'var(--space-md)' } },
        h('div', { style: { textAlign: 'center', padding: 'var(--space-sm) 0' } },
          h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, `${DateUtils.monthLabel(financeMonth)} 固定收入`),
          h('div', { style: { fontSize: '28px', fontWeight: 700, color: 'var(--color-complete)' }, className: 'numeric' }, FormatUtils.money(monthlyTotal)),
        ),
      ),

      // 说明
      h('div', {
        style: { fontSize: '12px', color: 'var(--color-text-tertiary)', padding: '0 var(--space-xs) var(--space-md)', textAlign: 'center' }
      }, '固定收入仅显示在生活记账的概览中，不计入收支结余'),

      // 记录列表
      records.length === 0
        ? h(EmptyState, { icon: '💰', title: '还没有固定收入记录', subtitle: '点击下方按钮添加' })
        : h('div', null, records.map(renderRecord)),
    ),

    // 底部添加按钮
    h('div', { className: 'action-bar' },
      h(Button, { variant: 'primary', fullWidth: true,
        onClick: () => { Haptics.light(); setEditingRecord(null); setShowForm(true); }
      }, '添加固定收入'),
    ),

    h(FixedIncomeForm, { open: showForm, onClose: handleCloseForm, record: editingRecord })
  );
}

// ===== 固定收入编辑表单 =====

function FixedIncomeForm({ open, onClose, record }) {
  const { showToast } = useApp();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(DateUtils.today());
  const [endDate, setEndDate] = useState('');
  const [paymentTag, setPaymentTag] = useState(null);

  useEffect(() => {
    if (open) {
      if (record) {
        setAmount(String(record.amount));
        setDescription(record.description || '');
        setStartDate(record.startDate || DateUtils.today());
        setEndDate(record.endDate || '');
        setPaymentTag(record.paymentTag || null);
      } else {
        setAmount('');
        setDescription('');
        setStartDate(DateUtils.today());
        setEndDate('');
        setPaymentTag(null);
      }
    }
  }, [open, record]);

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast('请输入有效金额', 'warning');
      return;
    }
    if (!description.trim()) {
      showToast('请输入描述', 'warning');
      return;
    }
    if (!startDate) {
      showToast('请选择开始日期', 'warning');
      return;
    }
    if (endDate && endDate < startDate) {
      showToast('截止日期不能早于开始日期', 'warning');
      return;
    }

    const data = {
      amount: amt,
      description: description.trim(),
      startDate,
      endDate: endDate || null,
      paymentTag,
    };

    if (record) {
      await DAO.fixedIncome.update(record.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.fixedIncome.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    onClose();
  };

  const handleDelete = async () => {
    if (!record) return;
    await DAO.fixedIncome.delete(record.id);
    Haptics.warning();
    showToast('已删除', 'success');
    onClose();
  };

  const labelStyle = {
    fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)',
    paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)',
  };

  return h(Sheet, { open, onClose, title: record ? '编辑固定收入' : '新增固定收入' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      // 金额
      h('div', null,
        h('label', { style: labelStyle }, '金额'),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' } },
          h('span', { style: { fontSize: '24px', color: 'var(--color-text-tertiary)' } }, '$'),
          h('input', {
            type: 'number',
            value: amount,
            onChange: (e) => setAmount(e.target.value),
            placeholder: '0',
            style: {
              flex: 1, fontSize: '24px', fontWeight: 700,
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px', border: 'none', outline: 'none',
              color: 'var(--color-text-primary)',
            }
          }),
        ),
      ),

      // 描述
      h(Input, {
        label: '描述',
        value: description,
        onChange: setDescription,
        placeholder: '如 工资、租金收入等...',
      }),

      // 开始日期
      h(Input, {
        label: '开始日期',
        value: startDate,
        onChange: setStartDate,
        type: 'date',
      }),

      // 截止日期
      h(Input, {
        label: '截止日期（可选）',
        value: endDate,
        onChange: setEndDate,
        type: 'date',
        placeholder: '不选则持续到手动取消',
      }),

      // Payment Tag
      h('div', null,
        h('label', { style: labelStyle }, 'Payment'),
        h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
          h('button', {
            onClick: () => { Haptics.selection(); setPaymentTag(null); },
            style: {
              padding: '8px 14px', borderRadius: 'var(--radius-pill)',
              fontSize: '14px', fontWeight: 500,
              backgroundColor: !paymentTag ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
              color: !paymentTag ? '#FFFFFF' : 'var(--color-text-secondary)',
            }
          }, '无'),
          CATEGORIES.paymentTags.map(tag =>
            h('button', {
              key: tag.key,
              onClick: () => { Haptics.selection(); setPaymentTag(paymentTag === tag.key ? null : tag.key); },
              style: {
                padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                fontSize: '14px', fontWeight: 500,
                backgroundColor: paymentTag === tag.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: paymentTag === tag.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, `${tag.icon} ${tag.label}`)
          )
        ),
      ),

      h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
        record && h(Button, { variant: 'danger', fullWidth: true, onClick: handleDelete }, '删除'),
        h(Button, { fullWidth: true, onClick: handleSave }, record ? '保存' : '添加'),
      ),
    )
  );
}

window.FixedIncomePage = FixedIncomePage;

})();
