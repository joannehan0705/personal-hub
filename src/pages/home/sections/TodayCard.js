(function() {
const { createElement: h, useState, useEffect } = React;
const S = window.TILE_STYLES;

function TodayCard() {
  const { dataVersion, navigate } = useApp();
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    DAO.todos.getToday().then(setTodos);
  }, [dataVersion]);

  return h('div', {
    style: S.TILE_STYLE,
    onClick: () => { Haptics.light(); navigate('/todo#group=today'); },
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: S.TILE_HEADER_STYLE },
      h('span', { style: S.TILE_TITLE_STYLE }, '✅ 今日待办'),
      h('span', { style: S.TILE_COUNT_STYLE },
        todos.length ? `${todos.length}项` : ''
      )
    ),
    todos.length === 0
      ? h('div', { style: S.TILE_EMPTY_STYLE }, '今天没有待办')
      : h('div', { style: S.TILE_LIST_STYLE },
          todos.slice(0, 3).map(todo =>
            h('div', {
              key: todo.id,
              style: {
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                lineHeight: '1.8',
                overflow: 'hidden',
              }
            },
              h('span', {
                style: {
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: todo.completed ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                }
              }, todo.title),
              todo.time && h('span', {
                style: { fontSize: '12px', color: 'var(--color-text-tertiary)', flexShrink: 0 },
                className: 'numeric'
              }, FormatUtils.time(todo.time))
            )
          )
        ),
    todos.length > 0 && h('div', { style: S.TILE_FOOTER_STYLE }, '查看全部 >')
  );
}

window.TodayCard = TodayCard;
})();
