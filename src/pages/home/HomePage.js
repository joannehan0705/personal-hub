(function() {
/**
 * Personal Hub — V2 首页（卡片网格布局）
 * 2列圆角卡片tile，韩式简约风格
 */

const { createElement: h } = React;

function HomePage() {
  const { dataVersion } = useApp();

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-md)',
    padding: '0 var(--space-lg)',
  };

  // 单列的全宽概览卡片
  const fullWidthStyle = {
    padding: '0 var(--space-lg)',
    marginBottom: 'var(--space-md)',
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: DateUtils.fullDate(),
      showBack: false,
    }),

    h('div', { className: 'scroll-container page' },
      // 概览 — 全宽
      h('div', { style: fullWidthStyle },
        h(OverviewCard)
      ),

      // 2列卡片网格
      h('div', { style: gridStyle },
        // 第一行: 待办 + 时间待定
        h(TodoCard),
        h(SomedayCard),

        // 第二行: 购物 + 记账
        h(ShoppingCard),
        h(FinanceCard),

        // 第三行: Alex + 宠物
        h(AlexCard),
        h(PetCard),

        // 第四行: 泡芙订单 + 日历
        h(OrderCard),
        h(CalendarCard),
      ),

      // 底部留白
      h('div', { style: { height: 'var(--space-2xl)' } })
    )
  );
}

window.HomePage = HomePage;

})();
