(function() {
/**
 * Personal Hub — 收支记录表单（生活记账）
 * 支持普通记录、订阅、分期
 */

const { createElement: h, useState, useEffect } = React;

function TransactionForm({ open, onClose, type: initialType, transaction }) {
  const { showToast } = useApp();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(DateUtils.today());
  const [notes, setNotes] = useState('');

  // 记录类型: normal | subscription | installment
  const [recordType, setRecordType] = useState('normal');

  // 订阅字段
  const [recurring, setRecurring] = useState('monthly');
  const [recurringEndDate, setRecurringEndDate] = useState('');

  // 分期字段
  const [installmentTotal, setInstallmentTotal] = useState('3');

  useEffect(() => {
    if (open) {
      if (transaction) {
        setType(transaction.type);
        setAmount(String(transaction.amount));
        setCategory(transaction.category);
        setDate(transaction.date);
        setNotes(transaction.notes || '');
        setRecordType(transaction.recordType === 'subscription' || transaction.recordType === 'installment' ? transaction.recordType : 'normal');
        setRecurring(transaction.recurring || 'monthly');
        setRecurringEndDate(transaction.recurringEndDate || '');
        setInstallmentTotal(String(transaction.installmentTotal || '3'));
      } else {
        setType(initialType || 'expense');
        setAmount('');
        setCategory(initialType === 'income' ? 'salary' : 'food');
        setDate(DateUtils.today());
        setNotes('');
        setRecordType('normal');
        setRecurring('monthly');
        setRecurringEndDate('');
        setInstallmentTotal('3');
      }
    }
  }, [open, transaction, initialType]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === 'income' ? 'salary' : 'food');
    Haptics.selection();
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast('请输入有效金额', 'warning');
      return;
    }

    // 分期：每期金额 = 总额 / 期数
    const installNum = parseInt(installmentTotal);
    if (recordType === 'installment') {
      if (!installNum || installNum < 2) {
        showToast('分期至少 2 期', 'warning');
        return;
      }
      const perAmount = Math.round((amt / installNum) * 100) / 100;

      const data = {
        type,
        amount: perAmount,
        category,
        date,
        notes: notes.trim(),
        scope: 'personal',
        recordType: 'installment',
        installmentTotal: installNum,
        originalAmount: amt,
      };

      await DAO.transactions.createInstallment(data, installNum);
      showToast(`已创建 ${installNum} 期分期记录`, 'success');
      Haptics.success();
      onClose();
      return;
    }

    const data = {
      type,
      amount: amt,
      category,
      date,
      notes: notes.trim(),
      scope: 'personal',
      recordType,
    };

    if (recordType === 'subscription') {
      data.recurring = recurring;
      data.recurringEndDate = recurringEndDate || null;
    }

    if (transaction) {
      // 编辑订阅记录
      if (transaction.isVirtual) {
        // 虚拟记录 → 更新父记录
        await DAO.transactions.update(transaction.parentId, data);
      } else {
        await DAO.transactions.update(transaction.id, data);
      }
      showToast('已更新', 'success');
    } else {
      await DAO.transactions.create(data);
      showToast(recordType === 'subscription' ? '订阅已创建' : '已记录', 'success');
    }
    Haptics.success();
    onClose();
  };

  const handleDelete = async () => {
    if (!transaction) return;

    if (transaction.recordType === 'installment' && transaction.installmentGroupId) {
      // 分期：删除全部
      const count = await DAO.transactions.deleteInstallmentGroup(transaction.installmentGroupId);
      showToast(`已删除 ${count} 条分期记录`, 'success');
    } else if (transaction.isVirtual && transaction.parentId) {
      // 虚拟订阅记录 → 删除父记录
      await DAO.transactions.delete(transaction.parentId);
      showToast('订阅已删除', 'success');
    } else {
      await DAO.transactions.delete(transaction.id);
      showToast('已删除', 'success');
    }
    Haptics.warning();
    onClose();
  };

  const cats = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  const recurringOptions = [
    { key: 'daily',   label: '每天' },
    { key: 'weekly',  label: '每周' },
    { key: 'monthly', label: '每月' },
    { key: 'yearly',  label: '每年' },
  ];

  // 分期预览
  const installNum = parseInt(installmentTotal) || 1;
  const perAmount = amount ? (Math.round((parseFloat(amount) / installNum) * 100) / 100).toFixed(2) : '0';

  return h(Sheet, { open, onClose, title: transaction ? '编辑记录' : '新增记录' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      // 类型切换
      h('div', {
        style: {
          display: 'flex',
          gap: 'var(--space-sm)',
          backgroundColor: 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '3px',
        }
      },
        h('button', {
          onClick: () => handleTypeChange('expense'),
          style: {
            flex: 1, padding: '10px', borderRadius: '6px',
            fontSize: '15px', fontWeight: 600,
            backgroundColor: type === 'expense' ? 'var(--color-deadline)' : 'transparent',
            color: type === 'expense' ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, '支出'),
        h('button', {
          onClick: () => handleTypeChange('income'),
          style: {
            flex: 1, padding: '10px', borderRadius: '6px',
            fontSize: '15px', fontWeight: 600,
            backgroundColor: type === 'income' ? 'var(--color-complete)' : 'transparent',
            color: type === 'income' ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, '收入')
      ),

      // 金额输入
      h('div', { style: { textAlign: 'center', padding: 'var(--space-lg) 0' } },
        h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-xs)' } },
          recordType === 'installment' ? '总金额' : '金额'),
        h('div', {
          style: {
            fontSize: '42px', fontWeight: 700,
            color: type === 'income' ? 'var(--color-complete)' : 'var(--color-text-primary)',
          },
          className: 'numeric'
        },
          h('span', { style: { fontSize: '24px', fontWeight: 400, color: 'var(--color-text-tertiary)' } }, '$'),
          amount || '0'
        ),
        h('input', {
          type: 'number',
          value: amount,
          onChange: (e) => setAmount(e.target.value),
          placeholder: '0',
          style: {
            fontSize: '20px', textAlign: 'center',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px', marginTop: 'var(--space-sm)',
            width: '100%', border: 'none', outline: 'none',
            color: 'var(--color-text-primary)',
          }
        }),
        // 分期预览
        recordType === 'installment' && amount && h('div', {
          style: { fontSize: '13px', color: 'var(--color-accent)', marginTop: 'var(--space-xs)', fontWeight: 500 }
        }, `每期 $${perAmount} × ${installNum} 期`),
      ),

      // 分类选择
      h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '分类'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
          cats.map(cat =>
            h('button', {
              key: cat.key,
              onClick: () => { Haptics.selection(); setCategory(cat.key); },
              style: {
                padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                fontSize: '14px', fontWeight: 500,
                backgroundColor: category === cat.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: category === cat.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, `${cat.icon} ${cat.label}`)
          )
        )
      ),

      // 记录类型选择（仅新建时）
      !transaction && h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '记录类型'),
        h('div', {
          style: { display: 'flex', gap: 'var(--space-xs)' }
        },
          [
            { key: 'normal',       label: '普通',   icon: '📝' },
            { key: 'subscription', label: '订阅',   icon: '🔁' },
            { key: 'installment',  label: '分期',   icon: '📅' },
          ].map(opt =>
            h('button', {
              key: opt.key,
              onClick: () => { Haptics.selection(); setRecordType(opt.key); },
              style: {
                flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                fontSize: '14px', fontWeight: 500,
                backgroundColor: recordType === opt.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: recordType === opt.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, `${opt.icon} ${opt.label}`)
          )
        )
      ),

      // 订阅设置
      recordType === 'subscription' && h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' } },
        h('div', null,
          h('label', {
            style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
          }, '重复频率'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
            recurringOptions.map(opt =>
              h('button', {
                key: opt.key,
                onClick: () => { Haptics.selection(); setRecurring(opt.key); },
                style: {
                  padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                  fontSize: '14px', fontWeight: 500,
                  backgroundColor: recurring === opt.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: recurring === opt.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, opt.label)
            )
          )
        ),
        h(Input, {
          label: '结束日期（可选）',
          value: recurringEndDate,
          onChange: setRecurringEndDate,
          type: 'date',
          placeholder: '不选则持续到手动取消',
        })
      ),

      // 分期设置
      recordType === 'installment' && !transaction && h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '分期数'),
        h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
          [2, 3, 6, 12].map(n =>
            h('button', {
              key: n,
              onClick: () => { Haptics.selection(); setInstallmentTotal(String(n)); },
              style: {
                flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                fontSize: '15px', fontWeight: 500,
                backgroundColor: installmentTotal === String(n) ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: installmentTotal === String(n) ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, `${n} 期`)
          )
        )
      ),

      h(Input, {
        label: recordType === 'subscription' ? '开始日期' : '日期',
        value: date,
        onChange: setDate,
        type: 'date',
      }),

      h(Input, {
        label: '备注',
        value: notes,
        onChange: setNotes,
        placeholder: '添加备注（可选）',
        multiline: true,
        rows: 2,
      }),

      h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
        transaction && h(Button, { variant: 'danger', fullWidth: true, onClick: handleDelete }, '删除'),
        h(Button, { fullWidth: true, onClick: handleSave }, transaction ? '保存' : '记录'),
      ),
    )
  );
}

window.TransactionForm = TransactionForm;

})();
