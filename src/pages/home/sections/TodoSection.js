(function() {
/**
 * Personal Hub — V2 首页区块组件
 * 所有区块改为圆角卡片 tile 样式，2列网格布局
 * 包含：OverviewCard, TodoCard, SomedayCard, ShoppingCard, FinanceCard, AlexCard, PetCard, OrderCard
 */

const { createElement: h, useState, useEffect } = React;

// ===== 通用卡片 Tile 样式 =====
const tileStyle = {
  backgroundColor: 'var(--color-bg-card)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-lg)',
  boxShadow: 'var(--shadow-1)',
  cursor: 'pointer',
  transition: 'transform 0.1s, background-color 0.15s',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-sm)',
  minHeight: '120px',
  overflow: 'hidden',
};

const tileHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 'var(--space-xs)',
};

const tileTitleStyle = {
  fontSize: '15px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-xs)',
};

const tileCountStyle = {
  fontSize: '13px',
  color: 'var(--color-text-tertiary)',
  fontWeight: 400,
};

const tileListStyle = {
  overflow: 'hidden',
  maxHeight: '100px',
};

const tileItemStyle = {
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  lineHeight: '1.6',
};

const tileEmptyStyle = {
  fontSize: '13px',
  color: 'var(--color-text-tertiary)',
  textAlign: 'center',
  padding: 'var(--space-sm) 0',
};

// ===== 今日待办卡片 =====
function TodoCard() {
  const { dataVersion, navigate, homeCollapsed, dispatch, ACTIONS } = useApp();
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    DAO.todos.getToday().then(setTodos);
  }, [dataVersion]);

  const handleComplete = async (todo) => {
    if (todo.completed) {
      await DAO.todos.uncomplete(todo.id);
    } else {
      await DAO.todos.complete(todo.id);
    }
    dispatch({ type: ACTIONS.INCREMENT_DATA_VERSION });
  };

  return h('div', {
    style: tileStyle,
    onClick: () => navigate('/todo#group=today'),
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: tileHeaderStyle },
      h('span', { style: tileTitleStyle }, '📋', ' 今日待办'),
      h('span', { style: tileCountStyle }, todos.length ? `${todos.length}项` : '')
    ),
    todos.length === 0
      ? h('div', { style: tileEmptyStyle }, '今天没有待办 ☕')
      : h('div', { style: tileListStyle },
          todos.slice(0, 4).map(todo =>
            h('div', {
              key: todo.id,
              style: { fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.6',
                color: todo.completed ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
                textDecoration: todo.completed ? 'line-through' : 'none',
              }
            },
              todo.title,
              todo.time
                ? h('span', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-xs)' } }, todo.time)
                : null
            )
          )
        )
  );
}

// ===== 时间待定卡片 =====
function SomedayCard() {
  const { dataVersion, navigate } = useApp();
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    DAO.todos.getByStatus('someday').then(setTodos);
  }, [dataVersion]);

  return h('div', {
    style: tileStyle,
    onClick: () => navigate('/todo#group=someday'),
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: tileHeaderStyle },
      h('span', { style: tileTitleStyle }, '⏳', ' To Do'),
      h('span', { style: tileCountStyle }, todos.length ? `${todos.length}项` : '')
    ),
    todos.length === 0
      ? h('div', { style: tileEmptyStyle }, '暂无待定事项')
      : h('div', { style: tileListStyle },
          todos.slice(0, 4).map(todo =>
            h('div', {
              key: todo.id,
              style: { fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.6', color: 'var(--color-text-secondary)' }
            }, todo.title)
          )
        )
  );
}

