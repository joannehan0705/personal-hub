(function() {
/**
 * Personal Hub — Review 数据层
 * 封装时间范围计算、数据汇总、Highlights 生成
 */

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ===== 日期范围计算 =====

function getDateRange(period, offset) {
  const now = new Date();

  if (period === 'week') {
    const baseMonday = DateUtils.parse(DateUtils.startOfWeek());
    baseMonday.setDate(baseMonday.getDate() + offset * 7);
    const sunday = new Date(baseMonday);
    sunday.setDate(sunday.getDate() + 6);
    const start = DateUtils.toDateStr(baseMonday);
    const end = DateUtils.toDateStr(sunday);

    const prevMonday = new Date(baseMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);
    const prevSunday = new Date(prevMonday);
    prevSunday.setDate(prevSunday.getDate() + 6);

    const label = `${MONTHS_SHORT[baseMonday.getMonth()]} ${baseMonday.getDate()} – ${MONTHS_SHORT[sunday.getMonth()]} ${sunday.getDate()}`;
    return { start, end, label, period, prevStart: DateUtils.toDateStr(prevMonday), prevEnd: DateUtils.toDateStr(prevSunday) };
  }

  if (period === 'month') {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const [start, end] = DateUtils.monthRange(monthStr);

    const prevDate = new Date(year, month - 1, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const [prevStart, prevEnd] = DateUtils.monthRange(prevMonthStr);

    return { start, end, label: `${MONTHS_LONG[month]} ${year}`, period, prevStart, prevEnd };
  }

  if (period === 'year') {
    const year = now.getFullYear() + offset;
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const prevYear = year - 1;
    return { start, end, label: String(year), period, prevStart: `${prevYear}-01-01`, prevEnd: `${prevYear}-12-31` };
  }
}

// ===== 辅助函数 =====

function filterByDateRange(items, start, end, dateField) {
  const field = dateField || 'date';
  return items.filter(item => {
    const d = item[field];
    return d && d >= start && d <= end;
  });
}

function summarizeTransactions(transactions) {
  let income = 0, expense = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount || 0;
    else expense += t.amount || 0;
  }
  return { income, expense, balance: income - expense, count: transactions.length };
}

function categorizeExpense(transactions, scope) {
  const map = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    if (!map[t.category]) map[t.category] = 0;
    map[t.category] += t.amount || 0;
  }
  // 转为数组
  const cats = scope === 'puff' ? CATEGORIES.puffExpense : CATEGORIES.expense;
  return Object.entries(map)
    .map(([key, amount]) => {
      const cat = scope === 'puff'
        ? CATEGORIES.getPuffExpenseCategory(key)
        : CATEGORIES.getExpenseCategory(key);
      return { key, label: cat.label, icon: cat.icon, value: amount };
    })
    .sort((a, b) => b.value - a.value);
}

function buildTrendData(transactions, range, type) {
  // type: 'expense' | 'income' | 'balance'
  const period = range.period;

  if (period === 'week') {
    const labels = [...WEEKDAYS_SHORT];
    const data = [];
    const start = DateUtils.parse(range.start);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = DateUtils.toDateStr(date);
      let val = 0;
      for (const t of transactions) {
        if (t.date !== dateStr) continue;
        if (type === 'expense' && t.type === 'expense') val += t.amount || 0;
        else if (type === 'income' && t.type === 'income') val += t.amount || 0;
        else if (type === 'balance') {
          if (t.type === 'income') val += t.amount || 0;
          else val -= t.amount || 0;
        }
      }
      data.push(val);
    }
    return { labels, data };
  }

  if (period === 'month') {
    const [startStr] = DateUtils.monthRange(range.start.slice(0, 7));
    const startDate = DateUtils.parse(startStr);
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const labels = [];
    const data = [];
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = DateUtils.toDateStr(date);
      let val = 0;
      for (const t of transactions) {
        if (t.date !== dateStr) continue;
        if (type === 'expense' && t.type === 'expense') val += t.amount || 0;
        else if (type === 'income' && t.type === 'income') val += t.amount || 0;
        else if (type === 'balance') {
          if (t.type === 'income') val += t.amount || 0;
          else val -= t.amount || 0;
        }
      }
      labels.push(String(i + 1));
      data.push(val);
    }
    return { labels, data };
  }

  if (period === 'year') {
    const year = parseInt(range.start.slice(0, 4));
    const labels = [...MONTHS_SHORT];
    const data = [];
    for (let m = 0; m < 12; m++) {
      const monthPrefix = `${year}-${String(m + 1).padStart(2, '0')}`;
      let val = 0;
      for (const t of transactions) {
        if (!t.date || !t.date.startsWith(monthPrefix)) continue;
        if (type === 'expense' && t.type === 'expense') val += t.amount || 0;
        else if (type === 'income' && t.type === 'income') val += t.amount || 0;
        else if (type === 'balance') {
          if (t.type === 'income') val += t.amount || 0;
          else val -= t.amount || 0;
        }
      }
      data.push(val);
    }
    return { labels, data };
  }
}

