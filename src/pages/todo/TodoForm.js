(function() {
/**
 * Personal Hub — 待办新增/编辑表单
 * 支持「时间待定」状态
 */

const { createElement: h, useState, useEffect } = React;

function TodoForm({ open, onClose, todo }) {
  const { showToast } = useApp();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('none');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [someday, setSomeday] = useState(false);

  // Recurring
  const [recurring, setRecurring] = useState('none');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [weekday, setWeekday] = useState(null);

  useEffect(() => {
    if (open) {
      if (todo) {
        setTitle(todo.title || '');
        setNotes(todo.notes || '');
        setPriority(todo.priority || 'none');
        setDate(todo.date || '');
        setTime(todo.time || '');
        setSomeday(todo.status === 'someday');
        setRecurring(todo.recurring || 'none');
        setRecurringEndDate(todo.recurringEndDate || '');
        setWeekday(todo.weekday != null ? todo.weekday : null);
      } else {
        setTitle('');
        setNotes('');
        setPriority('none');
        setDate(DateUtils.today());
        setTime('');
        setSomeday(false);
        setRecurring('none');
        setRecurringEndDate('');
        setWeekday(null);
      }
    }
  }, [open, todo]);

  const handleSomedayToggle = () => {
    Haptics.selection();
    const newVal = !someday;
    setSomeday(newVal);
    if (newVal) {
      setDate('');
      setTime('');
    } else {
      setDate(DateUtils.today());
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('请输入标题', 'warning');
      return;
    }

    let finalStatus;
    if (someday) {
      finalStatus = 'someday';
    } else if (date === DateUtils.today()) finalStatus = 'today';
    else if (date && DateUtils.isThisWeek(date)) finalStatus = 'week';
    else if (date && DateUtils.isFuture(date)) finalStatus = 'later';
    else finalStatus = 'later';

    const data = {
      title: title.trim(),
      notes: notes.trim(),
      priority,
      date: someday ? null : (date || null),
      time: someday ? null : (time || null),
      status: finalStatus,
      completed: false,
      recurring,
      weekday: (recurring === 'weekly' || recurring === 'biweekly') ? weekday : null,
      recurringEndDate: recurringEndDate || null,
    };

    // recurring 待办：确保有日期作为起始
    if (recurring !== 'none' && !someday && !date) {
      data.date = DateUtils.today();
    }

    if (todo) {
      await DAO.todos.update(todo.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.todos.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    onClose();
  };

  const priorityOptions = Object.entries(APP_CONFIG.priorities).map(([key, val]) => ({
    key,
    label: val.label,
  }));

  return h(Sheet, { open, onClose, title: todo ? '编辑待办' : '新增待办' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      h(Input, {
        label: '标题',
        value: title,
        onChange: setTitle,
        placeholder: '输入待办标题...',
        required: true,
      }),

      h(Input, {
        label: '备注',
        value: notes,
        onChange: setNotes,
        placeholder: '添加备注（可选）',
        multiline: true,
        rows: 2,
      }),

      // 优先级选择
      h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '优先级'),
        h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
          priorityOptions.map(opt =>
            h('button', {
              key: opt.key,
              onClick: () => { Haptics.selection(); setPriority(opt.key); },
              style: {
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '15px',
                fontWeight: 500,
                backgroundColor: priority === opt.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: priority === opt.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                transition: 'background-color 0.2s, color 0.2s',
              }
            }, opt.label)
          )
        )
      ),

      // 时间待定切换
      h('div', {
        style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '0 var(--space-xs)' }
      },
        h(Checkbox, { checked: someday, onChange: handleSomedayToggle }),
        h('span', { style: { fontSize: '15px', color: someday ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontWeight: someday ? 600 : 400 } }, '时间待定'),
        someday && h('span', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } }, '没有截止日期，随时可以做')
      ),

      // 重复设置（非时间待定时可用）
      !someday && h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '重复'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
          APP_CONFIG.recurringFrequencies.map(freq =>
            h('button', {
              key: freq.key,
              onClick: () => { Haptics.selection(); setRecurring(freq.key); },
              style: {
                padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                fontSize: '14px', fontWeight: 500,
                backgroundColor: recurring === freq.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: recurring === freq.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, freq.label)
          )
        ),
      ),

      // 星期选择（weekly/biweekly 时显示）
      !someday && (recurring === 'weekly' || recurring === 'biweekly') && h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, recurring === 'weekly' ? '每周' : '每两周', '哪一天'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
          APP_CONFIG.weekdays.map(w =>
            h('button', {
              key: w.key,
              onClick: () => { Haptics.selection(); setWeekday(w.key); },
              style: {
                padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                fontSize: '14px', fontWeight: 500,
                backgroundColor: weekday === w.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: weekday === w.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, w.label)
          )
        ),
      ),

      // 日期和时间（时间待定时不显示；weekly/biweekly 时不显示日期，用星期选择器替代）
      !someday && recurring !== 'weekly' && recurring !== 'biweekly' && h(Input, {
        label: '日期',
        value: date,
        onChange: setDate,
        type: 'date',
      }),

      !someday && h(Input, {
        label: '时间（可选）',
        value: time,
        onChange: setTime,
        type: 'time',
      }),

      // 结束日期（recurring 模式下显示）
      !someday && recurring !== 'none' && h(Input, {
        label: '结束日期（可选）',
        value: recurringEndDate,
        onChange: setRecurringEndDate,
        type: 'date',
        placeholder: '不选则持续到手动取消',
      }),

      h(Button, { fullWidth: true, onClick: handleSave }, todo ? '保存' : '添加'),
    )
  );
}

window.TodoForm = TodoForm;

})();
