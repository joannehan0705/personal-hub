(function() {
/**
 * Personal Hub — 泡芙收支统计页面
 * 全时段统计：总收入、总支出、总利润 + 按分类汇总
 */

const { createElement: h, useState, useEffect } = React;

function PuffStatsPage() {
  const { dataVersion, navigate } = useApp();
  const [allSummary, setAllSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  useEffect(() => { loadData(); }, [dataVersion]);

  const loadData = async () => {
    // 全时段统计
    const allTx = await DAO.transactions.getAll('puff');
    let income = 0, expense = 0;
    const catMap = {};

    for (const t of allTx) {
      if (t.type === 'income') income += t.amount || 0;
      else expense += t.amount || 0;

      if (!catMap[t.category]) {
        const cat = t.type === 'income'
          ? CATEGORIES.getPuffIncomeCategory(t.category)
          : CATEGORIES.getPuffExpenseCategory(t.category);
        catMap[t.category] = { ...cat, actual: 0, count: 0, type: t.type };
      }
      catMap[t.category].actual += t.amount || 0;
      catMap[t.category].count++;
    }

    setAllSummary({ income, expense, balance: income - expense });
    setCategoryBreakdown(Object.values(catMap).sort((a, b) => b.actual - a.actual));

    // 按月统计趋势（最近12个月）
    const currentMonth = DateUtils.currentMonth();
    const months = [];
    for (let i = 0; i < 12; i--) {
      let m = currentMonth;
      for (let j = 0; j < i; j++) m = DateUtils.prevMonth(m);
      months.push(m);
    }
    months.reverse();

    const trend = [];
    for (const m of months) {
      const sum = await DAO.transactions.getMonthlySummary(m, 'puff');
      trend.push({ month: m, ...sum });
    }
    setMonthlyTrend(trend);
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, { title: '泡芙统计', showBack: true }),

    h('div', { className: 'scroll-container page' },

      // 全时段概览
      h(Card, { style: { marginBottom: 'var(--space-md)' } },
        h('div', { style: { textAlign: 'center', marginBottom: 'var(--space-md)' } },
          h('div', { style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' } }, '全部时间统计'),
        ),
        h('div', { style: { display: 'flex', justifyContent: 'space-around', textAlign: 'center' } },
          h('div', null,
            h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '总收入'),
            h('div', { style: { fontSize: '22px', fontWeight: 600, color: 'var(--color-complete)' }, className: 'numeric' }, FormatUtils.money(allSummary.income)),
          ),
          h('div', null,
            h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '总支出'),
            h('div', { style: { fontSize: '22px', fontWeight: 600, color: 'var(--color-deadline)' }, className: 'numeric' }, FormatUtils.money(allSummary.expense)),
          ),
          h('div', null,
            h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '总利润'),
            h('div', { style: { fontSize: '22px', fontWeight: 600, color: allSummary.balance >= 0 ? 'var(--color-accent)' : 'var(--color-deadline)' }, className: 'numeric' }, FormatUtils.money(allSummary.balance)),
          ),
        )
      ),

      // 按分类汇总
      h('div', { className: 'section-header' }, h('span', null, '分类汇总')),
      categoryBreakdown.length === 0
        ? h('div', { style: { fontSize: '14px', color: 'var(--color-text-tertiary)', padding: 'var(--space-md) 0' } }, '暂无数据')
        : h('div', null,
          // 支出分类
          categoryBreakdown.filter(c => c.type === 'expense').map(cat =>
            h(Card, { key: cat.key, style: { marginBottom: 'var(--space-xs)' } },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)' } },
                h('div', { style: { fontSize: '20px', width: '28px', textAlign: 'center' } }, cat.icon),
                h('div', { style: { flex: 1 } },
                  h('div', { style: { fontSize: '15px', fontWeight: 500 } }, cat.label),
                  h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } }, `${cat.count} 笔`),
                ),
                h('span', { style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' }, className: 'numeric' }, FormatUtils.money(cat.actual)),
              )
            )
          ),
          // 收入分类
          categoryBreakdown.filter(c => c.type === 'income').length > 0 && h('div', { className: 'section-header', style: { marginTop: 'var(--space-md)' } }, h('span', null, '收入')),
          categoryBreakdown.filter(c => c.type === 'income').map(cat =>
            h(Card, { key: cat.key, style: { marginBottom: 'var(--space-xs)' } },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)' } },
                h('div', { style: { fontSize: '20px', width: '28px', textAlign: 'center' } }, cat.icon),
                h('div', { style: { flex: 1 } },
                  h('div', { style: { fontSize: '15px', fontWeight: 500 } }, cat.label),
                  h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } }, `${cat.count} 笔`),
                ),
                h('span', { style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-complete)' }, className: 'numeric' }, FormatUtils.money(cat.actual)),
              )
            )
          )
        ),

      // 按月趋势
      h('div', { className: 'section-header', style: { marginTop: 'var(--space-md)' } }, h('span', null, '月度趋势')),
      monthlyTrend.length === 0
        ? h('div', { style: { fontSize: '14px', color: 'var(--color-text-tertiary)', padding: 'var(--space-md) 0' } }, '暂无数据')
        : h('div', null,
          monthlyTrend.map(t =>
            h('div', {
              key: t.month,
              style: {
                display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                padding: '10px var(--space-lg)',
                marginBottom: 'var(--space-xs)',
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-sm)',
              }
            },
              h('div', { style: { fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', minWidth: '80px' } }, DateUtils.monthLabel(t.month)),
              h('div', { style: { flex: 1, display: 'flex', gap: 'var(--space-md)' } },
                h('span', { style: { fontSize: '14px', color: 'var(--color-complete)' }, className: 'numeric' }, `+${FormatUtils.money(t.income)}`),
                h('span', { style: { fontSize: '14px', color: 'var(--color-deadline)' }, className: 'numeric' }, `-${FormatUtils.money(t.expense)}`),
              ),
              h('span', { style: { fontSize: '14px', fontWeight: 600, color: t.balance >= 0 ? 'var(--color-accent)' : 'var(--color-deadline)' }, className: 'numeric' }, FormatUtils.money(t.balance)),
            )
          )
        ),

      h('div', { style: { height: 'var(--space-2xl)' } })
    )
  );
}

window.PuffStatsPage = PuffStatsPage;

})();
