(function() {
const { createElement: h, useState, useEffect } = React;
const S = window.TILE_STYLES;

function UpcomingCard() {
  const { dataVersion, navigate } = useApp();
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadUpcoming();
  }, [dataVersion]);

  const loadUpcoming = async () => {
    const today = DateUtils.today();
    const endDate = DateUtils.addDays(today, 14);

    // 只显示待办里即将到来的 tasks
    const weekTodos = await DAO.todos.getByStatus('week');
    const laterTodos = await DAO.todos.getByStatus('later');
    const all = [...weekTodos, ...laterTodos]
      .filter(t => t.date && t.date > today && t.date <= endDate)
      .map(t => ({
        date: t.date,
        time: t.time,
        label: t.title,
        icon: '📋',
      }))
      .sort((a, b) => {
        const dc = a.date.localeCompare(b.date);
        if (dc !== 0) return dc;
        return (a.time || '').localeCompare(b.time || '');
      })
      .slice(0, 4);

    setItems(all);
  };

  return h('div', {
    style: S.TILE_STYLE,
    onClick: () => { Haptics.light(); navigate('/todo#group=week'); },
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: S.TILE_HEADER_STYLE },
      h('span', { style: S.TILE_TITLE_STYLE }, '📅 即将到来'),
      h('span', { style: S.TILE_COUNT_STYLE },
        items.length ? `${items.length}项` : ''
      )
    ),
    items.length === 0
      ? h('div', { style: S.TILE_EMPTY_STYLE }, '近期没有安排')
      : h('div', { style: S.TILE_LIST_STYLE },
          items.map((item, i) =>
            h('div', {
              key: i,
              style: {
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                lineHeight: '1.8',
                overflow: 'hidden',
              }
            },
              h('span', { style: { flexShrink: 0 } }, item.icon),
              h('span', {
                style: {
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--color-text-secondary)',
                }
              }, item.label),
              h('span', {
                style: {
                  fontSize: '12px',
                  color: 'var(--color-text-tertiary)',
                  flexShrink: 0,
                }
              },
                DateUtils.friendlyDate(item.date) +
                (item.time ? ' ' + FormatUtils.time(item.time) : '')
              )
            )
          )
        ),
    items.length > 0 && h('div', { style: S.TILE_FOOTER_STYLE }, '查看全部 >')
  );
}

window.UpcomingCard = UpcomingCard;
})();
