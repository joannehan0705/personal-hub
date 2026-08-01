(function() {
const { createElement: h, useState, useEffect } = React;
const S = window.TILE_STYLES;

function ProductionCard() {
  const { dataVersion, navigate } = useApp();
  const [stats, setStats] = useState({
    products: [],
    orderCount: 0,
    totalPuffs: 0,
    earliestTime: null,
  });

  useEffect(() => {
    loadStats();
  }, [dataVersion]);

  const loadStats = async () => {
    const today = DateUtils.today();
    const all = await DAO.orders.getAll();
    const todayOrders = all.filter(
      o => o.pickupDate === today && o.status !== 'cancelled'
    );

    const productMap = {};
    for (const order of todayOrders) {
      if (!order.items) continue;
      for (const item of order.items) {
        const name = item.productName || '未知';
        if (!productMap[name]) productMap[name] = 0;
        productMap[name] += item.quantity || 0;
      }
    }

    const products = Object.entries(productMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    const totalPuffs = products.reduce((sum, p) => sum + p.qty, 0);

    const times = todayOrders
      .map(o => o.pickupTime)
      .filter(Boolean)
      .sort();
    const earliestTime = times[0] || null;

    setStats({ products, orderCount: todayOrders.length, totalPuffs, earliestTime });
  };

  const fullWidthStyle = {
    ...S.TILE_STYLE,
    minHeight: 'auto',
  };

  const productGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-sm)',
    marginTop: 'var(--space-xs)',
  };

  const productItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-bg-subtle)',
  };

  return h('div', {
    style: fullWidthStyle,
    onClick: () => { Haptics.light(); navigate('/puff/orders'); },
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.98)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: S.TILE_HEADER_STYLE },
      h('span', { style: S.TILE_TITLE_STYLE }, '🧁 今日生产'),
      h('span', {
        style: { ...S.TILE_COUNT_STYLE, fontWeight: 500, color: 'var(--color-accent)' },
        className: 'numeric'
      },
        `${stats.orderCount} Orders · ${stats.totalPuffs} Puffs`
      )
    ),
    // 口味 2x2 grid
    stats.products.length > 0 && h('div', { style: productGridStyle },
      stats.products.slice(0, 4).map((p, i) =>
        h('div', { key: i, style: productItemStyle },
          h('span', {
            style: {
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }
          }, p.name),
          h('span', {
            style: {
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-accent)',
              flexShrink: 0,
              marginLeft: 'var(--space-xs)',
            },
            className: 'numeric'
          }, '×' + p.qty)
        )
      )
    ),
    // 底部信息行
    h('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'var(--space-md)',
        paddingTop: 'var(--space-sm)',
        borderTop: '1px solid var(--color-border-light)',
      }
    },
      h('span', {
        style: { fontSize: '13px', color: 'var(--color-text-tertiary)' }
      },
        stats.earliestTime
          ? `最早取货 ${FormatUtils.time(stats.earliestTime)}`
          : `${stats.orderCount} 个订单`
      ),
      h('span', {
        style: { fontSize: '13px', color: 'var(--color-accent)', fontWeight: 500 }
      }, '查看详情 >')
    )
  );
}

window.ProductionCard = ProductionCard;
})();
