(function() {
/**
 * Personal Hub — 订单创建/编辑页面（V2）
 * 全屏 POS 风格：搜索 + 分类分组 + 两列 Grid + 底部固定栏
 */

const { createElement: h, useState, useEffect } = React;

function OrderForm() {
  const { showToast, navigate, refreshData } = useApp();
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([]);
  const [pickupDate, setPickupDate] = useState(DateUtils.today());
  const [pickupTime, setPickupTime] = useState('');
  const [status, setStatus] = useState('new');
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState([]);
  const [pickupPointId, setPickupPointId] = useState('');
  const [pickupPoints, setPickupPoints] = useState([]);
  const [search, setSearch] = useState('');
  const [collapsedCats, setCollapsedCats] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);

  // 解析 URL 判断是新建还是编辑
  const hash = window.location.hash || '';
  const path = hash.replace(/^#/, '') || '/';
  const isEdit = path.includes('/puff/orders/edit');
  const editId = isEdit ? new URLSearchParams(hash.split('?')[1] || '').get('id') : null;

  useEffect(() => {
    loadData();
  }, [editId]);

  const loadData = async () => {
    const [prods, pts] = await Promise.all([
      DAO.products.getActive(),
      DAO.pickupPoints.getAll(),
    ]);
    setProducts(prods);
    setPickupPoints(pts);

    if (editId) {
      const o = await DAO.orders.getById(editId);
      if (o) {
        setOrder(o);
        setCustomer(o.customer || '');
        setItems(o.items || []);
        setPickupDate(o.pickupDate || DateUtils.today());
        setPickupTime(o.pickupTime || '');
        setStatus(o.status || 'new');
        setNotes(o.notes || '');
        setPickupPointId(o.pickupPointId || '');
      }
    } else {
      // 新建：重置
      setOrder(null);
      setCustomer(''); setItems([]); setPickupDate(DateUtils.today());
      setPickupTime(''); setStatus('new'); setNotes(''); setPickupPointId('');
    }

    // 默认折叠非 Classic 分类
    const cats = {};
    CATEGORIES.product.forEach(c => {
      if (c.key !== 'classic') cats[c.key] = true;
    });
    setCollapsedCats(cats);
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

  const addItem = (product) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(items.map(i =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
      }]);
    }
    Haptics.selection();
  };

  const updateQuantity = (productId, delta) => {
    setItems(items.map(i => {
      if (i.productId === productId) {
        const newQty = i.quantity + delta;
        return newQty <= 0 ? null : { ...i, quantity: newQty };
      }
      return i;
    }).filter(Boolean));
    Haptics.light();
  };

  const removeItem = (productId) => {
    setItems(items.filter(i => i.productId !== productId));
    Haptics.light();
  };

  const toggleCategory = (catKey) => {
    Haptics.light();
    setCollapsedCats(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const handleSave = async () => {
    if (!customer.trim()) {
      showToast('请输入顾客姓名', 'warning');
      return;
    }
    if (items.length === 0) {
      showToast('请至少添加一个产品', 'warning');
      return;
    }
    setSaving(true);

    const selectedPoint = pickupPoints.find(p => p.id === pickupPointId);

    const data = {
      customer: customer.trim(),
      items,
      totalAmount,
      pickupDate,
      pickupTime: pickupTime || null,
      pickupPointId: pickupPointId || null,
      pickupPointName: selectedPoint ? selectedPoint.name : null,
      status,
      notes: notes.trim(),
    };

    if (order) {
      await DAO.orders.update(order.id, data);
      showToast('订单已更新', 'success');
    } else {
      const orderNumber = await DAO.orders.getNextOrderNumber();
      await DAO.orders.create({ ...data, orderNumber });
      showToast('订单已创建', 'success');
    }
    Haptics.success();
    refreshData();
    navigate('/puff/orders');
  };

  // 按分类分组产品（过滤搜索）
  const filteredProducts = products.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q);
    }
    return true;
  });

  const groupedProducts = CATEGORIES.product.map(cat => ({
    ...cat,
    items: filteredProducts.filter(p => p.category === cat.key),
  })).filter(g => g.items.length > 0);

  // 产品卡片
  const renderProductCard = (product) => {
    const item = items.find(i => i.productId === product.id);
    const isSelected = !!item;

    return h('div', {
      key: product.id,
      onClick: () => addItem(product),
      style: {
        backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-bg-card)',
        border: isSelected ? 'none' : '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minHeight: '80px',
        justifyContent: 'center',
        transition: 'all 0.15s',
        boxShadow: 'var(--shadow-1)',
        position: 'relative',
      }
    },
      // 产品名 + 价格
      h('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }
      },
        h('span', {
          style: {
            fontSize: '14px', fontWeight: 600,
            color: isSelected ? '#FFFFFF' : 'var(--color-text-primary)',
            flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }
        }, product.name),
        h('span', {
          style: {
            fontSize: '12px', fontWeight: 500,
            color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--color-text-tertiary)',
            flexShrink: 0,
          }, className: 'numeric'
        }, FormatUtils.money(product.price))
      ),
      // 选中时显示数量控制
      isSelected && h('div', {
        onClick: (e) => e.stopPropagation(),
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '2px',
        }
      },
        h('button', {
          onClick: () => updateQuantity(product.id, -1),
          style: {
            width: '26px', height: '26px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.25)',
            color: '#FFFFFF', fontSize: '16px', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer',
          }
        }, '−'),
        h('span', {
          style: { fontSize: '15px', fontWeight: 700, color: '#FFFFFF' },
          className: 'numeric'
        }, item.quantity),
        h('button', {
          onClick: () => updateQuantity(product.id, 1),
          style: {
            width: '26px', height: '26px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.25)',
            color: '#FFFFFF', fontSize: '16px', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer',
          }
        }, '+')
      )
    );
  };

  // 分类区域
  const renderCategory = (cat) => {
    const isCollapsed = collapsedCats[cat.key];
    return h('div', {
      key: cat.key,
      style: { marginBottom: 'var(--space-md)' }
    },
      // 分类标题
      h('div', {
        onClick: () => toggleCategory(cat.key),
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 4px',
          cursor: 'pointer',
        }
      },
        h('div', {
          style: { display: 'flex', alignItems: 'center', gap: '6px' }
        },
          h('span', { style: { fontSize: '15px' } }, cat.icon),
          h('span', {
            style: { fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }
          }, cat.label),
          h('span', {
            style: { fontSize: '12px', color: 'var(--color-text-tertiary)' }
          }, `(${cat.items.length})`)
        ),
        h('span', {
          style: {
            fontSize: '14px', color: 'var(--color-text-tertiary)',
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }
        }, '▼')
      ),
      // 产品 Grid
      !isCollapsed && h('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-sm)',
          padding: '4px 0',
        }
      }, cat.items.map(renderProductCard))
    );
  };

  // 已选产品详情列表（在底部 Sheet 中展开）
  const renderSummarySheet = () =>
    h(Sheet, {
      open: showSummary,
      onClose: () => setShowSummary(false),
      title: `已选产品 (${totalQty}件)`,
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' } },
        items.map(item =>
          h('div', {
            key: item.productId,
            style: {
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
              padding: '10px 0',
              borderBottom: '1px solid var(--color-border-light)',
            }
          },
            h('div', { style: { flex: 1, minWidth: 0 } },
              h('div', {
                style: { fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }
              }, item.productName),
              h('div', {
                style: { fontSize: '13px', color: 'var(--color-text-tertiary)' },
                className: 'numeric'
              }, `${FormatUtils.money(item.unitPrice)} × ${item.quantity} = ${FormatUtils.money(item.unitPrice * item.quantity)}`)
            ),
            h('button', {
              onClick: () => updateQuantity(item.productId, -1),
              style: {
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: 'var(--color-bg-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', lineHeight: 1, border: 'none', cursor: 'pointer',
              }
            }, '−'),
            h('span', {
              style: { fontSize: '15px', fontWeight: 600, minWidth: '24px', textAlign: 'center' },
              className: 'numeric'
            }, item.quantity),
            h('button', {
              onClick: () => updateQuantity(item.productId, 1),
              style: {
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: 'var(--color-bg-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', lineHeight: 1, border: 'none', cursor: 'pointer',
              }
            }, '+'),
            h('button', {
              onClick: () => removeItem(item.productId),
              style: {
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: 'rgba(232,130,107,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', marginLeft: '4px',
              }
            }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-deadline)' }))
          )
        ),
        // 合计
        h('div', {
          style: {
            display: 'flex', justifyContent: 'space-between',
            padding: '12px 0 0',
            borderTop: '2px solid var(--color-border)',
          }
        },
          h('span', { style: { fontSize: '16px', fontWeight: 600 } }, '合计'),
          h('span', {
            style: { fontSize: '22px', fontWeight: 700, color: 'var(--color-accent)' },
            className: 'numeric'
          }, FormatUtils.money(totalAmount))
        )
      )
    );

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },

    h(NavBar, {
      title: order ? '编辑订单' : '新增订单', showBack: true,
      onBack: () => navigate('/puff/orders'),
    }),

    h('div', {
      className: 'scroll-container page',
      style: { paddingBottom: '90px' }
    },
      // 搜索框
      h('div', {
        style: { padding: 'var(--space-sm) var(--space-lg) var(--space-xs)' }
      },
        h('input', {
          type: 'text',
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: '搜索产品…',
          style: {
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-light)',
            backgroundColor: 'var(--color-bg-subtle)',
            fontSize: '15px',
            color: 'var(--color-text-primary)',
            outline: 'none',
            boxSizing: 'border-box',
          }
        })
      ),

      // 产品分类列表
      h('div', {
        style: { padding: '0 var(--space-lg)' }
      },
        groupedProducts.length === 0
          ? h('div', {
              style: { textAlign: 'center', padding: 'var(--space-xl) 0', color: 'var(--color-text-tertiary)', fontSize: '14px' }
            }, '没有找到产品')
          : groupedProducts.map(renderCategory)
      ),

      // 分隔线
      h('div', {
        style: {
          height: '1px',
          backgroundColor: 'var(--color-border-light)',
          margin: 'var(--space-lg) var(--space-lg)',
        }
      }),

      // 订单信息
      h('div', {
        style: { padding: '0 var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }
      },
        h(Input, {
          label: '顾客姓名',
          value: customer,
          onChange: setCustomer,
          placeholder: '输入顾客姓名',
          required: true,
        }),

        h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
          h('div', { style: { flex: 1 } },
            h(Input, { label: '取货日期', value: pickupDate, onChange: setPickupDate, type: 'date', required: true })
          ),
          h('div', { style: { flex: 1 } },
            h(Input, { label: '取货时间', value: pickupTime, onChange: setPickupTime, type: 'time' })
          ),
        ),

        // 取货点
        pickupPoints.length > 0 && h('div', null,
          h('label', {
            style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
          }, '取货点'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
            h('button', {
              onClick: () => { Haptics.selection(); setPickupPointId(''); },
              style: {
                padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
                backgroundColor: !pickupPointId ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: !pickupPointId ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, '不指定'),
            pickupPoints.map(p =>
              h('button', {
                key: p.id,
                onClick: () => { Haptics.selection(); setPickupPointId(p.id); },
                style: {
                  padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
                  backgroundColor: pickupPointId === p.id ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: pickupPointId === p.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, p.name)
            )
          )
        ),

        // 状态
        h('div', null,
          h('label', {
            style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
          }, '状态'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
            Object.entries(APP_CONFIG.orderStatus).map(([key, val]) =>
              h('button', {
                key,
                onClick: () => { Haptics.selection(); setStatus(key); },
                style: {
                  padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
                  backgroundColor: status === key ? val.color : 'var(--color-bg-subtle)',
                  color: status === key ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, val.label)
            )
          )
        ),

        h(Input, {
          label: '备注', value: notes, onChange: setNotes,
          placeholder: '如：少糖', multiline: true, rows: 2,
        }),
      ),
    ),

    // 底部固定栏
    h('div', {
      style: {
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        padding: 'var(--space-md) var(--space-lg)',
        backgroundColor: 'var(--color-bg-card)',
        borderTop: '1px solid var(--color-border-light)',
        paddingBottom: 'calc(var(--space-md) + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))',
        zIndex: 100,
      }
    },
      // 左侧：已选摘要（点击展开详情）
      h('div', {
        onClick: () => { if (items.length > 0) { Haptics.light(); setShowSummary(true); } },
        style: { flex: 1, cursor: items.length > 0 ? 'pointer' : 'default' }
      },
        items.length > 0
          ? h('div', null,
              h('div', {
                style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }
              }, `已选 ${totalQty} 件 · ${FormatUtils.money(totalAmount)}`),
              h('div', {
                style: { fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '1px' }
              }, '点击查看详情')
            )
          : h('div', {
              style: { fontSize: '14px', color: 'var(--color-text-tertiary)' }
            }, '未选择产品')
      ),
      // 右侧：保存按钮
      h('button', {
        onClick: handleSave,
        disabled: saving || items.length === 0,
        style: {
          padding: '12px 32px',
          borderRadius: 'var(--radius-pill)',
          fontSize: '16px', fontWeight: 700,
          backgroundColor: 'var(--color-accent)',
          color: '#FFFFFF',
          border: 'none',
          opacity: (saving || items.length === 0) ? 0.5 : 1,
          flexShrink: 0,
        }
      }, order ? '保存' : '创建')
    ),

    // 已选产品详情 Sheet
    renderSummarySheet()
  );
}

window.OrderForm = OrderForm;

})();