// ===== 购物清单卡片 =====
function ShoppingCard() {
  const { dataVersion, navigate } = useApp();
  const [items, setItems] = useState([]);

  useEffect(() => {
    DAO.shopping.getUnpurchased().then(data => setItems(data.slice(0, 5)));
  }, [dataVersion]);

  return h('div', {
    style: tileStyle,
    onClick: () => navigate('/shopping'),
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: tileHeaderStyle },
      h('span', { style: tileTitleStyle }, '🛒', ' 购物清单'),
      h('span', { style: tileCountStyle }, items.length ? `${items.length}项` : '')
    ),
    items.length === 0
      ? h('div', { style: tileEmptyStyle }, '购物清单是空的')
      : h('div', { style: tileListStyle },
          items.slice(0, 4).map(item =>
            h('div', {
              key: item.id,
              style: { fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.6', color: 'var(--color-text-secondary)' }
            }, item.name)
          )
        )
  );
}

// ===== 今日记账卡片 =====
function FinanceCard() {
  const { dataVersion, navigate } = useApp();
  const [txs, setTxs] = useState([]);

  useEffect(() => {
    const today = DateUtils.today();
    DAO.transactions.getByDate(today).then(data => setTxs(data.slice(0, 3)));
  }, [dataVersion]);

  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  return h('div', {
    style: tileStyle,
    onClick: () => navigate('/finance'),
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: tileHeaderStyle },
      h('span', { style: tileTitleStyle }, '💰', ' 今日记账'),
      h('span', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' }, className: 'numeric' },
        totalExpense > 0 ? `-${FormatUtils.money(totalExpense)}` : ''
      )
    ),
    txs.length === 0
      ? h('div', { style: tileEmptyStyle }, '今日还没有记账')
      : h('div', { style: tileListStyle },
          txs.map(tx => {
            const cat = tx.type === 'income'
              ? (tx.scope === 'puff' ? CATEGORIES.getPuffIncomeCategory(tx.category) : CATEGORIES.getIncomeCategory(tx.category))
              : (tx.scope === 'puff' ? CATEGORIES.getPuffExpenseCategory(tx.category) : CATEGORIES.getExpenseCategory(tx.category));
            return h('div', {
              key: tx.id,
              style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }
            },
              h('span', null, cat.icon),
              h('span', { style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, cat.label),
              h('span', {
                style: { fontSize: '14px', fontWeight: 500, color: tx.type === 'income' ? 'var(--color-complete)' : 'var(--color-text-secondary)' },
                className: 'numeric'
              }, FormatUtils.moneyWithType(tx.amount, tx.type))
            );
          })
        )
  );
}

// ===== Alex 今天卡片 =====
function AlexCard() {
  const { dataVersion, navigate } = useApp();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    DAO.alex.getToday().then(setRecords);
  }, [dataVersion]);

  return h('div', {
    style: tileStyle,
    onClick: () => navigate('/alex'),
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: tileHeaderStyle },
      h('span', { style: tileTitleStyle }, '👦', ' Alex 今天'),
      h('span', { style: tileCountStyle }, records.length ? `${records.length}项` : '')
    ),
    records.length === 0
      ? h('div', { style: tileEmptyStyle }, '今天没有安排')
      : h('div', { style: tileListStyle },
          records.slice(0, 4).map(r =>
            h('div', {
              key: r.id,
              style: { fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.6', color: 'var(--color-text-secondary)' }
            },
              `${APP_CONFIG.alexCategories.find(c => c.key === r.category)?.icon || '📋'} ${r.title}`
            )
          )
        )
  );
}

// ===== 宠物提醒卡片 =====
function PetCard() {
  const { dataVersion, navigate } = useApp();
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    DAO.pets.getUpcomingReminders(7).then(setReminders);
  }, [dataVersion]);

  return h('div', {
    style: tileStyle,
    onClick: () => navigate('/pets'),
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: tileHeaderStyle },
      h('span', { style: tileTitleStyle }, '🐾', ' 宠物提醒'),
      h('span', { style: tileCountStyle }, reminders.length ? `${reminders.length}项` : '')
    ),
    reminders.length === 0
      ? h('div', { style: tileEmptyStyle }, '暂无提醒')
      : h('div', { style: tileListStyle },
          reminders.slice(0, 4).map(r =>
            h('div', {
              key: r.id,
              style: { fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.6', color: 'var(--color-text-secondary)' }
            },
              `${APP_CONFIG.pets.find(p => p.key === r.petName)?.icon || '🐾'} ${r.title}`
            )
          )
        )
  );
}

