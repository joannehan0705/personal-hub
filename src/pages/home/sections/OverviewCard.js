(function() {
const { createElement: h, useState, useEffect } = React;

function OverviewCard() {
  const { dataVersion, navigate } = useApp();
  const [stats, setStats] = useState({
    todoCount: 0,
    puffCount: 0,
    hasOrders: false,
    expense: 0,
  });

  useEffect(() => {
    loadStats();
  }, [dataVersion]);

  const loadStats = async () => {
    const todos = await DAO.todos.getToday();
    const today = DateUtils.today();
    const txs = await DAO.transactions.getByDate(today);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // 泡芙统计：聚合今日订单的产品数量
    const all = await DAO.orders.getAll();
    const todayOrders = all.filter(
      o => o.pickupDate === today && o.status !== 'cancelled'
    );
    let puffCount = 0;
    for (const order of todayOrders) {
      if (!order.items) continue;
      for (const item of order.items) {
        puffCount += item.quantity || 0;
      }
    }

    setStats({
      todoCount: todos.length,
      puffCount,
      hasOrders: todayOrders.length > 0,
      expense,
    });
  };

  const items = [
    {
      label: '今日待办',
      value: stats.todoCount,
      color: 'var(--color-today)',
      onClick: () => navigate('/todo#group=today'),
    },
  ];

  if (stats.hasOrders) {
    items.push({
      label: '今日泡芙',
      value: stats.puffCount,
      color: 'var(--color-accent)',
      onClick: () => navigate('/puff/orders'),
    });
  }

  items.push({
    label: '今日支出',
    value: FormatUtils.money(stats.expense),
    color: 'var(--color-deadline)',
    onClick: () => navigate('/finance'),
  });

  return h(Card, null,
    h('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-around',
        textAlign: 'center',
      }
    },
      items.map((item, i) =>
        h('div', {
          key: i,
          onClick: () => { Haptics.light(); item.onClick(); },
          style: { cursor: 'pointer', flex: 1 }
        },
          h('div', {
            style: { fontSize: '28px', fontWeight: 700, color: item.color },
            className: 'numeric'
          }, item.value),
          h('div', {
            style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' }
          }, item.label)
        )
      )
    )
  );
}

window.OverviewCard = OverviewCard;
})();