function buildOrdersTrend(orders, range) {
  const period = range.period;
  if (period === 'week') {
    const labels = [...WEEKDAYS_SHORT];
    const data = [];
    const start = DateUtils.parse(range.start);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = DateUtils.toDateStr(date);
      data.push(orders.filter(o => o.pickupDate === dateStr && o.status !== 'cancelled').length);
    }
    return { labels, data };
  }
  if (period === 'month') {
    const [startStr] = DateUtils.monthRange(range.start.slice(0, 7));
    const startDate = DateUtils.parse(startStr);
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const labels = [];
    const data = [];
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = DateUtils.toDateStr(date);
      labels.push(String(i + 1));
      data.push(orders.filter(o => o.pickupDate === dateStr && o.status !== 'cancelled').length);
    }
    return { labels, data };
  }
  if (period === 'year') {
    const year = parseInt(range.start.slice(0, 4));
    const labels = [...MONTHS_SHORT];
    const data = [];
    for (let m = 0; m < 12; m++) {
      const monthPrefix = `${year}-${String(m + 1).padStart(2, '0')}`;
      data.push(orders.filter(o => o.pickupDate && o.pickupDate.startsWith(monthPrefix) && o.status !== 'cancelled').length);
    }
    return { labels, data };
  }
}

function summarizeOrders(orders) {
  const valid = orders.filter(o => o.status !== 'cancelled');
  const totalOrders = valid.length;
  const customers = new Set(valid.map(o => o.customer).filter(Boolean));
  const totalPuffs = valid.reduce((s, o) => s + (o.items || []).reduce((s2, i) => s2 + (i.quantity || 0), 0), 0);
  const totalRevenue = valid.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  return { totalOrders, totalCustomers: customers.size, totalPuffs, averageOrderValue: avgOrder, totalRevenue };
}

function rankFlavors(orders, products) {
  const map = {};
  const productMap = {};
  for (const p of products) productMap[p.id] = p;

  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    for (const item of (o.items || [])) {
      const name = item.productName || 'Unknown';
      if (!map[name]) map[name] = { productName: name, quantity: 0, productId: item.productId };
      map[name].quantity += item.quantity || 0;
    }
  }
  return Object.values(map)
    .map(r => {
      const product = r.productId ? productMap[r.productId] : null;
      return { ...r, category: product?.category || null };
    })
    .sort((a, b) => b.quantity - a.quantity);
}

function distributeByPickup(orders) {
  const map = {};
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const name = o.pickupPointName || '未指定';
    if (!map[name]) map[name] = { name, orderCount: 0, puffCount: 0, revenue: 0 };
    map[name].orderCount++;
    map[name].puffCount += (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
    map[name].revenue += o.totalAmount || 0;
  }
  return Object.values(map).sort((a, b) => b.orderCount - a.orderCount);
}

function summarizeProduction(orders, products, menus, range) {
  const productMap = {};
  for (const p of products) productMap[p.id] = p;

  let classicCount = 0, testingCount = 0;
  const validOrders = orders.filter(o => o.status !== 'cancelled');

  for (const o of validOrders) {
    for (const item of (o.items || [])) {
      const p = item.productId ? productMap[item.productId] : null;
      const cat = p?.category;
      const qty = item.quantity || 0;
      if (cat === 'classic') classicCount += qty;
      else if (cat === 'testing') testingCount += qty;
    }
  }

  // Menu 统计
  let monthlyFavoriteCount = 0, weeklySelectionCount = 0;
  const rangeMenus = menus.filter(m => {
    if (!m.date) return false;
    return m.date >= range.start && m.date <= range.end;
  });
  for (const m of rangeMenus) {
    monthlyFavoriteCount += (m.monthlyFavorites || []).length;
    weeklySelectionCount += (m.weeklySelection || []).length;
  }

  const totalPuffs = validOrders.reduce((s, o) => s + (o.items || []).reduce((s2, i) => s2 + (i.quantity || 0), 0), 0);

  return { totalPuffs, classicCount, testingCount, monthlyFavoriteCount, weeklySelectionCount };
}

// ===== 主数据加载 =====

