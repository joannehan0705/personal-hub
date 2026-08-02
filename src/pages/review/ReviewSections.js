(function() {
/**
 * Personal Hub — Review 详情 Section 组件
 * LifeReviewSection, PuffFinanceReviewSection, OrdersReviewSection
 */

const { createElement: h, useState, useEffect } = React;

// 共用样式
const SECTION_TITLE_STYLE = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-md)',
  paddingLeft: 'var(--space-xs)',
};

const SUBCARD_STYLE = {
  backgroundColor: 'var(--color-bg-card)',
  borderRadius: '16px',
  padding: 'var(--space-lg) var(--space-xl)',
  border: '1px solid var(--color-border-light)',
  boxShadow: '0 1px 3px rgba(45,42,38,0.03)',
  marginBottom: 'var(--space-sm)',
};

const STAT_ROW_STYLE = {
  display: 'flex',
  justifyContent: 'space-around',
  textAlign: 'center',
  gap: 'var(--space-xs)',
};

function statItem(label, value, sub) {
  return h('div', { style: { flex: 1, minWidth: 0 } },
    h('div', { style: { fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '4px' } }, label),
    h('div', { style: { fontSize: '20px', fontWeight: 600, color: '#2F2F2F' }, className: 'numeric' }, value),
    sub && h('div', { style: { fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }, className: 'numeric' }, sub),
  );
}

// ===== 生活记账 Review =====

