(function() {
/**
 * Personal Hub — 泡芙订单工作台（V2）
 * 三种 View：All Orders / Production / Pickup
 */

const { createElement: h, useState, useEffect } = React;

function OrdersPage() {
  const { dataVersion, refreshData, navigate } = useApp();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending / completed / all
  const [viewMode, setViewMode] = useState('all'); // all / production / pickup
  const [showViewSheet, setShowViewSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [detailOrder, setDetailOrder] = useState(null);

  useEffect(() => { loadOrders(); }, [dataVersion, filter]);

  const loadOrders = async () => {
    let data;
    if (filter === 'pending') {
      const [pending, making, ready] = await Promise.all([
        DAO.orders.getByStatus('pending'),
        DAO.orders.getByStatus('making'),
        DAO.orders.getByStatus('ready'),
      ]);
      data = [...pending, ...making, ...ready].sort((a, b) =>
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
      data.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }
    setOrders(data);
  };

  // 搜索过滤
  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (o.customer && o.customer.toLowerCase().includes(q)) return true;
    if (o.pickupPointName && o.pickupPointName.toLowerCase().includes(q)) return true;
    if (o.items && o.items.some(i => i.productName && i.productName.toLowerCase().includes(q))) return true;
    return false;
  });

  const handleEdit = (order) => {
    navigate('/puff/orders/edit?id=' + order.id);
  };

  // 计算总泡芙数
  const totalPuffs = filteredOrders.reduce((sum, o) =>
    sum + (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0
  );

  // ===== All Orders View =====
  const renderOrderCard = (order) => {
    const statusInfo = APP_CONFIG.orderStatus[order.status] || APP_CONFIG.orderStatus.pending;
    const productSummary = (order.items || []).map(i => `${i.productName} ×${i.quantity}`).join('  ');

    return h('div', {
      key: order.id,
      onClick: () => { Haptics.light(); setDetailOrder(order); },
      style: {
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
        padding: '14px 16px',
        marginBottom: '10px',
        cursor: 'pointer',
      }
    },
      // 顾客 + 状态
      h('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }
      },
        h('span', { style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' } }, order.customer),
        h('span', {
          style: {
            fontSize: '12px', fontWeight: 500,
            backgroundColor: statusInfo.color + '20',
            color: statusInfo.color,
            padding: '2px 10px', borderRadius: 'var(--radius-pill)',
          }
        }, statusInfo.label)
      ),
      // 产品摘要
      h('div', {
        style: { fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '6px' }
      }, productSummary || '无产品'),
      // 底部信息
      h('div', {
        style: {
          display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap',
          fontSize: '12px', color: 'var(--color-text-tertiary)',
        }
      },
        h('span', null, '📅 ', DateUtils.friendlyDate(order.pickupDate)),
        order.pickupTime && h('span', null, '⏰ ', order.pickupTime),
        order.pickupPointName && h('span', null, '📍 ', order.pickupPointName),
        h('span', { className: 'numeric' }, '$', FormatUtils.money(order.totalAmount)),
      )
    );
  };

  const renderAllOrders = () =>
    filteredOrders.length === 0
      ? h(EmptyState, { icon: '📦', title: '没有匹配的订单', subtitle: '点击右上角 + 新建订单' })
      : h('div', null, filteredOrders.map(renderOrderCard));

  // ===== Production View =====
  const renderProduction = () => {
    // 按产品聚合
    const productMap = {}; // productId -> { name, totalQty, orders: [{customer, qty}] }
    filteredOrders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.productName, totalQty: 0, orders: [] };
        }
        productMap[item.productId].totalQty += item.quantity;
        productMap[item.productId].orders.push({ customer: o.customer, qty: item.quantity });
      });
    });

    const products = Object.values(productMap).sort((a, b) => b.totalQty - a.totalQty);
    const uniqueCount = products.length;

    return h('div', null,
      // 统计概览
      h('div', {
        style: {
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-1)',
          padding: '16px 20px',
          marginBottom: '16px',
        }
      },
        h('div', {
          style: { fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }
        }, "Today's Production"),
        h('div', {
          style: { display: 'flex', gap: '20px' }
        },
          h('div', null,
            h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } }, 'Orders'),
            h('div', { style: { fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }, className: 'numeric' }, filteredOrders.length)
          ),
          h('div', null,
            h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } }, 'Total Puffs'),
            h('div', { style: { fontSize: '20px', fontWeight: 700, color: 'var(--color-accent)' }, className: 'numeric' }, totalPuffs)
          ),
          h('div', null,
            h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } }, 'Products'),
            h('div', { style: { fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }, className: 'numeric' }, uniqueCount)
          )
        )
      ),
      // 产品列表
      products.length === 0
        ? h('div', { style: { textAlign: 'center', padding: 'var(--space-xl) 0', color: 'var(--color-text-tertiary)', fontSize: '14px' } }, '没有需要制作的产品')
        : products.map((p, idx) =>
            h('div', {
              key: idx,
              style: {
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-1)',
                padding: '14px 16px',
                marginBottom: '10px',
              }
            },
              // 产品名 + 总量
              h('div', {
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }
              },
                h('span', { style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' } }, p.name),
                h('span', {
                  style: { fontSize: '15px', fontWeight: 700, color: 'var(--color-accent)' },
                  className: 'numeric'
                }, `Total: ${p.totalQty} pcs`)
              ),
              // 订单列表
              h('div', null,
                p.orders.map((o, i) =>
                  h('div', {
                    key: i,
                    style: {
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '13px', color: 'var(--color-text-secondary)',
                      padding: '3px 0',
                    }
                  },
                    h('span', null, '─ ', o.customer),
                    h('span', { className: 'numeric', style: { fontWeight: 500 } }, '×', o.qty)
                  )
                )
              )
            )
          )
    );
  };

  // ===== Pickup View =====
  const renderPickup = () => {
    // 按取货点分组
    const pointMap = {}; // pickupPointId -> { name, orders: [], totalPuffs }
    filteredOrders.forEach(o => {
      const pid = o.pickupPointId || '_none';
      if (!pointMap[pid]) {
        pointMap[pid] = { name: o.pickupPointName || '未指定取货点', orders: [], totalPuffs: 0 };
      }
      pointMap[pid].orders.push(o);
      pointMap[pid].totalPuffs += (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
    });

    const points = Object.values(pointMap).sort((a, b) => b.orders.length - a.orders.length);

    return h('div', null,
      points.length === 0
        ? h('div', { style: { textAlign: 'center', padding: 'var(--space-xl) 0', color: 'var(--color-text-tertiary)', fontSize: '14px' } }, '没有订单')
        : points.map((p, idx) =>
            h('div', {
              key: idx,
              style: {
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-1)',
                padding: '14px 16px',
                marginBottom: '10px',
              }
            },
              // 取货点 + 统计
              h('div', {
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }
              },
                h('div', null,
                  h('span', { style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' } }, '📍 ', p.name),
                ),
                h('div', {
                  style: { display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--color-text-tertiary)' }
                },
                  h('span', { className: 'numeric' }, `${p.orders.length} Orders`),
                  h('span', { className: 'numeric', style: { fontWeight: 600, color: 'var(--color-accent)' } }, `${p.totalPuffs} Puffs`)
                )
              ),
              // 顾客列表
              h('div', {
                style: {
                  display: 'flex', flexWrap: 'wrap', gap: '6px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--color-border-light)',
                }
              },
                p.orders.map((o, i) =>
                  h('span', {
                    key: i,
                    style: {
                      fontSize: '13px', color: 'var(--color-text-secondary)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                    }
                  }, o.customer)
                )
              )
            )
          )
    );
  };

  const viewLabels = { all: 'All Orders', production: 'Production', pickup: 'Pickup' };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },

    h(NavBar, {
      title: '订单', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); navigate('/puff/orders/new'); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    // 一级 Tab
    h('div', {
      style: { display: 'flex', gap: 'var(--space-xs)', padding: '0 var(--space-lg) var(--space-sm)' }
    },
      h('button', {
        onClick: () => { Haptics.selection(); setFilter('pending'); },
        style: {
          flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
          fontSize: '14px', fontWeight: 500,
          backgroundColor: filter === 'pending' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
          color: filter === 'pending' ? '#FFFFFF' : 'var(--color-text-secondary)',
        }
      }, '待处理'),
      h('button', {
        onClick: () => { Haptics.selection(); setFilter('completed'); },
        style: {
          flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
          fontSize: '14px', fontWeight: 500,
          backgroundColor: filter === 'completed' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
          color: filter === 'completed' ? '#FFFFFF' : 'var(--color-text-secondary)',
        }
      }, '已完成'),
      h('button', {
        onClick: () => { Haptics.selection(); setFilter('all'); },
        style: {
          flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
          fontSize: '14px', fontWeight: 500,
          backgroundColor: filter === 'all' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
          color: filter === 'all' ? '#FFFFFF' : 'var(--color-text-secondary)',
        }
      }, '全部')
    ),

    // 搜索 + View 切换
    h('div', {
      style: {
        display: 'flex', gap: 'var(--space-sm)',
        padding: '0 var(--space-lg) var(--space-sm)',
        alignItems: 'center',
      }
    },
      h('input', {
        type: 'text',
        value: search,
        onChange: (e) => setSearch(e.target.value),
        placeholder: '🔍 Search orders…',
        style: {
          flex: 1,
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border-light)',
          backgroundColor: 'var(--color-bg-subtle)',
          fontSize: '14px',
          color: 'var(--color-text-primary)',
          outline: 'none',
          boxSizing: 'border-box',
        }
      }),
      h('button', {
        onClick: () => { Haptics.light(); setShowViewSheet(true); },
        style: {
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-bg-subtle)',
          fontSize: '14px', fontWeight: 500,
          color: 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: '4px',
          flexShrink: 0,
        }
      }, viewLabels[viewMode], h('span', { style: { fontSize: '10px' } }, '▼'))
    ),

    // 内容区域
    h('div', { className: 'scroll-container page' },
      viewMode === 'all' ? renderAllOrders()
      : viewMode === 'production' ? renderProduction()
      : renderPickup()
    ),

    // View 选择 Sheet
    h(Sheet, {
      open: showViewSheet,
      onClose: () => setShowViewSheet(false),
      title: 'View By',
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' } },
        [
          { key: 'all', label: 'All Orders', desc: '管理所有订单' },
          { key: 'production', label: 'Production', desc: '按产品统计制作数量' },
          { key: 'pickup', label: 'Pickup', desc: '按取货点分组查看' },
        ].map(v =>
          h('div', {
            key: v.key,
            onClick: () => { Haptics.selection(); setViewMode(v.key); setShowViewSheet(false); },
            style: {
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: viewMode === v.key ? 'var(--color-bg-subtle)' : 'transparent',
              cursor: 'pointer',
            }
          },
            h('div', null,
              h('div', { style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' } }, v.label),
              h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, v.desc)
            ),
            viewMode === v.key && h('span', {
              style: { fontSize: '18px', color: 'var(--color-accent)' }
            }, '✓')
          )
        )
      )
    ),

    // 订单详情
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
