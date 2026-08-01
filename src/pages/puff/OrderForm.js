(function() {
/**
 * Personal Hub — 订单新增/编辑表单
 */

const { createElement: h, useState, useEffect } = React;

function OrderForm({ open, onClose, order }) {
  const { showToast } = useApp();
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([]);
  const [pickupDate, setPickupDate] = useState(DateUtils.today());
  const [pickupTime, setPickupTime] = useState('');
  const [status, setStatus] = useState('new');
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState([]);
  const [pickupPointId, setPickupPointId] = useState('');
  const [pickupPoints, setPickupPoints] = useState([]);

  useEffect(() => {
    if (open) {
      loadProducts();
      loadPickupPoints();
      if (order) {
        setCustomer(order.customer || '');
        setItems(order.items || []);
        setPickupDate(order.pickupDate || DateUtils.today());
        setPickupTime(order.pickupTime || '');
        setStatus(order.status || 'new');
        setNotes(order.notes || '');
        setPickupPointId(order.pickupPointId || '');
      } else {
        setCustomer(''); setItems([]); setPickupDate(DateUtils.today());
        setPickupTime(''); setStatus('new'); setNotes(''); setPickupPointId('');
      }
    }
  }, [open, order]);

  const loadProducts = async () => {
    const prods = await DAO.products.getActive();
    setProducts(prods);
  };

  const loadPickupPoints = async () => {
    const pts = await DAO.pickupPoints.getAll();
    setPickupPoints(pts);
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);

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
    onClose();
  };

  return h(Sheet, { open, onClose, title: order ? '编辑订单' : '新增订单' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      h(Input, {
        label: '顾客姓名',
        value: customer,
        onChange: setCustomer,
        placeholder: '输入顾客姓名',
        required: true,
      }),

      // 产品选择
      h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '产品'),
        products.length === 0
          ? h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', padding: 'var(--space-sm) 0' } }, '请先在产品管理中添加产品')
          : h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
              products.map(p =>
                h('button', {
                  key: p.id,
                  onClick: () => addItem(p),
                  style: {
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-secondary)',
                  }
                }, `${p.name} ${FormatUtils.money(p.price)}`)
              )
            )
      ),

      // 已选产品列表
      items.length > 0 && h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '已选产品'),
        items.map(item =>
          h('div', {
            key: item.productId,
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) 0',
            }
          },
            h('div', { style: { flex: 1 } },
              h('span', { style: { fontSize: '15px' } }, item.productName),
              h('span', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-sm)' }, className: 'numeric' },
                `${FormatUtils.money(item.unitPrice)} × ${item.quantity}`
              ),
            ),
            h('button', {
              onClick: () => updateQuantity(item.productId, -1),
              style: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
            }, '−'),
            h('span', { style: { fontSize: '15px', fontWeight: 600, minWidth: '24px', textAlign: 'center' }, className: 'numeric' }, item.quantity),
            h('button', {
              onClick: () => updateQuantity(item.productId, 1),
              style: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
            }, '+'),
          )
        ),
        // 合计
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: 'var(--space-sm) 0',
            borderTop: '1px solid var(--color-border)',
            marginTop: 'var(--space-sm)',
          }
        },
          h('span', { style: { fontSize: '15px', fontWeight: 600 } }, '合计'),
          h('span', {
            style: { fontSize: '22px', fontWeight: 700, color: 'var(--color-accent)' },
            className: 'numeric'
          }, FormatUtils.money(totalAmount))
        )
      ),

      h(Input, { label: '取货日期', value: pickupDate, onChange: setPickupDate, type: 'date', required: true }),
      h(Input, { label: '取货时间（可选）', value: pickupTime, onChange: setPickupTime, type: 'time' }),

      // 取货点选择
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

      h(Input, { label: '备注', value: notes, onChange: setNotes, placeholder: '如：少糖', multiline: true, rows: 2 }),

      h(Button, { fullWidth: true, onClick: handleSave }, order ? '保存' : '创建订单'),
    )
  );
}

window.OrderForm = OrderForm;

})();
