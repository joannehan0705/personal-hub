(function() {
/**
 * Personal Hub — Review 主页面 (V2: Apple Health 风格)
 * 轻盈 SummaryCard + Segmented Control 详情切换
 */

const { createElement: h, useState, useEffect } = React;

// 模块颜色
const MODULE_COLORS = {
  personal: '#7BAE8E',  // 鼠尾草绿
  puff: '#E8A060',      // 暖橙
  orders: '#8B7EC8',    // 薰衣草紫
};

function ReviewPage() {
  const { dataVersion, navigate } = useApp();
  const [period, setPeriod] = useState('week');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('life'); // 'life' | 'puff' | 'orders'

  useEffect(() => { setOffset(0); }, [period]);

  useEffect(() => {
    const range = ReviewDataProvider.getDateRange(period, offset);
    setLoading(true);
    ReviewDataProvider.loadAllData(range).then(d => {
      setData({ ...d, _range: range });
      setLoading(false);
    });
  }, [period, offset, dataVersion]);

  const range = ReviewDataProvider.getDateRange(period, offset);

  // 时间段切换
  const periodStyle = (isActive) => ({
    flex: 1,
    padding: '7px 0',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
    color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const arrowStyle = {
    width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--color-text-tertiary)',
    fontSize: '22px',
  };

  // Segmented Control 样式
  const segStyle = (isActive, color) => ({
    flex: 1,
    padding: '8px 0',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 500,
    backgroundColor: isActive ? color : 'transparent',
    color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

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

        // ===== Overview Summary Cards =====
        h('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-md)',
          },
        },
          // 生活记账
          data.personal.summary.expense > 0 && h(ReviewSummaryCard, {
            title: '生活记账',
            icon: '🏠',
            decorIcon: '🍩',
            accentColor: MODULE_COLORS.personal,
          },
            h('div', { style: { fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '2px' } }, 'Expense'),
            h('div', {
              style: { fontSize: '28px', fontWeight: 600, color: '#2F2F2F', lineHeight: 1.1 },
              className: 'numeric',
            }, FormatUtils.money(Math.round(data.personal.summary.expense))),
            h('div', {
              style: { fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' },
              className: 'numeric',
            }, `Daily avg ${FormatUtils.money(Math.round(data.personal.summary.expense / (data.personal.days || 1)))}`),
            // 趋势
            data.personal.prevSummary.expense > 0 && (() => {
              const diff = data.personal.summary.expense - data.personal.prevSummary.expense;
              const pct = Math.round((diff / data.personal.prevSummary.expense) * 100);
              if (pct === 0) return null;
              const good = diff < 0; // 支出减少是好事
              return h('div', {
                style: {
                  fontSize: '11px', fontWeight: 500, marginTop: '6px',
                  color: good ? 'var(--color-complete)' : 'var(--color-deadline)',
                },
                className: 'numeric',
              }, `${diff < 0 ? '↓' : '↑'}${Math.abs(pct)}% vs last`);
            })(),
          ),

          // 泡芙记账
          (data.puff.summary.income > 0 || data.puff.summary.expense > 0) && h(ReviewSummaryCard, {
            title: '泡芙记账',
            icon: '🧁',
            decorIcon: '📊',
            accentColor: MODULE_COLORS.puff,
          },
            h('div', { style: { fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '2px' } }, 'Profit'),
            h('div', {
              style: {
                fontSize: '28px', fontWeight: 600,
                color: data.puff.summary.balance >= 0 ? MODULE_COLORS.puff : 'var(--color-deadline)',
                lineHeight: 1.1,
              },
              className: 'numeric',
            }, FormatUtils.money(Math.round(data.puff.summary.balance))),
            h('div', {
              style: { fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' },
              className: 'numeric',
            }, `Rev ${FormatUtils.money(Math.round(data.puff.summary.income))} · Exp ${FormatUtils.money(Math.round(data.puff.summary.expense))}`),
            // 利润率
            data.puff.summary.income > 0 && h('div', {
              style: { fontSize: '11px', fontWeight: 500, marginTop: '6px', color: MODULE_COLORS.puff },
              className: 'numeric',
            }, `${Math.round((data.puff.summary.balance / data.puff.summary.income) * 100)}% margin`),
          ),

          // 泡芙订单
          data.orders.summary.totalOrders > 0 && h(ReviewSummaryCard, {
            title: '泡芙订单',
            icon: '📦',
            decorIcon: '📈',
            accentColor: MODULE_COLORS.orders,
          },
            h('div', {
              style: { display: 'flex', gap: 'var(--space-md)' },
            },
              h('div', null,
                h('div', { style: { fontSize: '11px', color: 'var(--color-text-tertiary)' } }, 'Orders'),
                h('div', { style: { fontSize: '22px', fontWeight: 600, color: MODULE_COLORS.orders, lineHeight: 1.1 }, className: 'numeric' }, data.orders.summary.totalOrders),
              ),
              h('div', null,
                h('div', { style: { fontSize: '11px', color: 'var(--color-text-tertiary)' } }, 'Puffs'),
                h('div', { style: { fontSize: '22px', fontWeight: 600, color: MODULE_COLORS.orders, lineHeight: 1.1 }, className: 'numeric' }, data.orders.summary.totalPuffs),
              ),
            ),
            h('div', {
              style: { fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '6px' },
              className: 'numeric',
            }, `${data.orders.summary.totalCustomers} customers · avg ${FormatUtils.money(Math.round(data.orders.summary.averageOrderValue))}`),
          ),
        ),

        // ===== Highlights =====
        ReviewDataProvider.generateHighlights(data, range).length > 0 && h('div', {
          style: { marginBottom: 'var(--space-lg)' },
        },
          ReviewDataProvider.generateHighlights(data, range).map((hl, i) => h('div', {
            key: i,
            style: {
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
              padding: '10px var(--space-lg)',
              marginBottom: 'var(--space-xs)',
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--color-border-light)',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              minHeight: '44px',
            },
          },
            h('div', {
              style: {
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: hl.color + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', flexShrink: 0,
              },
            }, hl.icon),
            h('span', { style: { flex: 1 } }, hl.text),
          )),
        ),

        // ===== Segmented Control =====
        h('div', {
          style: {
            display: 'flex',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px',
            marginBottom: 'var(--space-md)',
            gap: '2px',
          },
        },
          h('button', {
            onClick: () => { Haptics.selection(); setActiveTab('life'); },
            style: segStyle(activeTab === 'life', MODULE_COLORS.personal),
          }, '🏠 生活记账'),
          h('button', {
            onClick: () => { Haptics.selection(); setActiveTab('puff'); },
            style: segStyle(activeTab === 'puff', MODULE_COLORS.puff),
          }, '🧁 泡芙记账'),
          h('button', {
            onClick: () => { Haptics.selection(); setActiveTab('orders'); },
            style: segStyle(activeTab === 'orders', MODULE_COLORS.orders),
          }, '📦 订单'),
        ),

        // ===== 详情 Section（按 tab 切换）=====
        activeTab === 'life' && h(ReviewSections.LifeReviewSection, { data: data.personal, range }),
        activeTab === 'puff' && h(ReviewSections.PuffFinanceReviewSection, { data: data.puff, range }),
        activeTab === 'orders' && h(ReviewSections.OrdersReviewSection, { data: data.orders, range }),

        // 全部无数据
        data.personal.transactions.length === 0 && data.puff.transactions.length === 0 && data.orders.orders.length === 0 && h('div', {
          style: { textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--color-text-tertiary)', fontSize: '14px' },
        }, '这个时间段内没有数据'),
      ) : null,
    ),
  );
}

window.ReviewPage = ReviewPage;

})();
