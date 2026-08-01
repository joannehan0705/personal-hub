(function() {
/**
 * Personal Hub — Review 主页面
 * 时间段切换 + Overview + Highlights + 三个详情 Section
 */

const { createElement: h, useState, useEffect } = React;

function ReviewPage() {
  const { dataVersion, navigate } = useApp();
  const [period, setPeriod] = useState('week');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 切换 period 时重置 offset
  useEffect(() => { setOffset(0); }, [period]);

  // 加载数据
  useEffect(() => {
    const range = ReviewDataProvider.getDateRange(period, offset);
    setLoading(true);
    ReviewDataProvider.loadAllData(range).then(d => {
      setData({ ...d, _range: range });
      setLoading(false);
    });
  }, [period, offset, dataVersion]);

  const range = ReviewDataProvider.getDateRange(period, offset);

  // 时间段切换样式
  const periodStyle = (isActive) => ({
    flex: 1,
    padding: '8px 0',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
    color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  // 箭头按钮样式
  const arrowStyle = {
    width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--color-text-tertiary)',
    fontSize: '20px',
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, { title: 'Review', showBack: true }),

    h('div', { className: 'scroll-container page', style: { paddingBottom: 'var(--space-4xl)' } },

      // 时间段切换
      h('div', {
        style: {
          display: 'flex',
          backgroundColor: 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-pill)',
          padding: '3px',
          marginBottom: 'var(--space-md)',
          gap: '2px',
        },
      },
        ['week', 'month', 'year'].map(p => h('button', {
          key: p,
          onClick: () => { Haptics.selection(); setPeriod(p); },
          style: periodStyle(period === p),
        }, p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Year')),
      ),

      // 时间导航
      h('div', {
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)',
        },
      },
        h('div', {
          style: arrowStyle,
          onClick: () => { Haptics.light(); setOffset(offset - 1); },
        }, '‹'),
        h('span', {
          style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', minWidth: '140px', textAlign: 'center' },
        }, range.label),
        h('div', {
          style: { ...arrowStyle, opacity: offset >= 0 ? 0.3 : 1, pointerEvents: offset >= 0 ? 'none' : 'auto' },
          onClick: () => { Haptics.light(); setOffset(offset + 1); },
        }, '›'),
      ),

      loading ? h('div', {
        style: { textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--color-text-tertiary)', fontSize: '14px' },
      }, 'Loading...') : data ? h(React.Fragment, null,

        // ===== Overview =====
        // 生活记账
        data.personal.summary.expense > 0 && h(SummaryCard, {
          title: '生活记账',
          icon: '🏠',
          items: (() => {
            const expDiff = data.personal.summary.expense - data.personal.prevSummary.expense;
            const expPct = data.personal.prevSummary.expense > 0 ? Math.round((expDiff / data.personal.prevSummary.expense) * 100) : 0;
            return [
              { label: 'Total Expense', value: FormatUtils.money(Math.round(data.personal.summary.expense)) },
              { label: 'Daily Average', value: FormatUtils.money(Math.round(data.personal.summary.expense / (data.personal.days || 1))) },
              data.personal.prevSummary.expense > 0 ? {
                label: 'vs Last Period',
                value: `${expDiff < 0 ? '↓' : '↑'}${Math.abs(expPct)}%`,
                trendDir: expDiff < 0 ? 'down' : 'up',
                trendGood: expDiff < 0,
              } : null,
            ].filter(Boolean);
          })(),
        }),

        // 泡芙记账
        (data.puff.summary.income > 0 || data.puff.summary.expense > 0) && h(SummaryCard, {
          title: '泡芙记账',
          icon: '🧁',
          accentColor: 'var(--color-accent-2)',
          items: [
            { label: 'Revenue', value: FormatUtils.money(Math.round(data.puff.summary.income)) },
            { label: 'Expense', value: FormatUtils.money(Math.round(data.puff.summary.expense)) },
            { label: 'Profit', value: FormatUtils.money(Math.round(data.puff.summary.balance)) },
            { label: 'Rate', value: `${data.puff.summary.income > 0 ? Math.round((data.puff.summary.balance / data.puff.summary.income) * 100) : 0}%` },
          ],
        }),

        // 泡芙订单
        data.orders.summary.totalOrders > 0 && h(SummaryCard, {
          title: '泡芙订单',
          icon: '📦',
          accentColor: 'var(--color-evening)',
          items: [
            { label: 'Orders', value: String(data.orders.summary.totalOrders) },
            { label: 'Customers', value: String(data.orders.summary.totalCustomers) },
            { label: 'Puffs', value: String(data.orders.summary.totalPuffs) },
            { label: 'Avg Order', value: FormatUtils.money(Math.round(data.orders.summary.averageOrderValue)) },
          ],
        }),

        // ===== Highlights =====
        ReviewDataProvider.generateHighlights(data, range).length > 0 && h('div', {
          style: {
            marginTop: 'var(--space-md)',
            marginBottom: 'var(--space-sm)',
          },
        },
          ReviewDataProvider.generateHighlights(data, range).map((hl, i) => h('div', {
            key: i,
            style: {
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-lg)',
              marginBottom: 'var(--space-xs)',
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
            },
          },
            h('span', { style: { fontSize: '16px', flexShrink: 0 } }, hl.icon),
            h('span', null, hl.text),
          )),
        ),

        // ===== 三个详情 Section =====
        h(ReviewSections.LifeReviewSection, { data: data.personal, range }),
        h(ReviewSections.PuffFinanceReviewSection, { data: data.puff, range }),
        h(ReviewSections.OrdersReviewSection, { data: data.orders, range }),

        // 全部无数据时的提示
        data.personal.transactions.length === 0 && data.puff.transactions.length === 0 && data.orders.orders.length === 0 && h('div', {
          style: { textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--color-text-tertiary)', fontSize: '14px' },
        }, '这个时间段内没有数据'),
      ) : null,
    ),
  );
}

window.ReviewPage = ReviewPage;

})();