// ===== 泡芙订单统计卡片 =====
function OrderCard() {
  const { dataVersion, navigate } = useApp();
  const [stats, setStats] = useState([]);

  useEffect(() => {
    loadStats();
  }, [dataVersion]);

  const loadStats = async () => {
    const today = DateUtils.today();
    const all = await DAO.orders.getAll();
    // 当天取货的非取消订单
    const todayOrders = all.filter(o => o.pickupDate === today && o.status !== 'cancelled');
    // 按产品聚合
    const productMap = {};
    for (const order of todayOrders) {
      if (!order.items) continue;
      for (const item of order.items) {
        const name = item.productName || '未知';
        if (!productMap[name]) productMap[name] = 0;
        productMap[name] += item.quantity || 0;
      }
    }
    const result = Object.entries(productMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
    setStats(result);
  };

  const totalCount = stats.reduce((sum, s) => sum + s.qty, 0);

  return h('div', {
    style: tileStyle,
    onClick: () => navigate('/puff/orders'),
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: tileHeaderStyle },
      h('span', { style: tileTitleStyle }, '🧁', ' 今日订单'),
      h('span', { style: tileCountStyle }, totalCount > 0 ? `${totalCount}件` : '')
    ),
    stats.length === 0
      ? h('div', { style: tileEmptyStyle }, '今天没有订单')
      : h('div', { style: tileListStyle },
          stats.slice(0, 4).map((s, i) => h('div', {
            key: i,
            style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }
          },
            h('span', { style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, s.name),
            h('span', { style: { fontWeight: 600, color: 'var(--color-accent)' }, className: 'numeric' }, '×' + s.qty)
          ))
        )
  );
}

// ===== 日历卡片 =====
function CalendarCard() {
  const today = DateUtils.today();
  const todayDate = new Date(today + 'T00:00:00');
  const year = todayDate.getFullYear();
  const month = todayDate.getMonth();
  const todayDay = todayDate.getDate();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const cells = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push(h('div', { key: 'blank_' + i, style: { width: '100%', height: '20px' } }));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === todayDay;
    cells.push(h('div', {
      key: 'day_' + d,
      style: {
        width: '100%', height: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px',
        fontWeight: isToday ? 700 : 400,
        color: isToday ? '#FFFFFF' : 'var(--color-text-secondary)',
        backgroundColor: isToday ? 'var(--color-deadline)' : 'transparent',
        borderRadius: '50%',
      }
    }, String(d)));
  }

  return h('div', {
    style: tileStyle,
    onClick: () => {},
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: tileHeaderStyle },
      h('span', { style: tileTitleStyle }, '📅', ' ' + (month + 1) + '月'),
      h('span', { style: tileCountStyle }, year + '年')
    ),
    h('div', {
      style: {
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px', marginBottom: '2px',
      }
    },
      weekdays.map(w =>
        h('div', {
          key: w,
          style: { textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--color-text-tertiary)', height: '16px', lineHeight: '16px' }
        }, w)
      )
    ),
    h('div', {
      style: {
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
      }
    }, cells)
  );
}

// 暴露所有卡片组件（新命名）
window.TodoCard = TodoCard;
window.SomedayCard = SomedayCard;
window.ShoppingCard = ShoppingCard;
window.FinanceCard = FinanceCard;
window.AlexCard = AlexCard;
window.PetCard = PetCard;
window.OrderCard = OrderCard;
window.CalendarCard = CalendarCard;

// 保留旧命名兼容性（SearchPage 等可能引用）
window.TodoSection = TodoCard;
window.ReminderSection = PetCard;   // 提醒合并到宠物卡片
window.ShoppingSection = ShoppingCard;
window.FinanceSection = FinanceCard;
window.AlexSection = AlexCard;
window.PetSection = PetCard;
window.OrderSection = OrderCard;

})();
