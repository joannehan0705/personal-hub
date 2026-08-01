(function() {
/**
 * Personal Hub — Alex 页面
 */

const { createElement: h, useState, useEffect } = React;

function AlexPage() {
  const { dataVersion, refreshData, alexCategory, dispatch, ACTIONS, route } = useApp();
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    if (window.location.hash.includes('new=1')) {
      setShowForm(true);
      setEditingRecord(null);
    }
  }, [route]);

  useEffect(() => {
    loadRecords();
  }, [alexCategory, dataVersion]);

  const loadRecords = async () => {
    const data = await DAO.alex.getByCategory(alexCategory);
    setRecords(data);
  };

  const handleDelete = async (id) => {
    await DAO.alex.delete(id);
    Haptics.warning();
    refreshData();
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    if (window.location.hash.includes('new=1')) {
      window.location.hash = '/alex';
    }
    refreshData();
  };

  const currentCat = APP_CONFIG.alexCategories.find(c => c.key === alexCategory) || APP_CONFIG.alexCategories[0];

  const renderRecord = (record) => h('div', {
    key: record.id,
    onClick: () => handleEdit(record),
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-md)',
      padding: 'var(--space-md) var(--space-lg)',
      marginBottom: 'var(--space-sm)',
      backgroundColor: 'var(--color-bg-card)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-1)',
    }
  },
    h('div', { style: { fontSize: '24px', flexShrink: 0, width: '32px', textAlign: 'center' } }, currentCat.icon),
    h('div', { style: { flex: 1, minWidth: 0 } },
      h('div', {
        style: { fontSize: '17px', color: 'var(--color-text-primary)', marginBottom: '2px' }
      }, record.title),
      h('div', {
        style: { fontSize: '13px', color: 'var(--color-text-tertiary)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }
      },
        // 日期显示逻辑：weekly/biweekly 显示星期几，其他显示日期
        (record.recurring === 'weekly' || record.recurring === 'biweekly')
          ? record.weekday != null && h('span', null,
              record.recurring === 'biweekly' ? '每两周 ' : '每周 ',
              APP_CONFIG.weekdays.find(w => w.key === record.weekday)?.label || ''
            )
          : record.date && h('span', null, DateUtils.friendlyDate(record.date)),
        record.time && h('span', null, FormatUtils.time(record.time)),
        // Hockey 特有
        record.opponent && h('span', null, `vs ${record.opponent}`),
        record.score && h('span', null, `比分 ${record.score}`),
        // 课外班特有
        record.className && h('span', null, record.className),
        record.teacher && h('span', null, `老师: ${record.teacher}`),
        record.location && h('span', null, `📍 ${record.location}`),
        // Activity 特有
        record.activityType && h('span', null, record.activityType),
        record.activityLocation && h('span', null, `📍 ${record.activityLocation}`),
        // Reading 特有
        record.bookTitle && h('span', null, record.bookTitle),
        // Medical 特有
        record.diagnosis && h('span', null, record.diagnosis),
      ),
      // Recurring 标记
      record.recurring && record.recurring !== 'none' && h('div', {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-xs)',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: 'var(--color-accent-light)',
          color: 'var(--color-accent)',
        }
      },
        '🔁 ',
        APP_CONFIG.recurringFrequencies.find(f => f.key === record.recurring)?.label || record.recurring
      ),
      record.notes && h('div', {
        style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
      }, record.notes)
    ),
    h('button', {
      onClick: (e) => { e.stopPropagation(); handleDelete(record.id); },
      style: {
        width: '28px', height: '28px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0,
      }
    }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
  );

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },

    // 子模块 Tab（横向滑动）
    h('div', {
      style: {
        display: 'flex',
        gap: 'var(--space-xs)',
        padding: '0 var(--space-lg) var(--space-sm)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }
    },
      APP_CONFIG.alexCategories.map(cat =>
        h('button', {
          key: cat.key,
          onClick: () => { Haptics.selection(); dispatch({ type: ACTIONS.SET_ALEX_CATEGORY, payload: cat.key }); },
          style: {
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '14px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            backgroundColor: alexCategory === cat.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: alexCategory === cat.key ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, `${cat.icon} ${cat.label}`)
      )
    ),

    // 零用钱模块：独立渲染
    alexCategory === 'allowance'
      ? h(AllowancePage)
      : h(React.Fragment, null,
          h(NavBar, {
            title: 'Alex', showBack: false,
            rightAction: h('button', {
              onClick: () => { Haptics.light(); setEditingRecord(null); setShowForm(true); },
              style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
            }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
          }),

          h('div', { className: 'scroll-container page' },
            records.length === 0
              ? h(EmptyState, { icon: currentCat.icon, title: `${currentCat.label} 还没有记录`, subtitle: '点击右上角 + 添加' })
              : h('div', null, records.map(renderRecord))
          ),

          h(AlexForm, {
            open: showForm,
            onClose: handleCloseForm,
            record: editingRecord,
            category: alexCategory,
          })
        )
  );
}

window.AlexPage = AlexPage;

})();
