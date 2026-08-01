(function() {
/**
 * Personal Hub — 顾客管理页
 */

const { createElement: h, useState, useEffect } = React;

function CustomersPage() {
  const { dataVersion, refreshData, showToast } = useApp();
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [orders, setOrders] = useState([]);

  // 表单状态
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wechat, setWechat] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [dataVersion]);

  const loadData = async () => {
    const [customerData, orderData] = await Promise.all([
      DAO.customers.getAll(),
      DAO.orders.getAll(),
    ]);
    customerData.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    setCustomers(customerData);
    setOrders(orderData);
  };

  const openForm = (customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setWechat(customer.wechat || '');
      setNotes(customer.notes || '');
    } else {
      setEditingCustomer(null);
      setName('');
      setPhone('');
      setWechat('');
      setNotes('');
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    refreshData();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('请输入顾客姓名', 'warning');
      return;
    }

    const data = {
      name: name.trim(),
      phone: phone.trim(),
      wechat: wechat.trim(),
      notes: notes.trim(),
    };

    if (editingCustomer) {
      await DAO.customers.update(editingCustomer.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.customers.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    handleCloseForm();
  };

  const handleDelete = async (customer) => {
    await DAO.customers.delete(customer.id);
    showToast('已删除', 'success');
    Haptics.success();
    refreshData();
  };

  const getCustomerStats = (customerId) => {
    const customerOrders = orders.filter(o => o.customer === customers.find(c => c.id === customerId)?.name);
    const orderCount = customerOrders.length;
    const totalSpend = customerOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return { orderCount, totalSpend };
  };

  const renderCustomer = (customer) => {
    const stats = getCustomerStats(customer.id);

    return h('div', {
      key: customer.id,
      style: {
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
      }
    },
      h('div', {
        style: { display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }
      },
        // 信息
        h('div', {
          onClick: () => { Haptics.light(); openForm(customer); },
          style: { flex: 1, minWidth: 0 }
        },
          h('div', { style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' } }, customer.name),
          h('div', {
            style: {
              fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px',
              display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)',
            }
          },
            customer.phone && h('span', null, `${customer.phone}`),
            customer.wechat && h('span', null, `微信: ${customer.wechat}`),
          ),
          h('div', {
            style: {
              fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px',
              display: 'flex', gap: 'var(--space-md)',
            }
          },
            h('span', null, `${stats.orderCount} 单`),
            h('span', { className: 'numeric' }, FormatUtils.money(stats.totalSpend)),
          ),
        ),

        // 删除按钮
        h('button', {
          onClick: () => handleDelete(customer),
          style: {
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: 'var(--color-bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }
        }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
      )
    );
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '顾客', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); openForm(null); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    h('div', { className: 'scroll-container page' },
      h('div', { className: 'section-header' }, '顾客列表'),
      customers.length === 0
        ? h(EmptyState, { icon: '👥', title: '还没有顾客', subtitle: '点击右上角 + 添加顾客' })
        : h('div', null, customers.map(renderCustomer))
    ),

    // 新增/编辑表单
    h(Sheet, {
      open: showForm,
      onClose: handleCloseForm,
      title: editingCustomer ? '编辑顾客' : '新增顾客',
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },
        h(Input, {
          label: '姓名',
          value: name,
          onChange: setName,
          placeholder: '输入顾客姓名',
          required: true,
        }),
        h(Input, {
          label: '电话',
          value: phone,
          onChange: setPhone,
          placeholder: '输入电话号码',
          type: 'tel',
        }),
        h(Input, {
          label: '微信',
          value: wechat,
          onChange: setWechat,
          placeholder: '输入微信号（可选）',
        }),
        h(Input, {
          label: '备注',
          value: notes,
          onChange: setNotes,
          placeholder: '如：老顾客、偏好口味等',
          multiline: true,
          rows: 2,
        }),
        h(Button, { fullWidth: true, onClick: handleSave }, editingCustomer ? '保存' : '添加'),
      )
    )
  );
}

window.CustomersPage = CustomersPage;

})();
