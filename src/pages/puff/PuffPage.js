(function() {
/**
 * Personal Hub — 泡芙品牌主页
 */

const { createElement: h, useState, useEffect } = React;

function PuffPage() {
  const { dataVersion, navigate } = useApp();
  const [orderStats, setOrderStats] = useState({ pending: 0, completed: 0 });
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [todoCount, setTodoCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, [dataVersion]);

  const loadStats = async () => {
    const orders = await DAO.orders.getAll();
    setOrderStats({
      pending: orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length,
      completed: orders.filter(o => o.status === 'completed').length,
    });
    setProductCount(await DAO.products.count());
    setCustomerCount(await DAO.customers.count());
    const todos = await DAO.puffTodos.getActive();
    setTodoCount(todos.length);
  };

  const menuItems = [
    { key: 'orders',    icon: '📦', title: '订单管理',    desc: `${orderStats.pending} 待处理 · ${orderStats.completed} 已完成`, path: '/puff/orders' },
    { key: 'finance',   icon: '💰', title: '记账',        desc: '泡芙收支与利润', path: '/puff/finance' },
    { key: 'menus',     icon: '📅', title: '菜单',        desc: '月度精选 · 周度推荐', path: '/puff/menus' },
    { key: 'products',  icon: '🧁', title: '产品',        desc: `${productCount} 个产品`, path: '/puff/products' },
    { key: 'customers', icon: '👥', title: '顾客',        desc: `${customerCount} 位顾客`, path: '/puff/customers' },
    { key: 'recipes',   icon: '📝', title: '配方',        desc: '配方记录', path: '/puff/recipes' },
    { key: 'pickupPoints', icon: '📍', title: '取货点',   desc: '取货地址管理', path: '/puff/pickup-points' },
    { key: 'inventory', icon: '📦', title: '库存',        desc: '原料与包装', path: '/puff/inventory' },
    { key: 'social',    icon: '📱', title: '社交媒体',    desc: '发布计划', path: '/puff/social' },
  ];

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, { title: 'anan puff lab', showBack: false }),

    h('div', { className: 'scroll-container page' },
      h('div', { style: { padding: 'var(--space-md) 0' } },

        // 菜单卡片
        menuItems.map(item =>
          h(Card, {
            key: item.key,
            onClick: () => { Haptics.light(); navigate(item.path); },
            style: { marginBottom: 'var(--space-sm)' }
          },
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
              }
            },
              h('div', {
                style: {
                  width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', flexShrink: 0,
                }
              }, item.icon),
              h('div', { style: { flex: 1 } },
                h('div', { style: { fontSize: '17px', fontWeight: 500, color: 'var(--color-text-primary)' } }, item.title),
                h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, item.desc)
              ),
              h(Icon, { name: 'chevronRight', size: 20, color: 'var(--color-text-tertiary)' })
            )
          )
        ),
      )
    )
  );
}

window.PuffPage = PuffPage;

})();
