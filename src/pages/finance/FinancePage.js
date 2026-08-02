(function() {
/**
 * Personal Hub — 记账主页面
 * 支持按日期浏览和按分类浏览
 */

const { createElement: h, useState, useEffect } = React;

function FinancePage() {
  const { dataVersion, refreshData, financeMonth, dispatch, ACTIONS, route, navigate, showToast } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [categorySummary, setCategorySummary] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('expense');
  const [editingTx, setEditingTx] = useState(null);
  const [viewMode, setViewMode] = useState('date'); // 'date' | 'category'
  const [selectedCategory, setSelectedCategory] = useState(null); // 点击分类后展开看明细
  const [fixedExpenseTotal, setFixedExpenseTotal] = useState(0);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('new=expense')) {
      setFormType('expense'); setEditingTx(null); setShowForm(true);
    } else if (hash.includes('new=income')) {
      setFormType('income'); setEditingTx(null); setShowForm(true);
    }
  }, [route]);

  useEffect(() => {
    loadData();
  }, [dataVersion, financeMonth]);

  const loadData = async () => {
    const [txs, sum, catSum, fixedTotal] = await Promise.all([
      DAO.transactions.getByMonth(financeMonth, 'personal'),
      DAO.transactions.getMonthlySummary(financeMonth, 'personal'),
      DAO.transactions.getCategorySummary(financeMonth, 'personal'),
      DAO.fixedExpense.getMonthlyTotal(financeMonth),
    ]);
    setTransactions(txs);
    setSummary(sum);
    setFixedExpenseTotal(fixedTotal);

    // 构建分类汇总
    const merged = {};
    for (const cat of CATEGORIES.expense) {
      merged[cat.key] = {
        ...cat,
        actual: catSum[cat.key]?.amount || 0,
        count: catSum[cat.key]?.count || 0,
      };
    }
    for (const cat of CATEGORIES.income) {
      merged[cat.key] = {
        ...cat,
        actual: catSum[cat.key]?.amount || 0,
        count: catSum[cat.key]?.count || 0,
      };
    }
    setCategorySummary(merged);
  };

  const handlePrevMonth = () => {
    Haptics.light();
    dispatch({ type: ACTIONS.SET_FINANCE_MONTH, payload: DateUtils.prevMonth(financeMonth) });
  };

  const handleNextMonth = () => {
    Haptics.light();
    dispatch({ type: ACTIONS.SET_FINANCE_MONTH, payload: DateUtils.nextMonth(financeMonth) });
  };

  const handleEdit = (tx) => {
    setEditingTx(tx); setFormType(tx.type); setShowForm(true);
  };

  const handleDelete = async (tx) => {
    // 分期记录：删除整组
    if (tx.recordType === 'installment' && tx.installmentGroupId) {
      const count = await DAO.transactions.deleteInstallmentGroup(tx.installmentGroupId);
      showToast(`已删除 ${count} 条分期记录`, 'success');
    } else if (tx.isVirtual && tx.parentId) {
      // 虚拟订阅记录 → 删除父记录
      await DAO.transactions.delete(tx.parentId);
      showToast('订阅已删除', 'success');
    } else {
      await DAO.transactions.delete(tx.id);
    }
    Haptics.warning();
    refreshData();
  };

  const handleCloseForm = () => {
    setShowForm(false); setEditingTx(null);
    if (window.location.hash.includes('new=')) navigate('/finance');
    refreshData();
  };

  const handleExportCSV = async () => {
    const allTx = await DAO.transactions.getAll('personal');
    if (allTx.length === 0) { showToast('没有数据可导出', 'warning'); return; }
    const csv = CSVUtils.transactionsToCSV(allTx.sort((a, b) => b.date.localeCompare(a.date)));
    CSVUtils.download(csv, CSVUtils.filename('transactions', 'csv'));
    showToast('CSV 已导出', 'success');
  };

  // 按日期分组
  const grouped = {};
  for (const tx of transactions) {
    if (!grouped[tx.date]) grouped[tx.date] = [];
    grouped[tx.date].push(tx);
  }
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // 按分类分组（支出分类）
  const expenseCatsWithdata = CATEGORIES.expense
    .map(cat => ({ ...cat, ...categorySummary[cat.key] }))
    .filter(c => c.actual > 0)
    .sort((a, b) => b.actual - a.actual);

  const incomeCatsWithData = CATEGORIES.income
    .map(cat => ({ ...cat, ...categorySummary[cat.key] }))
    .filter(c => c.actual > 0)
    .sort((a, b) => b.actual - a.actual);

  // 渲染单条交易
  const renderTransaction = (tx) => {
    const cat = tx.type === 'income'
      ? CATEGORIES.getIncomeCategory(tx.category)
      : CATEGORIES.getExpenseCategory(tx.category);

    // 标签
    let badge = null;
    if (tx.recordType === 'subscription') {
      const freqLabel = { daily: '日', weekly: '周', monthly: '月', yearly: '年' }[tx.recurring] || '';
      badge = h('span', { style: { fontSize: '11px', color: 'var(--color-accent)', backgroundColor: 'var(--color-bg-subtle)', padding: '1px 6px', borderRadius: 'var(--radius-pill)', marginLeft: '6px', flexShrink: 0 } }, `🔁${freqLabel}订`);
    } else if (tx.recordType === 'installment') {
      badge = h('span', { style: { fontSize: '11px', color: '#8B7EC8', backgroundColor: 'var(--color-bg-subtle)', padding: '1px 6px', borderRadius: 'var(--radius-pill)', marginLeft: '6px', flexShrink: 0 } }, `${tx.installmentNo}/${tx.installmentTotal}期`);
    }

    // Payment tag badge
    let payBadge = null;
    if (tx.paymentTag) {
      const pt = CATEGORIES.getPaymentTag(tx.paymentTag);
      if (pt) {
        payBadge = h('span', { style: { fontSize: '11px', backgroundColor: 'var(--color-bg-subtle)', padding: '1px 6px', borderRadius: 'var(--radius-pill)', marginLeft: '6px', flexShrink: 0 } }, pt.icon);
      }
    }

    return h('div', {
      key: tx.id,
      onClick: () => handleEdit(tx),
      style: {
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-xs)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
      }
    },
      h('div', { style: { fontSize: '24px', width: '32px', textAlign: 'center' } }, cat.icon),
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { style: { fontSize: '17px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center' } },
          h('span', null, cat.label),
          badge,
          payBadge
        ),
        tx.notes && h('div', {
          style: { fontSize: '13px', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
        }, tx.notes)
      ),
      h('span', {
        style: { fontSize: '17px', fontWeight: 600, color: tx.type === 'income' ? 'var(--color-complete)' : 'var(--color-text-primary)' },
        className: 'numeric'
      }, FormatUtils.moneyWithType(tx.amount, tx.type)),
      h('button', {
        onClick: (e) => { e.stopPropagation(); handleDelete(tx); },
        style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0 }
      }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
    );
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '记账', showBack: false,
      rightAction: h('button', {
        onClick: handleExportCSV,
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'download', size: 20, color: 'var(--color-accent)' }))
    }),

    h('div', { className: 'scroll-container page-with-action-bar' },
      // 月份选择
      h('div', {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-lg)', padding: 'var(--space-sm) 0 var(--space-md)' }
      },
        h('button', { onClick: handlePrevMonth, style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          h(Icon, { name: 'chevronLeft', size: 22, color: 'var(--color-text-secondary)' })),
        h('span', { style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' } }, DateUtils.monthLabel(financeMonth)),
        h('button', { onClick: handleNextMonth, style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          h(Icon, { name: 'chevronRight', size: 22, color: 'var(--color-text-secondary)' }))
      ),

      // 月度概览
      h(Card, { style: { marginBottom: 'var(--space-md)' } },
        // 固定支出行（始终显示，金额为0时也可进入编辑）
        h('div', {
          style: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-sm)',
            borderBottom: '1px solid var(--color-border-light)',
          },
        },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
            h('span', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } }, '固定支出'),
            h('span', { style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-deadline)' }, className: 'numeric' }, FormatUtils.money(fixedExpenseTotal)),
          ),
          h('button', {
            onClick: () => navigate('/finance/fixed-expense'),
            style: {
              display: 'flex', alignItems: 'center', gap: '3px',
              padding: '4px 10px', borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-bg-subtle)', border: 'none',
              fontSize: '12px', color: 'var(--color-text-secondary)', cursor: 'pointer',
            },
          }, '编辑', h(Icon, { name: 'chevronRight', size: 12, color: 'var(--color-text-tertiary)' })),
        ),
        h('div', { style: { display: 'flex', justifyContent: 'space-around', textAlign: 'center' } },
          h('div', null,
            h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '收入'),
            h('div', { style: { fontSize: '22px', fontWeight: 600, color: 'var(--color-complete)' }, className: 'numeric' }, FormatUtils.money(summary.income))
          ),
          h('div', null,
            h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '支出'),
            h('div', { style: { fontSize: '22px', fontWeight: 600, color: 'var(--color-deadline)' }, className: 'numeric' }, FormatUtils.money(summary.expense))
          ),
          h('div', null,
            h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '结余'),
            h('div', { style: { fontSize: '22px', fontWeight: 600, color: summary.balance >= 0 ? 'var(--color-accent)' : 'var(--color-deadline)' }, className: 'numeric' }, FormatUtils.money(summary.balance))
          ),
        )
      ),

      // 视图切换：按日期 / 按分类
      h('div', {
        style: { display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }
      },
        h('button', {
          onClick: () => { Haptics.selection(); setViewMode('date'); setSelectedCategory(null); },
          style: {
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            fontSize: '14px', fontWeight: 500,
            backgroundColor: viewMode === 'date' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: viewMode === 'date' ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, '按日期'),
        h('button', {
          onClick: () => { Haptics.selection(); setViewMode('category'); setSelectedCategory(null); },
          style: {
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            fontSize: '14px', fontWeight: 500,
            backgroundColor: viewMode === 'category' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: viewMode === 'category' ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, '按分类')
      ),

      // ===== 按日期视图 =====
      viewMode === 'date' && (
        transactions.length === 0
          ? h(EmptyState, { icon: '💰', title: '本月还没有记录', subtitle: '点击下方按钮快速记账' })
          : h('div', null,
              dates.map(date =>
                h('div', { key: date },
                  h('div', { className: 'section-header' },
                    h('span', null, DateUtils.friendlyDate(date)),
                    h('span', { className: 'count' },
                      FormatUtils.money(grouped[date].reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0), true)
                    )
                  ),
                  grouped[date].map(renderTransaction)
                )
              )
            )
      ),

      // ===== 按分类视图 =====
      viewMode === 'category' && (
        transactions.length === 0
          ? h(EmptyState, { icon: '💰', title: '本月还没有记录', subtitle: '点击下方按钮快速记账' })
          : h('div', null,
              // 支出分类
              h('div', { className: 'section-header' }, h('span', null, '支出'), h('span', { className: 'count' }, FormatUtils.money(summary.expense))),
              expenseCatsWithdata.map(cat => {
                const isSelected = selectedCategory === cat.key;
                const catTransactions = transactions.filter(t => t.category === cat.key);
                const maxAmount = Math.max(...expenseCatsWithdata.map(c => c.actual), 1);

                return h('div', { key: cat.key },
                  // 分类汇总行
                  h(Card, {
                    onClick: () => { Haptics.light(); setSelectedCategory(isSelected ? null : cat.key); },
                    style: { marginBottom: 'var(--space-xs)' }
                  },
                    h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)' } },
                      h('div', { style: { fontSize: '24px', width: '32px', textAlign: 'center' } }, cat.icon),
                      h('div', { style: { flex: 1 } },
                        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                          h('span', { style: { fontSize: '17px', fontWeight: 500 } }, cat.label),
                          h('span', { style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' }, className: 'numeric' },
                            FormatUtils.money(cat.actual)
                          )
                        ),
                        // 占比条
                        h('div', { style: { marginTop: '6px' } },
                          h(ProgressBar, { value: cat.actual, max: maxAmount, height: 4 })
                        ),
                        h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '3px' } },
                          `${cat.count} 笔 · ${FormatUtils.percent(cat.actual / summary.expense)}`
                        )
                      ),
                      h(Icon, { name: isSelected ? 'chevronDown' : 'chevronRight', size: 18, color: 'var(--color-text-tertiary)' })
                    )
                  ),
                  // 展开后的交易明细
                  isSelected && catTransactions.map(renderTransaction)
                );
              }),

              // 收入分类
              incomeCatsWithData.length > 0 && h('div', null,
                h('div', { className: 'section-header' }, h('span', null, '收入'), h('span', { className: 'count' }, FormatUtils.money(summary.income))),
                incomeCatsWithData.map(cat => {
                  const isSelected = selectedCategory === cat.key;
                  const catTransactions = transactions.filter(t => t.category === cat.key);
                  return h('div', { key: cat.key },
                    h(Card, {
                      onClick: () => { Haptics.light(); setSelectedCategory(isSelected ? null : cat.key); },
                      style: { marginBottom: 'var(--space-xs)' }
                    },
                      h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)' } },
                        h('div', { style: { fontSize: '24px', width: '32px', textAlign: 'center' } }, cat.icon),
                        h('div', { style: { flex: 1 } },
                          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                            h('span', { style: { fontSize: '17px', fontWeight: 500 } }, cat.label),
                            h('span', { style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-complete)' }, className: 'numeric' },
                              FormatUtils.money(cat.actual)
                            )
                          ),
                          h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' } },
                            `${cat.count} 笔`
                          )
                        ),
                        h(Icon, { name: isSelected ? 'chevronDown' : 'chevronRight', size: 18, color: 'var(--color-text-tertiary)' })
                      )
                    ),
                    isSelected && catTransactions.map(renderTransaction)
                  );
                })
              )
            )
      )
    ),

    // 底部快捷操作 — Action Bar（固定在 Bottom Nav 上方）
    h('div', { className: 'action-bar' },
      h(Button, { variant: 'danger', size: 'compact', fullWidth: true,
        onClick: () => { Haptics.light(); setFormType('expense'); setEditingTx(null); setShowForm(true); }
      }, '支出'),
      h(Button, { variant: 'primary', size: 'compact', fullWidth: true,
        onClick: () => { Haptics.light(); setFormType('income'); setEditingTx(null); setShowForm(true); }
      }, '收入'),
    ),

    h(TransactionForm, { open: showForm, onClose: handleCloseForm, type: formType, transaction: editingTx })
  );
}

window.FinancePage = FinancePage;

})();