async function loadAllData(range) {
  const [personalTxAll, puffTxAll, ordersAll, productsAll, menusAll] = await Promise.all([
    DAO.transactions.getAll('personal'),
    DAO.transactions.getAll('puff'),
    DAO.orders.getAll(),
    DAO.products.getAll(),
    DAO.menus.getAll(),
  ]);

  // 当前周期数据
  const personalTx = filterByDateRange(personalTxAll, range.start, range.end);
  const puffTx = filterByDateRange(puffTxAll, range.start, range.end);
  const orders = filterByDateRange(ordersAll, range.start, range.end, 'pickupDate');

  // 上一周期数据
  const prevPersonalTx = filterByDateRange(personalTxAll, range.prevStart, range.prevEnd);
  const prevPuffTx = filterByDateRange(puffTxAll, range.prevStart, range.prevEnd);
  const prevOrders = filterByDateRange(ordersAll, range.prevStart, range.prevEnd, 'pickupDate');

  // 趋势数据
  const personalTrend = buildTrendData(personalTxAll, range, 'expense');
  const puffRevenueTrend = buildTrendData(puffTxAll, range, 'income');
  const puffExpenseTrend = buildTrendData(puffTxAll, range, 'expense');
  const puffProfitTrend = buildTrendData(puffTxAll, range, 'balance');
  const ordersTrend = buildOrdersTrend(ordersAll, range);

  // 天数
  const days = range.period === 'week' ? 7
    : range.period === 'year' ? 365
    : DateUtils.parse(range.end).getDate() - DateUtils.parse(range.start).getDate() + 1;

  return {
    personal: {
      transactions: personalTx,
      summary: summarizeTransactions(personalTx),
      prevSummary: summarizeTransactions(prevPersonalTx),
      categorySummary: categorizeExpense(personalTx, 'personal'),
      trendData: personalTrend,
      topSpending: personalTx.filter(t => t.type === 'expense').sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 5),
      days,
    },
    puff: {
      transactions: puffTx,
      summary: summarizeTransactions(puffTx),
      prevSummary: summarizeTransactions(prevPuffTx),
      categorySummary: categorizeExpense(puffTx, 'puff'),
      revenueTrend: puffRevenueTrend,
      expenseTrend: puffExpenseTrend,
      profitTrend: puffProfitTrend,
    },
    orders: {
      orders,
      summary: summarizeOrders(orders),
      prevSummary: summarizeOrders(prevOrders),
      flavorRanking: rankFlavors(orders, productsAll),
      pickupDistribution: distributeByPickup(orders),
      trendData: ordersTrend,
      productionSummary: summarizeProduction(orders, productsAll, menusAll, range),
    },
  };
}

// ===== Highlights 生成 =====

function generateHighlights(data, range) {
  const highlights = [];
  const periodLabel = range.period === 'week' ? '本周' : range.period === 'month' ? '本月' : '本年';

  // 1. 生活支出对比
  const personalExpDiff = data.personal.summary.expense - data.personal.prevSummary.expense;
  if (data.personal.prevSummary.expense > 0 && Math.abs(personalExpDiff) > 1) {
    if (personalExpDiff < 0) {
      highlights.push({ icon: '✨', text: `${periodLabel}生活支出减少了 ${FormatUtils.money(Math.abs(personalExpDiff))}`, color: 'var(--color-complete)' });
    } else {
      highlights.push({ icon: '📈', text: `${periodLabel}生活支出增加了 ${FormatUtils.money(personalExpDiff)}`, color: 'var(--color-deadline)' });
    }
  }

  // 2. 泡芙利润对比
  const profitDiff = data.puff.summary.balance - data.puff.prevSummary.balance;
  if (data.puff.prevSummary.balance > 0 && Math.abs(profitDiff) > 1) {
    const pct = Math.round((profitDiff / data.puff.prevSummary.balance) * 100);
    if (pct > 0) {
      highlights.push({ icon: '🧁', text: `${periodLabel}利润提升 ${pct}%`, color: 'var(--color-complete)' });
    } else {
      highlights.push({ icon: '🧁', text: `${periodLabel}利润下降 ${Math.abs(pct)}%`, color: 'var(--color-deadline)' });
    }
  }

  // 3. 订单完成数
  if (data.orders.summary.totalOrders > 0) {
    highlights.push({ icon: '📦', text: `完成了 ${data.orders.summary.totalOrders} 个订单`, color: 'var(--color-accent)' });
  }

  // 4. 最受欢迎口味
  if (data.orders.flavorRanking.length > 0 && data.orders.flavorRanking[0].quantity > 0) {
    highlights.push({ icon: '⭐', text: `${periodLabel}最受欢迎口味：${data.orders.flavorRanking[0].productName}`, color: 'var(--color-accent-2)' });
  }

  // 5. 总泡芙数
  if (data.orders.summary.totalPuffs > 0) {
    highlights.push({ icon: '🧁', text: `制作了 ${data.orders.summary.totalPuffs} 个泡芙`, color: 'var(--color-evening)' });
  }

  return highlights.slice(0, 5);
}

// 暴露到全局
window.ReviewDataProvider = {
  getDateRange,
  loadAllData,
  generateHighlights,
  MONTHS_SHORT,
  MONTHS_LONG,
};

})();