function LifeReviewSection({ data, range }) {
  if (!data || !data.transactions || data.transactions.length === 0) {
    return h('div', null,
      h('div', { style: SECTION_TITLE_STYLE }, 'Summary'),
      h('div', { style: { textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--color-text-tertiary)', fontSize: '14px' } }, '这个时间段内没有生活记账数据'),
    );
  }

  const { summary, prevSummary, categorySummary, paymentBreakdown, trendData, topSpending, days } = data;
  const dailyAvg = days > 0 ? summary.expense / days : 0;

  // 找出最高消费日
  let highestDay = null;
  let highestAmount = 0;
  const dayMap = {};
  for (const t of data.transactions) {
    if (t.type !== 'expense') continue;
    if (!dayMap[t.date]) dayMap[t.date] = 0;
    dayMap[t.date] += t.amount || 0;
  }
  for (const [date, amount] of Object.entries(dayMap)) {
    if (amount > highestAmount) { highestAmount = amount; highestDay = date; }
  }

  // 趋势对比
  const expDiff = summary.expense - prevSummary.expense;
  const expPct = prevSummary.expense > 0 ? Math.round((expDiff / prevSummary.expense) * 100) : 0;

  return h('div', null,
    h('div', { style: SECTION_TITLE_STYLE }, 'Summary'),
    // Summary
    h('div', { style: SUBCARD_STYLE },
      h('div', { style: STAT_ROW_STYLE },
        statItem('Total Expense', FormatUtils.money(summary.expense),
          prevSummary.expense > 0 ? `${expDiff < 0 ? '↓' : '↑'}${Math.abs(expPct)}% vs last` : null
        ),
        statItem('Daily Average', FormatUtils.money(Math.round(dailyAvg))),
        highestDay && statItem('Highest Day', FormatUtils.money(Math.round(highestAmount)), DateUtils.friendlyDate(highestDay)),
      ),
    ),
    // Category Breakdown
    categorySummary.length > 0 && h(DonutCard, {
      title: 'Category Breakdown',
      data: categorySummary.map((c, i) => ({
        label: `${c.icon} ${c.label}`,
        value: c.value,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
      centerValue: FormatUtils.money(Math.round(summary.expense)).replace('$', '$'),
      centerLabel: 'Total',
    }),
    // Payment Breakdown
    paymentBreakdown && paymentBreakdown.length > 0 && h('div', { style: SUBCARD_STYLE },
      h('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' } }, 'Payment Breakdown'),
      paymentBreakdown.map((p, i) => h('div', {
        key: i,
        style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-xs) 0' },
      },
        h('span', { style: { fontSize: '18px', flexShrink: 0 } }, p.icon),
        h('span', { style: { flex: 1, fontSize: '14px', color: 'var(--color-text-primary)' } }, p.label),
        h('span', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)', flexShrink: 0 }, className: 'numeric' }, `${p.percent}%`),
        h('span', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', flexShrink: 0 }, className: 'numeric' }, FormatUtils.money(Math.round(p.value))),
      )),
    ),
    // Expense Trend
    trendData && trendData.data.some(v => v > 0) && h(TrendChart, {
      title: 'Expense Trend',
      data: trendData.data,
      labels: trendData.labels,
      color: 'var(--color-accent)',
    }),
    // Top Spending
    topSpending.length > 0 && h('div', { style: SUBCARD_STYLE },
      h('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' } }, 'Top Spending'),
      topSpending.map((t, i) => {
        const cat = CATEGORIES.getExpenseCategory(t.category);
        return h('div', {
          key: i,
          style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-xs) 0' },
        },
          h('span', { style: { fontSize: '16px', flexShrink: 0 } }, cat.icon),
          h('div', { style: { flex: 1, minWidth: 0 } },
            h('div', { style: { fontSize: '13px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, t.notes || cat.label),
            h('div', { style: { fontSize: '11px', color: 'var(--color-text-tertiary)' } }, DateUtils.friendlyDate(t.date)),
          ),
          h('span', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', flexShrink: 0 }, className: 'numeric' }, FormatUtils.money(t.amount)),
        );
      }),
    ),
  );
}

// ===== 泡芙记账 Review =====

function PuffFinanceReviewSection({ data, range }) {
  if (!data || !data.transactions || data.transactions.length === 0) {
    return h('div', null,
      h('div', { style: SECTION_TITLE_STYLE }, 'Summary'),
      h('div', { style: { textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--color-text-tertiary)', fontSize: '14px' } }, '这个时间段内没有泡芙记账数据'),
    );
  }

  const { summary, prevSummary, categorySummary, paymentBreakdown, revenueTrend, expenseTrend, profitTrend } = data;
  const profit = summary.balance;
  const margin = summary.income > 0 ? Math.round((profit / summary.income) * 100) : 0;

  return h('div', null,
    h('div', { style: SECTION_TITLE_STYLE }, 'Summary'),
    // Summary
    h('div', { style: SUBCARD_STYLE },
      h('div', { style: STAT_ROW_STYLE },
        statItem('Revenue', FormatUtils.money(Math.round(summary.income))),
        statItem('Expense', FormatUtils.money(Math.round(summary.expense))),
        statItem('Profit', FormatUtils.money(Math.round(profit))),
        statItem('Margin', `${margin}%`),
      ),
    ),
    // Expense Breakdown
    categorySummary.length > 0 && h(DonutCard, {
      title: 'Expense Breakdown',
      data: categorySummary.map((c, i) => ({
        label: `${c.icon} ${c.label}`,
        value: c.value,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
      centerValue: FormatUtils.money(Math.round(summary.expense)).replace('$', '$'),
      centerLabel: 'Total',
    }),
    // Payment Breakdown
    paymentBreakdown && paymentBreakdown.length > 0 && h('div', { style: SUBCARD_STYLE },
      h('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' } }, 'Payment Breakdown'),
      paymentBreakdown.map((p, i) => h('div', {
        key: i,
        style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-xs) 0' },
      },
        h('span', { style: { fontSize: '18px', flexShrink: 0 } }, p.icon),
        h('span', { style: { flex: 1, fontSize: '14px', color: 'var(--color-text-primary)' } }, p.label),
        h('span', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)', flexShrink: 0 }, className: 'numeric' }, `${p.percent}%`),
        h('span', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', flexShrink: 0 }, className: 'numeric' }, FormatUtils.money(Math.round(p.value))),
      )),
    ),
    // Revenue Trend
    revenueTrend && revenueTrend.data.some(v => v > 0) && h(TrendChart, {
      title: 'Revenue Trend',
      data: revenueTrend.data,
      labels: revenueTrend.labels,
      color: 'var(--color-complete)',
    }),
    // Expense Trend
    expenseTrend && expenseTrend.data.some(v => v > 0) && h(TrendChart, {
      title: 'Expense Trend',
      data: expenseTrend.data,
      labels: expenseTrend.labels,
      color: 'var(--color-deadline)',
    }),
    // Profit Trend
    profitTrend && profitTrend.data.some(v => v !== 0) && h(TrendChart, {
      title: 'Profit Trend',
      data: profitTrend.data,
      labels: profitTrend.labels,
      color: 'var(--color-accent)',
    }),
  );
}

// ===== 泡芙订单 Review =====

function OrdersReviewSection({ data, range }) {
  if (!data || !data.orders || data.orders.length === 0) {
    return h('div', null,
      h('div', { style: SECTION_TITLE_STYLE }, 'Summary'),
      h('div', { style: { textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--color-text-tertiary)', fontSize: '14px' } }, '这个时间段内没有订单数据'),
    );
  }

  const { summary, flavorRanking, pickupDistribution, trendData, productionSummary } = data;
  const medals = ['🥇', '🥈', '🥉'];

  return h('div', null,
    h('div', { style: SECTION_TITLE_STYLE }, 'Summary'),
    // Summary
    h('div', { style: SUBCARD_STYLE },
      h('div', { style: STAT_ROW_STYLE },
        statItem('Orders', String(summary.totalOrders)),
        statItem('Customers', String(summary.totalCustomers)),
        statItem('Puffs', String(summary.totalPuffs)),
        statItem('Avg Order', FormatUtils.money(Math.round(summary.averageOrderValue))),
      ),
    ),
    // Best Selling Flavors
    flavorRanking.length > 0 && h('div', { style: SUBCARD_STYLE },
      h('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' } }, 'Best Selling Flavors'),
      flavorRanking.slice(0, 5).map((f, i) => h('div', {
        key: i,
        style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-xs) 0' },
      },
        h('span', { style: { fontSize: '18px', flexShrink: 0, width: '24px', textAlign: 'center' } }, medals[i] || `${i + 1}.`),
        h('span', { style: { flex: 1, fontSize: '14px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, f.productName),
        h('span', { style: { fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', flexShrink: 0 }, className: 'numeric' }, f.quantity),
      )),
    ),
    // Pickup Distribution
    pickupDistribution.length > 0 && h('div', { style: SUBCARD_STYLE },
      h('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' } }, 'Pickup Distribution'),
      pickupDistribution.map((p, i) => h('div', {
        key: i,
        style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-xs) 0' },
      },
        h('span', { style: { flex: 1, fontSize: '14px', color: 'var(--color-text-primary)' }, }, p.name),
        h('span', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)', flexShrink: 0 }, className: 'numeric' }, `${p.orderCount} orders · ${p.puffCount} puffs`),
      )),
    ),
    // Orders Trend
    trendData && trendData.data.some(v => v > 0) && h(TrendChart, {
      title: 'Orders Trend',
      data: trendData.data,
      labels: trendData.labels,
      color: 'var(--color-evening)',
    }),
    // Production Summary
    productionSummary && productionSummary.totalPuffs > 0 && h('div', { style: SUBCARD_STYLE },
      h('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' } }, 'Production Summary'),
      h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' } },
        h('div', null, h('span', { style: { color: 'var(--color-text-tertiary)', fontSize: '12px' } }, 'Total Puffs'), h('div', { style: { fontSize: '18px', fontWeight: 700 }, className: 'numeric' }, productionSummary.totalPuffs)),
        productionSummary.classicCount > 0 && h('div', null, h('span', { style: { color: 'var(--color-text-tertiary)', fontSize: '12px' } }, 'Classic'), h('div', { style: { fontSize: '18px', fontWeight: 700 }, className: 'numeric' }, productionSummary.classicCount)),
        productionSummary.testingCount > 0 && h('div', null, h('span', { style: { color: 'var(--color-text-tertiary)', fontSize: '12px' } }, 'Testing'), h('div', { style: { fontSize: '18px', fontWeight: 700 }, className: 'numeric' }, productionSummary.testingCount)),
        productionSummary.monthlyFavoriteCount > 0 && h('div', null, h('span', { style: { color: 'var(--color-text-tertiary)', fontSize: '12px' } }, 'Monthly Fav'), h('div', { style: { fontSize: '18px', fontWeight: 700 }, className: 'numeric' }, productionSummary.monthlyFavoriteCount)),
        productionSummary.weeklySelectionCount > 0 && h('div', null, h('span', { style: { color: 'var(--color-text-tertiary)', fontSize: '12px' } }, 'Weekly Sel'), h('div', { style: { fontSize: '18px', fontWeight: 700 }, className: 'numeric' }, productionSummary.weeklySelectionCount)),
      ),
    ),
  );
}

// 暴露到全局
window.ReviewSections = { LifeReviewSection, PuffFinanceReviewSection, OrdersReviewSection };

})();
