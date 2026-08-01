(function() {
/**
 * Personal Hub — Review 主页面 (V3: Carousel + Apple Fitness 风格)
 * 横向滑动 Summary Card + Capsule Highlights + Segmented Control 详情
 */

const { createElement: h, useState, useEffect } = React;

const MODULE_COLORS = {
  personal: '#5B9E7A',  // 深绿
  puff: '#E8A060',      // 暖橙
  orders: '#8B7EC8',    // 紫
};

// 装饰图标（纯 SVG 路径，极淡背景用）
function DecorDonut() {
  return h('svg', { width: 64, height: 64, viewBox: '0 0 64 64' },
    h('circle', { cx: 32, cy: 32, r: 24, fill: 'none', stroke: 'currentColor', strokeWidth: 10 }),
    h('circle', { cx: 32, cy: 32, r: 24, fill: 'none', stroke: 'currentColor', strokeWidth: 10, strokeDasharray: '60 150', strokeDashoffset: 0, transform: 'rotate(-90 32 32)' }),
  );
}
function DecorBars() {
  return h('svg', { width: 64, height: 64, viewBox: '0 0 64 64' },
    h('rect', { x: 8, y: 36, width: 10, height: 20, rx: 2, fill: 'currentColor' }),
    h('rect', { x: 24, y: 24, width: 10, height: 32, rx: 2, fill: 'currentColor' }),
    h('rect', { x: 40, y: 16, width: 10, height: 40, rx: 2, fill: 'currentColor' }),
  );
}
function DecorTrend() {
  return h('svg', { width: 64, height: 64, viewBox: '0 0 64 64' },
    h('polyline', { points: '8,48 22,38 34,42 48,20 58,28', fill: 'none', stroke: 'currentColor', strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' }),
    h('circle', { cx: 22, cy: 38, r: 3, fill: 'currentColor' }),
    h('circle', { cx: 48, cy: 20, r: 3, fill: 'currentColor' }),
  );
}

function ReviewPage() {
  const { dataVersion } = useApp();
  const [period, setPeriod] = useState('week');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('life');

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

  const periodStyle = (isActive) => ({
    flex: 1, padding: '7px 0', borderRadius: 'var(--radius-pill)',
    border: 'none', fontSize: '13px', fontWeight: 600,
    backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
    color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
    cursor: 'pointer', transition: 'all 0.2s',
  });

  const arrowStyle = {
    width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: '22px',
  };

  const segStyle = (isActive, color) => ({
    flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)',
    border: 'none', fontSize: '13px', fontWeight: isActive ? 600 : 500,
    backgroundColor: isActive ? color : 'transparent',
    color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
    cursor: 'pointer', transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });

  // ===== Carousel Card 渲染 =====

  const carouselCards = [];

  // 生活记账
  if (data && data.personal.summary.expense > 0) {
    const s = data.personal.summary;
    const ps = data.personal.prevSummary;
    const diff = s.expense - ps.expense;
    const pct = ps.expense > 0 ? Math.round((diff / ps.expense) * 100) : 0;
    const good = diff < 0;
    carouselCards.push({
      color: MODULE_COLORS.personal,
      content: h(React.Fragment, null,
        h('div', { style: { fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: '4px' } }, 'Total Expense'),
        h('div', {
          style: { fontSize: '36px', fontWeight: 600, color: MODULE_COLORS.personal, lineHeight: 1.1, marginBottom: '10px' },
          className: 'numeric',
        }, FormatUtils.money(Math.round(s.expense))),
        h('div', {
          style: { display: 'flex', gap: 'var(--space-xl)', fontSize: '13px', color: 'var(--color-text-tertiary)' },
          className: 'numeric',
        },
          h('span', null, `${FormatUtils.money(Math.round(s.expense / (data.personal.days || 1)))}/day`),
          h('span', null, `${s.count} txns`),
        ),
        ps.expense > 0 && pct !== 0 && h('div', {
          style: {
            fontSize: '12px', fontWeight: 500, marginTop: '10px',
            color: good ? 'var(--color-complete)' : 'var(--color-deadline)',
          },
          className: 'numeric',
        }, `${diff < 0 ? '↓' : '↑'}${Math.abs(pct)}% vs last`),
      ),
    });
  }

  // 泡芙记账
  if (data && (data.puff.summary.income > 0 || data.puff.summary.expense > 0)) {
    const s = data.puff.summary;
    const ps = data.puff.prevSummary;
    const diff = s.balance - ps.balance;
    const pct = ps.balance !== 0 ? Math.round((diff / Math.abs(ps.balance)) * 100) : 0;
    const isNegative = s.balance < 0;
    carouselCards.push({
      color: MODULE_COLORS.puff,
      content: h(React.Fragment, null,
        h('div', { style: { fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: '4px' } }, 'Profit'),
        h('div', {
          style: {
            fontSize: '36px', fontWeight: 600,
            color: isNegative ? 'var(--color-deadline)' : MODULE_COLORS.puff,
            lineHeight: 1.1, marginBottom: '10px',
          },
          className: 'numeric',
        }, FormatUtils.money(Math.round(s.balance))),
        h('div', {
          style: { display: 'flex', gap: 'var(--space-xl)', fontSize: '13px', color: 'var(--color-text-tertiary)' },
          className: 'numeric',
        },
          h('span', null, `Rev ${FormatUtils.money(Math.round(s.income))}`),
          h('span', null, `Exp ${FormatUtils.money(Math.round(s.expense))}`),
        ),
        ps.balance !== 0 && pct !== 0 && h('div', {
          style: {
            fontSize: '12px', fontWeight: 500, marginTop: '10px',
            color: diff > 0 ? 'var(--color-complete)' : 'var(--color-deadline)',
          },
          className: 'numeric',
        }, `${diff > 0 ? '↑' : '↓'}${Math.abs(pct)}% vs last`),
      ),
    });
  }

  // 泡芙订单
  if (data && data.orders.summary.totalOrders > 0) {
    const s = data.orders.summary;
    const ps = data.orders.prevSummary;
    const diff = s.totalOrders - ps.totalOrders;
    carouselCards.push({
      color: MODULE_COLORS.orders,
      content: h(React.Fragment, null,
        h('div', { style: { fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: '4px' } }, 'Orders'),
        h('div', {
          style: { fontSize: '36px', fontWeight: 600, color: MODULE_COLORS.orders, lineHeight: 1.1, marginBottom: '10px' },
          className: 'numeric',
        }, String(s.totalOrders)),
        h('div', {
          style: { display: 'flex', gap: 'var(--space-xl)', fontSize: '13px', color: 'var(--color-text-tertiary)' },
          className: 'numeric',
        },
          h('span', null, `${s.totalPuffs} puffs`),
          h('span', null, `${s.totalCustomers} customers`),
          h('span', null, `avg ${FormatUtils.money(Math.round(s.averageOrderValue))}`),
        ),
        ps.totalOrders > 0 && diff !== 0 && h('div', {
          style: {
            fontSize: '12px', fontWeight: 500, marginTop: '10px',
            color: diff > 0 ? 'var(--color-complete)' : 'var(--color-deadline)',
          },
          className: 'numeric',
        }, `${diff > 0 ? '↑' : '↓'}${Math.abs(diff)} orders vs last`),
      ),
    });
  }

  const cardMeta = [
    { icon: '🏠', title: '生活记账', decor: h(DecorDonut) },
    { icon: '🧁', title: '泡芙记账', decor: h(DecorBars) },
    { icon: '📦', title: '泡芙订单', decor: h(DecorTrend) },
  ];

  const highlights = data ? ReviewDataProvider.generateHighlights(data, range) : [];

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, { title: 'Review', showBack: true }),

    h('div', { className: 'scroll-container page', style: { paddingBottom: 'var(--space-4xl)', overflowX: 'hidden' } },

      // 时间段切换
      h('div', {
        style: {
          display: 'flex', backgroundColor: 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-pill)', padding: '3px',
          marginBottom: 'var(--space-md)', gap: '2px',
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
          gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)',
        },
      },
        h('div', { style: arrowStyle, onClick: () => { Haptics.light(); setOffset(offset - 1); } }, '‹'),
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

        // ===== Summary Carousel =====
        carouselCards.length > 0 && h('div', {
          style: {
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            gap: 'var(--space-md)',
            paddingBottom: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingLeft: 'var(--space-xs)',
            paddingRight: 'var(--space-xs)',
          },
          ref: el => { if (el) el.style.scrollbarWidth = 'none'; },
        },
          carouselCards.map((card, i) => {
            const meta = cardMeta[i];
            return h('div', {
              key: i,
              style: {
                flexShrink: 0,
                width: '85%',
                maxWidth: '360px',
                scrollSnapAlign: 'start',
                position: 'relative',
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid var(--color-border-light)',
                boxShadow: '0 1px 3px rgba(45,42,38,0.04)',
                overflow: 'hidden',
                minHeight: '200px',
              },
            },
              // 装饰图标（右上角极淡）
              h('div', {
                style: {
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  opacity: 0.10,
                  pointerEvents: 'none',
                  color: card.color,
                },
              }, meta.decor),
              // Header
              h('div', {
                style: {
                  display: 'flex', alignItems: 'center', gap: '6px',
                  marginBottom: 'var(--space-md)',
                },
              },
                h('span', { style: { fontSize: '16px' } }, meta.icon),
                h('span', {
                  style: {
                    fontSize: '14px', fontWeight: 600, color: card.color,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  },
                }, meta.title),
              ),
              // Content
              card.content,
            );
          }),
        ),

        // ===== Highlights (Capsule List) =====
        highlights.length > 0 && h('div', {
          style: { marginBottom: 'var(--space-lg)' },
        },
          highlights.map((hl, i) => h('div', {
            key: i,
            style: {
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
              padding: '12px var(--space-lg)',
              marginBottom: 'var(--space-xs)',
              borderRadius: '14px',
              backgroundColor: hl.color + '12',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              minHeight: '48px',
            },
          },
            h('div', {
              style: {
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: hl.color + '25',
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
            display: 'flex', backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-sm)', padding: '3px',
            marginBottom: 'var(--space-md)', gap: '2px',
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

        // ===== 详情 Section =====
        activeTab === 'life' && h(ReviewSections.LifeReviewSection, { data: data.personal, range }),
        activeTab === 'puff' && h(ReviewSections.PuffFinanceReviewSection, { data: data.puff, range }),
        activeTab === 'orders' && h(ReviewSections.OrdersReviewSection, { data: data.orders, range }),

        // 全部无数据
        carouselCards.length === 0 && h('div', {
          style: { textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--color-text-tertiary)', fontSize: '14px' },
        }, '这个时间段内没有数据'),
      ) : null,
    ),
  );
}

window.ReviewPage = ReviewPage;

})();
