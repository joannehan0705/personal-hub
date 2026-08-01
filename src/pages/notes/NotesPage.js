(function() {
/**
 * Personal Hub — 灵感笔记页面
 * 支持：新建/编辑/删除/搜索/收藏/分类/Pin置顶/归档
 */

const { createElement: h, useState, useEffect } = React;

function NotesPage() {
  const { dataVersion, refreshData, route, navigate, showToast } = useApp();
  const [notes, setNotes] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (window.location.hash.includes('new=1')) {
      setShowForm(true);
      setEditingNote(null);
    }
  }, [route]);

  useEffect(() => { loadNotes(); }, [dataVersion, activeCategory, viewMode, searchQuery]);

  const loadNotes = async () => {
    let data;
    if (viewMode === 'archived') {
      data = await DAO.notes.getArchived();
    } else {
      data = await DAO.notes.getActive();
    }
    if (activeCategory !== 'all') {
      data = data.filter(n => n.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q)
      );
    }
    setNotes(data);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await DAO.notes.delete(id);
    Haptics.warning();
    refreshData();
  };

  const handleTogglePin = async (id) => {
    await DAO.notes.togglePin(id);
    Haptics.light();
    refreshData();
  };

  const handleArchive = async (id) => {
    await DAO.notes.archive(id);
    Haptics.light();
    showToast('已归档', 'success');
    refreshData();
  };

  const handleUnarchive = async (id) => {
    await DAO.notes.unarchive(id);
    Haptics.light();
    showToast('已恢复', 'success');
    refreshData();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingNote(null);
    refreshData();
    if (window.location.hash.includes('new=1')) navigate('/notes');
  };

  const catOptions = [
    { key: 'all', label: '全部', icon: '📋' },
    ...CATEGORIES.notes,
  ];

  const renderNote = (note) => {
    const cat = CATEGORIES.getNoteCategory(note.category);
    return h('div', {
      key: note.id,
      onClick: () => handleEdit(note),
      style: {
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-xs)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
        cursor: 'pointer',
      }
    },
      h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' } },
        h('div', { style: { fontSize: '24px', width: '32px', textAlign: 'center', flexShrink: 0 } }, cat.icon),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
            note.pinned && h('span', { style: { fontSize: '11px', color: 'var(--color-accent)', backgroundColor: 'var(--color-bg-subtle)', padding: '1px 6px', borderRadius: 'var(--radius-pill)' } }, '📌置顶'),
            h('span', { style: { fontSize: '17px', color: 'var(--color-text-primary)', fontWeight: note.pinned ? 600 : 400 } }, note.title)
          ),
          note.content && h('div', {
            style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
          }, note.content),
          h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' } }, DateUtils.friendlyDate(note.createdAt ? note.createdAt.slice(0, 10) : ''))
        ),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 } },
          h('button', {
            onClick: (e) => { e.stopPropagation(); handleTogglePin(note.id); },
            style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: note.pinned ? 'var(--color-accent)' : 'var(--color-bg-subtle)' }
          }, h(Icon, { name: 'star', size: 14, color: note.pinned ? '#FFFFFF' : 'var(--color-text-tertiary)' })),
          viewMode === 'active'
            ? h('button', {
                onClick: (e) => { e.stopPropagation(); handleArchive(note.id); },
                style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-subtle)' }
              }, h(Icon, { name: 'close', size: 14, color: 'var(--color-text-tertiary)' }))
            : h('button', {
                onClick: (e) => { e.stopPropagation(); handleUnarchive(note.id); },
                style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-subtle)' }
              }, h(Icon, { name: 'refresh', size: 14, color: 'var(--color-complete)' })),
          h('button', {
            onClick: (e) => { e.stopPropagation(); handleDelete(note.id); },
            style: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-subtle)' }
          }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
        )
      )
    );
  };

  const searchInputStyle = {
    width: '100%',
    padding: '10px var(--space-md)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '15px',
    backgroundColor: 'var(--color-bg-subtle)',
    border: 'none',
    outline: 'none',
    color: 'var(--color-text-primary)',
    boxSizing: 'border-box',
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '灵感', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); setEditingNote(null); setShowForm(true); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    h('div', {
      style: { display: 'flex', gap: 'var(--space-xs)', padding: '0 var(--space-lg) var(--space-sm)' }
    },
      h('button', {
        onClick: () => { Haptics.selection(); setViewMode('active'); },
        style: {
          flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
          fontSize: '14px', fontWeight: 500,
          backgroundColor: viewMode === 'active' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
          color: viewMode === 'active' ? '#FFFFFF' : 'var(--color-text-secondary)',
        }
      }, '活跃'),
      h('button', {
        onClick: () => { Haptics.selection(); setViewMode('archived'); },
        style: {
          flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
          fontSize: '14px', fontWeight: 500,
          backgroundColor: viewMode === 'archived' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
          color: viewMode === 'archived' ? '#FFFFFF' : 'var(--color-text-secondary)',
        }
      }, '已归档')
    ),

    h('div', {
      style: { display: 'flex', gap: 'var(--space-xs)', padding: '0 var(--space-lg) var(--space-sm)', overflowX: 'auto' }
    },
      catOptions.map(c =>
        h('button', {
          key: c.key,
          onClick: () => { Haptics.selection(); setActiveCategory(c.key); },
          style: {
            padding: '6px 12px', borderRadius: 'var(--radius-pill)',
            fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
            backgroundColor: activeCategory === c.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: activeCategory === c.key ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, c.icon + ' ' + c.label)
      )
    ),

    h('div', { style: { padding: '0 var(--space-lg) var(--space-sm)' } },
      h('input', {
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        placeholder: '搜索灵感...',
        style: searchInputStyle
      })
    ),

    h('div', { className: 'scroll-container page' },
      notes.length === 0
        ? h(EmptyState, { icon: '✏️', title: viewMode === 'archived' ? '没有已归档的灵感' : '还没有灵感记录', subtitle: '点击右上角 + 开始记录' })
        : h('div', null, notes.map(renderNote))
    ),

    h(NoteForm, { open: showForm, onClose: handleCloseForm, note: editingNote })
  );
}

window.NotesPage = NotesPage;

})();
