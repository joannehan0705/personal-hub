(function() {
/**
 * Personal Hub — 首页概览卡片
 */

const { createElement: h, useState, useEffect } = React;

function OverviewCard() {
  const { dataVersion, navigate } = useApp();
  const [stats, setStats] = useState({ todoCount: 0, expense: 0, orderCount: 0 });

  useEffect(() => {
    loadStats();
  }, [dataVersion]);

  const loadStats = async () => {
    const todos = await DAO.todos.getToday();
    const today = DateUtils.today();
    const txs = await DAO.transactions.getByDate(today);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const orders = await DAO.orders.getTodayPickups();

    setStats({
      todoCount: todos.length,
      expense,
      orderCount: orders.length,
    });
  };

  const items = [
    { label: '待办', value: stats.todoCount, color: 'var(--color-today)', onClick: () => navigate('/todo') },
    { label: '今日支出', value: FormatUtils.money(stats.expense), color: 'var(--color-deadline)', onClick: () => navigate('/finance') },
    { label: '取货', value: stats.orderCount, color: 'var(--color-accent)', onClick: () => navigate('/puff/orders') },
  ];

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
          style: { cursor: 'pointer', flex: 1 },
        },
          h('div', {
            style: {
              fontSize: '28px',
              fontWeight: 700,
              color: item.color,
            },
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
