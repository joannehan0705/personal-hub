(function() {
const { createElement: h, useState, useEffect } = React;
const S = window.TILE_STYLES;

function InboxCard() {
  const { dataVersion, navigate } = useApp();
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    DAO.todos.getByStatus('someday').then(setTodos);
  }, [dataVersion]);

  return h('div', {
    style: S.TILE_STYLE,
    onClick: () => { Haptics.light(); navigate('/todo#group=someday'); },
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: S.TILE_HEADER_STYLE },
      h('span', { style: S.TILE_TITLE_STYLE }, '📥 Inbox'),
      h('span', { style: S.TILE_COUNT_STYLE },
        todos.length ? `${todos.length}项` : ''
      )
    ),
    todos.length === 0
      ? h('div', { style: S.TILE_EMPTY_STYLE }, '收件箱是空的')
      : h('div', { style: S.TILE_LIST_STYLE },
          todos.slice(0, 3).map(todo =>
            h('div', {
              key: todo.id,
              style: {
                ...S.TILE_ITEM_STYLE,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
              }
            },
              h('span', {
                style: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-text-tertiary)', flexShrink: 0 }
              }),
              h('span', {
                style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
              }, todo.title)
            )
          )
        ),
    todos.length > 0 && h('div', { style: S.TILE_FOOTER_STYLE }, '查看全部 >')
  );
}

window.InboxCard = InboxCard;
})();
