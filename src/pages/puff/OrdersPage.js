(function() {
/**
 * Personal Hub — 泡芙订单列表页
 * 一级筛选：待处理 / 已完成 / 全部
 * 二级筛选：全部 / 按取货点 / 按产品
 */

const { createElement: h, useState, useEffect } = React;

function OrdersPage() {
  const { dataVersion, refreshData, navigate } = useApp();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [subFilter, setSubFilter] = useState('all');
  const [subSelection, setSubSelection] = useState(''); // pickupPointId 或 productId
  const [detailOrder, setDetailOrder] = useState(null);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadOrders();
    loadFilters();
  }, [dataVersion, filter]);

  const loadFilters = async () => {
    const [pts, prods] = await Promise.all([
      DAO.pickupPoints.getAll(),
      DAO.products.getAll(),
    ]);
    setPickupPoints(pts);
    setProducts(prods);
  };

  const loadOrders = async () => {
    let data;
    if (filter === 'pending') {
      const [newOrders, confirmed, making, ready] = await Promise.all([
        DAO.orders.getByStatus('new'),
        DAO.orders.getByStatus('confirmed'),
        DAO.orders.getByStatus('making'),
        DAO.orders.getByStatus('ready'),
      ]);
      data = [...newOrders, ...confirmed, ...making, ...ready].sort((a, b) =>
        (a.pickupDate || '').localeCompare(b.pickupDate || '')
      );
    } else if (filter === 'completed') {
      const [completed, cancelled] = await Promise.all([
        DAO.orders.getByStatus('completed'),
        DAO.orders.getByStatus('cancelled'),
      ]);
      data = [...completed, ...cancelled].sort((a, b) =>
        (b.pickupDate || '').localeCompare(a.pickupDate || '')
      );
    } else {
      data = await DAO.orders.getAll();
      data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    setOrders(data);
  };

  // 二级筛选
  let displayOrders = orders;
  if (subFilter === 'pickupPoint' && subSelection) {
    displayOrders = orders.filter(o => o.pickupPointId === subSelection);
  } else if (subFilter === 'product' && subSelection) {
    displayOrders = orders.filter(o => o.items && o.items.some(i => i.productId === subSelection));
  }

  const handleEdit = (order) => {
    navigate('/puff/orders/edit?id=' + order.id);
  };

  const filters = [
    { key: 'pending', label: '待处理' },
    { key: 'completed', label: '已完成' },
    { key: 'all', label: '全部' },
  ];

  const subFilters = [
    { key: 'all', label: '全部' },
    { key: 'pickupPoint', label: '按取货点' },
    { key: 'product', label: '按产品' },
  ];

  const renderOrder = (order) => {
    const status = APP_CONFIG.orderStatus[order.status] || APP_CONFIG.orderStatus.new;
    const itemsText = order.items?.map(i => `${i.productName}×${i.quantity}`).join(' ') || '';

    return h('div', {
      key: order.id,
      onClick: () => { Haptics.light(); setDetailOrder(order); },
      style: {
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
      }
    },
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
        }
      },
        h('span', {
          style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }
        }, order.customer),
        h(Tag, { color: status.color }, status.label)
      ),
      h('div', {
        style: { fontSize: '13px', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
      }, itemsText),
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '6px',
          flexWrap: 'wrap',
          gap: '4px',
        }
      },
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
            flexWrap: 'wrap',
          }
        },
          h(Icon, { name: 'calendar', size: 14, color: 'var(--color-text-tertiary)' }),
          DateUtils.friendlyDate(order.pickupDate),
          order.pickupTime && ` ${FormatUtils.time(order.pickupTime)}`,
          order.pickupPointName && h('span', { style: { marginLeft: '4px' } }, '· 📍 ', order.pickupPointName),
        ),
        h('span', {
          style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' },
          className: 'numeric'
        }, FormatUtils.money(order.totalAmount))
      )
    )
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '订单', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); navigate('/puff/orders/new'); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    // 一级筛选 Tab
    h('div', {
      style: {
        display: 'flex',
        gap: 'var(--space-xs)',
        padding: '0 var(--space-lg) var(--space-xs)',
      }
    },
      filters.map(f =>
        h('button', {
          key: f.key,
          onClick: () => { Haptics.selection(); setFilter(f.key); setSubFilter('all'); setSubSelection(''); },
          style: {
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: filter === f.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: filter === f.key ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, f.label)
      )
    ),

    // 二级筛选 Tab
    h('div', {
      style: {
        display: 'flex',
        gap: 'var(--space-xs)',
        padding: '0 var(--space-lg) var(--space-xs)',
      }
    },
      subFilters.map(sf =>
        h('button', {
          key: sf.key,
          onClick: () => { Haptics.selection(); setSubFilter(sf.key); setSubSelection(''); },
          style: {
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: subFilter === sf.key ? 'var(--color-text-secondary)' : 'transparent',
            color: subFilter === sf.key ? '#FFFFFF' : 'var(--color-text-tertiary)',
            border: '1px solid ' + (subFilter === sf.key ? 'var(--color-text-secondary)' : 'var(--color-border)'),
          }
        }, sf.label)
      )
    ),

    // 二级选择器（取货点或产品列表）
    subFilter === 'pickupPoint' && pickupPoints.length > 0 && h('div', {
      style: {
        display: 'flex', gap: 'var(--space-xs)',
        padding: '0 var(--space-lg) var(--space-xs)',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }
    },
      h('button', {
        onClick: () => { Haptics.selection(); setSubSelection(''); },
        style: {
          padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
          whiteSpace: 'nowrap', flexShrink: 0,
          backgroundColor: !subSelection ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
          color: !subSelection ? '#FFFFFF' : 'var(--color-text-secondary)',
        }
      }, '全部'),
      pickupPoints.map(p =>
        h('button', {
          key: p.id,
          onClick: () => { Haptics.selection(); setSubSelection(p.id); },
          style: {
            padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
            whiteSpace: 'nowrap', flexShrink: 0,
            backgroundColor: subSelection === p.id ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: subSelection === p.id ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, p.name)
      )
    ),

    subFilter === 'product' && products.length > 0 && h('div', {
      style: {
        display: 'flex', gap: 'var(--space-xs)',
        padding: '0 var(--space-lg) var(--space-xs)',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }
    },
      h('button', {
        onClick: () => { Haptics.selection(); setSubSelection(''); },
        style: {
          padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
          whiteSpace: 'nowrap', flexShrink: 0,
          backgroundColor: !subSelection ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
          color: !subSelection ? '#FFFFFF' : 'var(--color-text-secondary)',
        }
      }, '全部'),
      products.map(p =>
        h('button', {
          key: p.id,
          onClick: () => { Haptics.selection(); setSubSelection(p.id); },
          style: {
            padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
            whiteSpace: 'nowrap', flexShrink: 0,
            backgroundColor: subSelection === p.id ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: subSelection === p.id ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, p.name)
      )
    ),

    h('div', { className: 'scroll-container page' },
      displayOrders.length === 0
        ? h(EmptyState, { icon: '📦', title: '没有匹配的订单', subtitle: '点击右上角 + 新建订单' })
        : h('div', null, displayOrders.map(renderOrder))
    ),

    h(OrderDetail, {
      order: detailOrder,
      onClose: () => setDetailOrder(null),
      onRefresh: refreshData,
      onEdit: handleEdit,
    })
  );
}

window.OrdersPage = OrdersPage;

})();