(function() {
/**
 * Personal Hub — 泡芙品牌记账子模块（独立分类，scope='puff'）
 * V2 更新：整合累计统计，支持本月/累计切换
 */

const { createElement: h, useState, useEffect } = React;

function PuffFinancePage() {
  const { dataVersion, refreshData, financeMonth, dispatch, ACTIONS, navigate, showToast } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [summaryMode, setSummaryMode] = useState('month'); // 'month' | 'allTime'
  const [allTimeSummary, setAllTimeSummary] = useState({ income: 0, expense: 0, profit: 0 });
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('expense');
  const [editingTx, setEditingTx] = useState(null);
  const [viewMode, setViewMode] = useState('date');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadData();
  }, [dataVersion, financeMonth]);

  const loadData = async () => {
    const [puffTx, sum, allPuffTx] = await Promise.all([
      DAO.transactions.getByMonth(financeMonth, 'puff'),
      DAO.transactions.getMonthlySummary(financeMonth, 'puff'),
      DAO.transactions.getAll('puff'),
    ]);
    setTransactions(puffTx);
    setSummary(sum);

    // 累计统计：直接使用全部泡芙记账数据
    let income = 0, expense = 0;
    for (const t of allPuffTx) {
      if (t.type === 'income') income += t.amount || 0;
      else expense += t.amount || 0;
    }
    setAllTimeSummary({ income, expense, profit: income - expense });
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
    if (tx.recordType === 'installment' && tx.installmentGroupId) {
      const count = await DAO.transactions.deleteInstallmentGroup(tx.installmentGroupId);
      showToast(`已删除 ${count} 条分期记录`, 'success');
    } else if (tx.isVirtual && tx.parentId) {
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
    refreshData();
  };

  const handleExportCSV = async () => {
    if (transactions.length === 0) { showToast('没有数据可导出', 'warning'); return; }
    const csv = CSVUtils.transactionsToCSV(transactions);
    CSVUtils.download(csv, CSVUtils.filename('puff-finance', 'csv'));
    showToast('CSV 已导出', 'success');
  };

  // 按日期分组
  const grouped = {};
  for (const tx of transactions) {
    if (!grouped[tx.date]) grouped[tx.date] = [];
    grouped[tx.date].push(tx);
  }
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // 按分类分组
  const catMap = {};
  for (const tx of transactions) {
    if (!catMap[tx.category]) {
      const cat = tx.type === 'income'
        ? CATEGORIES.getPuffIncomeCategory(tx.category)
        : CATEGORIES.getPuffExpenseCategory(tx.category);
      catMap[tx.category] = { ...cat, actual: 0, count: 0, type: tx.type };
    }
    catMap[tx.category].actual += tx.amount;
    catMap[tx.category].count++;
  }
  const catList = Object.values(catMap).sort((a, b) => b.actual - a.actual);

  // 当前展示的汇总数据
  const currentSummary = summaryMode === 'month' ? summary : allTimeSummary;
  const isAllTime = summaryMode === 'allTime';

  const renderTransaction = (tx) => {
    const cat = tx.type === 'income'
      ? CATEGORIES.getPuffIncomeCategory(tx.category)
      : CATEGORIES.getPuffExpenseCategory(tx.category);

    // 标签
    let badge = null;
    if (tx.recordType === 'subscription') {
      const freqLabel = { daily: '日', weekly: '周', monthly: '月', yearly: '年' }[tx.recurring] || '';
      badge = h('span', { style: { fontSize: '11px', color: 'var(--color-accent)', backgroundColor: 'var(--color-bg-subtle)', padding: '1px 6px', borderRadius: 'var(--radius-pill)', marginLeft: '6px', flexShrink: 0 } }, `🔁${freqLabel}订`);
    } else if (tx.recordType === 'installment') {
      badge = h('span', { style: { fontSize: '11px', color: '#8B7EC8', backgroundColor: 'var(--color-bg-subtle)', padding: '1px 6px', borderRadius: 'var(--radius-pill)', marginLeft: '6px', flexShrink: 0 } }, `${tx.installmentNo}/${tx.installmentTotal}期`);
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
          badge
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
      title: '泡芙记账', showBack: true,
      rightAction: h('button', {
        onClick: handleExportCSV,
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'download', size: 20, color: 'var(--color-accent)' }))
    }),

    h('div', { className: 'scroll-container page-with-action-bar' },
      // 月份选择（仅在「本月」模式显示）
      !isAllTime && h('div', {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-lg)', padding: 'var(--space-sm) 0 var(--space-md)' }
      },
        h('button', { onClick: handlePrevMonth, style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          h(Icon, { name: 'chevronLeft', size: 22, color: 'var(--color-text-secondary)' })),
        h('span', { style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' } }, DateUtils.monthLabel(financeMonth)),
        h('button', { onClick: handleNextMonth, style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          h(Icon, { name: 'chevronRight', size: 22, color: 'var(--color-text-secondary)' }))
      ),

      // 本月｜累计 切换
      h('div', {
        style: { display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }
      },
        h('button', {
          onClick: () => { Haptics.selection(); setSummaryMode('month'); },
          style: {
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            fontSize: '14px', fontWeight: 500,
            backgroundColor: summaryMode === 'month' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: summaryMode === 'month' ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, '本月'),
        h('button', {
          onClick: () => { Haptics.selection(); setSummaryMode('allTime'); },
          style: {
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            fontSize: '14px', fontWeight: 500,
            backgroundColor: summaryMode === 'allTime' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: summaryMode === 'allTime' ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, '累计')
      ),

      // 统计概览
      h(Card, { style: { marginBottom: 'var(--space-md)' } },
        h('div', { style: { display: 'flex', justifyContent: 'space-around', textAlign: 'center' } },
          h('div', null,
            h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, isAllTime ? '累计总收入' : '收入'),
            h('div', { style: { fontSize: '22px', fontWeight: 600, color: 'var(--color-complete)' }, className: 'numeric' }, FormatUtils.money(currentSummary.income))
          ),
          h('div', null,
            h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, isAllTime ? '累计总支出' : '支出'),
            h('div', { style: { fontSize: '22px', fontWeight: 600, color: 'var(--color-deadline)' }, className: 'numeric' }, FormatUtils.money(currentSummary.expense))
          ),
          h('div', null,
            h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, isAllTime ? '累计总盈利' : '利润'),
            h('div', { style: { fontSize: '22px', fontWeight: 600, color: currentSummary.balance >= 0 || currentSummary.profit >= 0 ? 'var(--color-accent)' : 'var(--color-deadline)' }, className: 'numeric' },
              FormatUtils.money(isAllTime ? currentSummary.profit : currentSummary.balance)
            )
          ),
        )
      ),

      // 视图切换
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

      // 按日期视图
      viewMode === 'date' && (
        transactions.length === 0
          ? h(EmptyState, { icon: '🧁', title: isAllTime ? '还没有泡芙收支记录' : '本月还没有泡芙收支记录', subtitle: '点击下方按钮记录' })
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

      // 按分类视图
      viewMode === 'category' && (
        transactions.length === 0
          ? h(EmptyState, { icon: '🧁', title: isAllTime ? '还没有泡芙收支记录' : '本月还没有泡芙收支记录', subtitle: '点击下方按钮记录' })
          : h('div', null,
              catList.map(cat => {
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
                          h('span', {
                            style: { fontSize: '17px', fontWeight: 600, color: cat.type === 'income' ? 'var(--color-complete)' : 'var(--color-text-primary)' },
                            className: 'numeric'
                          }, FormatUtils.moneyWithType(cat.actual, cat.type))
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
    ),

    // 底部快捷操作 — Action Bar（固定在 Bottom Nav 上方）
    h('div', { className: 'action-bar' },
      h(Button, { variant: 'danger', size: 'compact', fullWidth: true,
        onClick: () => { Haptics.light(); setFormType('expense'); setEditingTx(null); setShowForm(true); }
      }, '泡芙支出'),
      h(Button, { variant: 'primary', size: 'compact', fullWidth: true,
        onClick: () => { Haptics.light(); setFormType('income'); setEditingTx(null); setShowForm(true); }
      }, '泡芙收入'),
    ),

    h(PuffTransactionForm, { open: showForm, onClose: handleCloseForm, type: formType, transaction: editingTx })
  );
}

window.PuffFinancePage = PuffFinancePage;

})();
