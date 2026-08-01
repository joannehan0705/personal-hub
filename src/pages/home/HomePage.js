(function() {
/**
 * Personal Hub — V3 首页 Dashboard
 * 每天打开的工作台，只显示今天需要关注的内容
 */

const { createElement: h, useState, useEffect } = React;

function HomePage() {
  const { dataVersion, dispatch, ACTIONS } = useApp();
  const [hasTodayOrders, setHasTodayOrders] = useState(false);

  useEffect(() => {
    checkTodayOrders();
  }, [dataVersion]);

  const checkTodayOrders = async () => {
    const today = DateUtils.today();
    const all = await DAO.orders.getAll();
    const todayOrders = all.filter(
      o => o.pickupDate === today && o.status !== 'cancelled'
    );
    setHasTodayOrders(todayOrders.length > 0);
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-md)',
    padding: '0 var(--space-lg)',
  };

  const fullWidthStyle = {
    padding: '0 var(--space-lg)',
    marginBottom: 'var(--space-md)',
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: DateUtils.fullDate(),
      showBack: false,
      rightAction: h('button', {
        onClick: () => { Haptics.medium(); dispatch({ type: ACTIONS.OPEN_QUICK_ADD }); },
        style: {
          width: '32px', height: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }
      }, h(Icon, { name: 'plus', size: 22, color: 'var(--color-accent)', strokeWidth: 2.5 }))
    }),

    h('div', { className: 'scroll-container page' },
      // 顶部 Summary
      h('div', { style: fullWidthStyle },
        h(OverviewCard)
      ),

      // 2列卡片网格
      h('div', { style: gridStyle },
        // 第一行: Today + Inbox
        h(TodayCard),
        h(InboxCard),

        // 第二行: Upcoming + Alex
        h(UpcomingCard),
        h(AlexCard),

        // 第三行: Pet + Shopping
        h(PetCard),
        h(ShoppingCard),
      ),

      // 第四行: Today's Production (全宽，仅有订单时显示)
      hasTodayOrders && h('div', {
        style: {
          padding: '0 var(--space-lg)',
          marginTop: 'var(--space-md)',
        }
      }, h(ProductionCard)),

      // 底部留白
      h('div', { style: { height: 'var(--space-2xl)' } })
    )
  );
}

window.HomePage = HomePage;

})();
