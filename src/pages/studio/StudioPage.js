(function() {
/**
 * Personal Hub — 🌱 Studio 列表页
 * Personal Inspiration Library
 */

const { createElement: h, useState, useEffect } = React;

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StudioPage() {
  const { dataVersion, refreshData, route, navigate, showToast } = useApp();
  const [notes, setNotes] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [closetFilter, setClosetFilter] = useState('all');
  const [activeTag, setActiveTag] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [detailNote, setDetailNote] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    if (window.location.hash.includes('new=1')) {
      setShowForm(true);
      setEditingNote(null);
    }
  }, [route]);

  useEffect(() => { loadNotes(); loadTags(); }, [dataVersion, activeCategory, closetFilter, activeTag, viewMode, searchQuery]);

  const loadNotes = async () => {
    let data;
    if (viewMode === 'archived') {
      data = await DAO.notes.getArchived();
    } else if (activeCategory === 'favorite') {
      data = await DAO.notes.getFavorites();
    } else {
      data = await DAO.notes.getActive();
    }

    // 分类筛选
    if (activeCategory !== 'all' && activeCategory !== 'favorite') {
      data = data.filter(n => n.category === activeCategory);
    }

    // Closet 子筛选
    if (activeCategory === 'closet' && closetFilter !== 'all') {
      if (closetFilter === 'favorite') {
        data = data.filter(n => n.favorite);
      } else if (closetFilter === 'minimal') {
        data = data.filter(n => Array.isArray(n.styleTags) && n.styleTags.includes('Minimal'));
      } else if (closetFilter === 'korean') {
        data = data.filter(n => Array.isArray(n.styleTags) && n.styleTags.includes('Korean'));
      } else {
        // season/occasion
        data = data.filter(n => n.occasion === closetFilter || n.season === closetFilter);
      }
    }

    // 标签筛选
    if (activeTag) {
      data = data.filter(n =>
        (Array.isArray(n.tags) && n.tags.includes(activeTag)) ||
        (Array.isArray(n.styleTags) && n.styleTags.includes(activeTag))
      );
    }

    // 搜索
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.remarks || '').toLowerCase().includes(q) ||
        (n.brand || '').toLowerCase().includes(q) ||
        (Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(q))) ||
        (Array.isArray(n.styleTags) && n.styleTags.some(t => t.toLowerCase().includes(q)))
      );
    }

    setNotes(data);
  };

  const loadTags = async () => {
    const tags = await DAO.notes.getAllTags();
    setAllTags(tags);
  };

  // 操作
  const handleCardClick = (note) => {
    Haptics.light();
    setOpenMenuId(null);
    setDetailNote(note);
  };

  const handleEditFromDetail = () => {
    setEditingNote(detailNote);
    setDetailNote(null);
    setShowForm(true);
  };

  const handleToggleFavorite = async (note) => {
    await DAO.notes.toggleFavorite(note.id || (detailNote && detailNote.id));
    Haptics.light();
    if (detailNote) {
      const updated = await DAO.notes.getById(detailNote.id);
      setDetailNote(updated);
    }
    refreshData();
  };

  const handleArchive = async (id) => {
    await DAO.notes.archive(id);
    Haptics.light();
    showToast('已归档', 'success');
    setDetailNote(null);
    refreshData();
  };

  const handleUnarchive = async (id) => {
    await DAO.notes.unarchive(id);
    Haptics.light();
    showToast('已恢复', 'success');
    setDetailNote(null);
    refreshData();
  };

  const handleDelete = async (id) => {
    await DAO.notes.delete(id);
    Haptics.warning();
    showToast('已删除', 'success');
    setDetailNote(null);
    refreshData();
  };

  const handleMoveCategory = async (note, newCategory) => {
    await DAO.notes.update(note.id, { category: newCategory });
    Haptics.light();
    showToast('已移动分类', 'success');
    setOpenMenuId(null);
    refreshData();
  };

  const handleShare = async (note) => {
    const n = note || detailNote;
    if (!n) return;
    const cat = CATEGORIES.getNoteCategory(n.category);
    let text = `${cat.icon} ${n.title}\n\n${n.content || ''}`;
    if (n.tags && n.tags.length > 0) {
      text += `\n\n${n.tags.map(t => '#' + t).join(' ')}`;
    }
    if (n.remarks) {
      text += `\n\n备注: ${n.remarks}`;
    }
    if (n.category === 'closet' && n.outfit) {
      const o = n.outfit;
      const parts = [];
      if (o.top) parts.push(`Top: ${o.top}`);
      if (o.bottom) parts.push(`Bottom: ${o.bottom}`);
      if (o.shoes) parts.push(`Shoes: ${o.shoes}`);
      if (o.bag) parts.push(`Bag: ${o.bag}`);
      if (o.accessory) parts.push(`Accessory: ${o.accessory}`);
      if (parts.length > 0) text += `\n\n${parts.join('\n')}`;
    }
    setOpenMenuId(null);
    if (navigator.share) {
      try {
        await navigator.share({ title: n.title, text });
        Haptics.light();
      } catch (e) { /* 用户取消 */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板', 'success');
      } catch (e) {
        showToast('分享功能不可用', 'warning');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingNote(null);
    refreshData();
    if (window.location.hash.includes('new=1')) navigate('/notes');
  };

  const handleCloseDetail = () => {
    setDetailNote(null);
    refreshData();
  };

  // 格式化日期
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  // 分类切换
  const handleCategoryChange = (key) => {
    Haptics.selection();
    setActiveCategory(key);
    setClosetFilter('all');
    setActiveTag(null);
  };

  // 渲染分类 chip
  const chipStyle = (active) => ({
    padding: '6px 12px', borderRadius: 'var(--radius-pill)',
    fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
    backgroundColor: active ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
    color: active ? '#FFFFFF' : 'var(--color-text-secondary)',
  });

  // 渲染卡片
  const renderNote = (note) => {
    const cat = CATEGORIES.getNoteCategory(note.category);
    const isCloset = note.category === 'closet';
    const isMenuOpen = openMenuId === note.id;

    // 内容预览（2行）
    const previewText = isCloset
      ? [note.outfit?.top, note.outfit?.bottom].filter(Boolean).join(' · ')
      : note.content || '';

    return h('div', {
      key: note.id,
      style: {
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
        padding: '16px 18px',
        marginBottom: '12px',
      }
    },
      h('div', {
        style: { display: 'flex', alignItems: 'flex-start', gap: '12px' }
      },
        // 左侧：Emoji
        h('div', {
          onClick: () => handleCardClick(note),
          style: { fontSize: '22px', width: '32px', textAlign: 'center', flexShrink: 0, lineHeight: 1.4 }
        }, cat.icon),

        // 中间：内容
        h('div', {
          onClick: () => handleCardClick(note),
          style: { flex: 1, minWidth: 0 }
        },
          // 标题
          h('div', {
            style: { fontSize: '16px', fontWeight: note.favorite ? 600 : 500, color: 'var(--color-text-primary)' }
          }, note.title),

          // 分类标签
          !isCloset && h('div', {
            style: { fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }
          }, cat.label),

          // Closet: StyleTags
          isCloset && (note.styleTags && note.styleTags.length > 0) && h('div', {
            style: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }
          },
            note.styleTags.slice(0, 3).map(tag =>
              h('span', {
                key: tag,
                style: {
                  padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--color-bg-subtle)', fontSize: '11px',
                  color: 'var(--color-text-secondary)', fontWeight: 500,
                }
              }, tag)
            )
          ),

          // 内容预览（2行截断）
          previewText && h('div', {
            style: {
              fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }
          }, previewText),

          // 日期
          h('div', {
            style: { fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }
          }, formatDate(note.createdAt ? note.createdAt.slice(0, 10) : ''))
        ),

        // 右侧：收藏 + 菜单
        h('div', {
          style: { display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, position: 'relative' }
        },
          // 收藏按钮
          h('button', {
            onClick: (e) => { e.stopPropagation(); handleToggleFavorite(note); },
            style: {
              width: '28px', height: '28px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: note.favorite ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
              fontSize: '14px',
            }
          }, note.favorite ? '⭐' : '☆'),

          // "..." 菜单按钮
          h('button', {
            onClick: (e) => {
              e.stopPropagation();
              Haptics.light();
              setOpenMenuId(isMenuOpen ? null : note.id);
            },
            style: {
              width: '28px', height: '28px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'transparent',
              fontSize: '18px', color: 'var(--color-text-tertiary)', lineHeight: 1,
            }
          }, '···'),

          // 下拉菜单
          isMenuOpen && h('div', {
            style: {
              position: 'absolute',
              top: '60px', right: 0,
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-3)',
              zIndex: 50,
              minWidth: '140px',
              overflow: 'hidden',
            }
          },
            // Edit
            h('div', {
              onClick: (e) => { e.stopPropagation(); setOpenMenuId(null); setEditingNote(note); setShowForm(true); },
              style: { padding: '10px 14px', fontSize: '14px', color: 'var(--color-text-primary)', cursor: 'pointer', borderBottom: '1px solid var(--color-border-light)' }
            }, '✏️ Edit'),
            // Move to...
            h('div', {
              style: { padding: '6px 14px', fontSize: '13px', color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border-light)' }
            }, 'Move to:'),
            ...CATEGORIES.notes
              .filter(c => c.key !== note.category)
              .map(c => h('div', {
                key: c.key,
                onClick: (e) => { e.stopPropagation(); handleMoveCategory(note, c.key); },
                style: { padding: '8px 14px 8px 24px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }
              }, `${c.icon} ${c.label}`)),
            // Share
            h('div', {
              onClick: (e) => { e.stopPropagation(); handleShare(note); },
              style: { padding: '10px 14px', fontSize: '14px', color: 'var(--color-text-primary)', cursor: 'pointer', borderTop: '1px solid var(--color-border-light)' }
            }, '📤 Share'),
            // Archive / Unarchive
            h('div', {
              onClick: (e) => {
                e.stopPropagation();
                setOpenMenuId(null);
                viewMode === 'archived' ? handleUnarchive(note.id) : handleArchive(note.id);
              },
              style: { padding: '10px 14px', fontSize: '14px', color: 'var(--color-text-primary)', cursor: 'pointer', borderBottom: '1px solid var(--color-border-light)' }
            }, viewMode === 'archived' ? '📥 Unarchive' : '📦 Archive'),
            // Delete
            h('div', {
              onClick: (e) => {
                e.stopPropagation();
                setOpenMenuId(null);
                if (confirm('确定删除此灵感？')) handleDelete(note.id);
              },
              style: { padding: '10px 14px', fontSize: '14px', color: 'var(--color-deadline)', cursor: 'pointer' }
            }, '🗑 Delete'),
          )
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
      title: '🌱 Studio', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); setEditingNote(null); setShowForm(true); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    // 活跃/已归档 切换
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

    // 分类 Chips
    h('div', {
      style: { display: 'flex', gap: 'var(--space-xs)', padding: '0 var(--space-lg) var(--space-sm)', overflowX: 'auto' }
    },
      CATEGORIES.studioChips.map(c =>
        h('button', {
          key: c.key,
          onClick: () => handleCategoryChange(c.key),
          style: chipStyle(activeCategory === c.key),
        }, c.icon + ' ' + c.label)
      )
    ),

    // Closet 子筛选
    activeCategory === 'closet' && h('div', {
      style: { display: 'flex', gap: 'var(--space-xs)', padding: '0 var(--space-lg) var(--space-sm)', overflowX: 'auto' }
    },
      CATEGORIES.closetFilters.map(c =>
        h('button', {
          key: c.key,
          onClick: () => { Haptics.selection(); setClosetFilter(c.key); },
          style: chipStyle(closetFilter === c.key),
        }, c.icon + ' ' + c.label)
      )
    ),

    // 搜索栏
    h('div', { style: { padding: '0 var(--space-lg) var(--space-sm)' } },
      h('input', {
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        placeholder: '搜索标题、内容、标签、备注...',
        style: searchInputStyle
      })
    ),

    // 标签筛选区
    (allTags.length > 0 && !searchQuery) && h('div', {
      style: { display: 'flex', gap: '6px', padding: '0 var(--space-lg) var(--space-sm)', overflowX: 'auto' }
    },
      allTags.map(tag =>
        h('button', {
          key: tag,
          onClick: () => { Haptics.selection(); setActiveTag(activeTag === tag ? null : tag); },
          style: chipStyle(activeTag === tag),
        }, '#' + tag)
      )
    ),

    // 列表
    h('div', { className: 'scroll-container page' },
      notes.length === 0
        ? h(EmptyState, {
            icon: viewMode === 'archived' ? '📦' : '🌱',
            title: viewMode === 'archived' ? '没有已归档的灵感' : '还没有灵感记录',
            subtitle: '点击右上角 + 开始记录'
          })
        : h('div', null, notes.map(renderNote))
    ),

    // 表单
    h(StudioForm, { open: showForm, onClose: handleCloseForm, note: editingNote }),

    // 详情
    detailNote && h(StudioDetail, {
      open: !!detailNote,
      onClose: handleCloseDetail,
      note: detailNote,
      onEdit: handleEditFromDetail,
      onToggleFavorite: () => handleToggleFavorite(detailNote),
      onShare: () => handleShare(detailNote),
      onArchive: () => handleArchive(detailNote.id),
      onUnarchive: () => handleUnarchive(detailNote.id),
      onDelete: () => handleDelete(detailNote.id),
      viewMode,
    })
  );
}

window.StudioPage = StudioPage;

})();
