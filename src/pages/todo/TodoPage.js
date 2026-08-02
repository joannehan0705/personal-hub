(function() {
/**
 * Personal Hub — 待办页面
 */

const { createElement: h, useState, useEffect, useCallback } = React;

function TodoPage() {
  const { dataVersion, refreshData, route, navigate } = useApp();
  const [todos, setTodos] = useState([]);
  const [activeGroup, setActiveGroup] = useState('today');
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [swipeId, setSwipeId] = useState(null);

  // 检查 URL 参数，判断是否需要打开新增表单或切换分组
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('new=1')) {
      setShowForm(true);
      setEditingTodo(null);
    }
    const groupMatch = hash.match(/group=([^&]+)/);
    if (groupMatch) {
      setActiveGroup(decodeURIComponent(groupMatch[1]));
    }
  }, [route]);

  // 加载数据
  useEffect(() => {
    loadTodos();
  }, [activeGroup, dataVersion]);

  const loadTodos = async () => {
    const data = await DAO.todos.getByStatus(activeGroup);
    setTodos(data);
  };

  const handleComplete = async (todo) => {
    if (todo.completed) {
      await DAO.todos.uncomplete(todo.id);
    } else {
      await DAO.todos.complete(todo.id);
    }
    refreshData();
  };

  const handleDelete = async (id) => {
    await DAO.todos.delete(id);
    Haptics.warning();
    refreshData();
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTodo(null);
    // 清除 URL 中的 new 参数
    if (window.location.hash.includes('new=1')) {
      navigate('/todo');
    }
  };

  const handleSaveForm = () => {
    handleCloseForm();
    refreshData();
  };

  // 左滑/右滑处理
  const handleTouchStart = (e, id) => {
    setSwipeId(null);
  };

  const groupLabel = APP_CONFIG.todoGroups.find(g => g.key === activeGroup)?.label || '';

  const renderItem = (todo) => {
    const priority = APP_CONFIG.priorities[todo.priority] || APP_CONFIG.priorities.none;
    const isOverdue = !todo.completed && todo.date && DateUtils.isPast(todo.date);

    return h('div', {
      key: todo.id,
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-md)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        boxShadow: 'var(--shadow-1)',
        opacity: todo.completed ? 0.5 : 1,
        position: 'relative',
        overflow: 'hidden',
      }
    },
      // 复选框
      h(Checkbox, {
        checked: todo.completed,
        onChange: () => handleComplete(todo),
      }),

      // 内容
      h('div', {
        style: { flex: 1, minWidth: 0 },
        onClick: () => !todo.completed && handleEdit(todo),
      },
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginBottom: '2px',
          }
        },
          priority.dot && h('div', {
            style: { width: 7, height: 7, borderRadius: '50%', backgroundColor: priority.dot, flexShrink: 0 }
          }),
          h('span', {
            style: {
              fontSize: '17px',
              fontWeight: 400,
              color: 'var(--color-text-primary)',
              textDecoration: todo.completed ? 'line-through' : 'none',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }
          }, todo.title),
          todo.recurring && todo.recurring !== 'none' && h('span', {
            style: {
              fontSize: '11px', color: 'var(--color-accent)', backgroundColor: 'var(--color-bg-subtle)',
              padding: '1px 6px', borderRadius: 'var(--radius-pill)', flexShrink: 0,
            }
          }, '🔁', { daily: '日', weekly: '周', biweekly: '双周', monthly: '月', yearly: '年' }[todo.recurring] || ''),
        ),
        // 副信息
        (todo.date || todo.notes) && h('div', {
          style: {
            fontSize: '13px',
            color: isOverdue ? 'var(--color-deadline)' : 'var(--color-text-tertiary)',
            paddingLeft: priority.dot ? '15px' : '0',
            marginTop: '2px',
          }
        },
          todo.date && h('span', null, DateUtils.friendlyDate(todo.date), todo.time ? ` ${FormatUtils.time(todo.time)}` : ''),
          todo.date && todo.notes ? ' · ' : '',
          todo.notes && h('span', {
            style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
          }, todo.notes)
        )
      ),

      // 右侧操作（删除）
      h('button', {
        onClick: (e) => { e.stopPropagation(); handleDelete(todo.id); },
        style: {
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-subtle)',
          flexShrink: 0,
        }
      }, h(Icon, { name: 'trash', size: 16, color: 'var(--color-text-tertiary)' }))
    );
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '待办', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); setEditingTodo(null); setShowForm(true); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    // 分组 Tab（占用屏幕最多 1/3）
    h('div', {
      style: {
        display: 'flex',
        gap: 'var(--space-xs)',
        padding: '0 var(--space-lg) var(--space-sm)',
        flexWrap: 'wrap',
        maxHeight: '33vh',
        overflowY: 'auto',
        alignContent: 'flex-start',
      }
    },
      APP_CONFIG.todoGroups.map(group =>
        h('button', {
          key: group.key,
          onClick: () => { Haptics.selection(); setActiveGroup(group.key); },
          style: {
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: activeGroup === group.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: activeGroup === group.key ? '#FFFFFF' : 'var(--color-text-secondary)',
            transition: 'background-color 0.2s, color 0.2s',
          }
        }, group.label)
      )
    ),

    // 列表
    h('div', { className: 'scroll-container page' },
      todos.length === 0
        ? h(EmptyState, {
            icon: '📋',
            title: activeGroup === 'completed' ? '还没有完成的任务' : '这里空空如也',
            subtitle: activeGroup === 'today' ? '今天没有待办，享受片刻安静 ☕' : '点击右上角 + 添加',
          })
        : h('div', null, todos.map(renderItem))
    ),

    // 表单
    h(TodoForm, {
      open: showForm,
      onClose: handleSaveForm,
      todo: editingTodo,
    })
  );
}

window.TodoPage = TodoPage;

})();
