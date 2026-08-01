(function() {
/**
 * Personal Hub — 社交媒体管理页
 * 支持 计划中 / 已发布 分类切换
 */

const { createElement: h, useState, useEffect } = React;

const POST_TABS = [
  { key: 'planned',   label: '计划中' },
  { key: 'published', label: '已发布' },
];

function SocialPage() {
  const { dataVersion, refreshData, showToast } = useApp();
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('planned');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // 表单状态
  const [platform, setPlatform] = useState('instagram');
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState(DateUtils.today());
  const [status, setStatus] = useState('planned');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPosts();
  }, [dataVersion]);

  const loadPosts = async () => {
    const data = await DAO.socialPosts.getAll();
    data.sort((a, b) => {
      if (a.status === 'planned' && b.status !== 'planned') return -1;
      if (a.status !== 'planned' && b.status === 'planned') return 1;
      return (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
    });
    setPosts(data);
  };

  const openForm = (post) => {
    if (post) {
      setEditingPost(post);
      setPlatform(post.platform || 'instagram');
      setContent(post.content || '');
      setScheduledDate(post.scheduledDate || DateUtils.today());
      setStatus(post.status || 'planned');
      setNotes(post.notes || '');
    } else {
      setEditingPost(null);
      setPlatform('instagram');
      setContent('');
      setScheduledDate(DateUtils.today());
      setStatus(activeTab);
      setNotes('');
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPost(null);
    refreshData();
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showToast('请输入发布内容', 'warning');
      return;
    }

    const data = {
      platform,
      content: content.trim(),
      scheduledDate,
      status,
      notes: notes.trim(),
    };

    if (editingPost) {
      await DAO.socialPosts.update(editingPost.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.socialPosts.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    handleCloseForm();
  };

  const handleDelete = async (post) => {
    await DAO.socialPosts.delete(post.id);
    showToast('已删除', 'success');
    Haptics.success();
    refreshData();
  };

  const handleToggleStatus = async (post) => {
    const newStatus = post.status === 'planned' ? 'published' : 'planned';
    await DAO.socialPosts.update(post.id, { status: newStatus });
    Haptics.light();
    showToast(newStatus === 'published' ? '已标记为已发布' : '已标记为计划中', 'success');
    refreshData();
  };

  const getPlatformInfo = (key) => {
    return CATEGORIES.socialPlatforms.find(p => p.key === key) || CATEGORIES.socialPlatforms[3];
  };

  const statusMap = {
    planned:    { label: '计划中', color: '#6B9EC4' },
    published:  { label: '已发布', color: '#7BAE8E' },
  };

  const renderPost = (post) => {
    const plat = getPlatformInfo(post.platform);
    const st = statusMap[post.status] || statusMap.planned;

    return h('div', {
      key: post.id,
      style: {
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
      }
    },
      h('div', {
        style: { display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }
      },
        h('div', {
          style: {
            width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', flexShrink: 0,
          }
        }, plat.icon),

        h('div', {
          onClick: () => { Haptics.light(); openForm(post); },
          style: { flex: 1, minWidth: 0 }
        },
          h('div', {
            style: {
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '2px',
            }
          },
            h('span', { style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' } }, plat.label),
            h(Tag, { color: st.color }, st.label)
          ),
          h('div', {
            style: {
              fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '2px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }
          }, post.content),
          h('div', {
            style: {
              fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px',
              display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
            }
          },
            h(Icon, { name: 'calendar', size: 14, color: 'var(--color-text-tertiary)' }),
            DateUtils.friendlyDate(post.scheduledDate),
          ),
        ),

        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 } },
          h('button', {
            onClick: () => handleToggleStatus(post),
            style: {
              width: '28px', height: '28px', borderRadius: '50%',
              backgroundColor: post.status === 'published' ? 'rgba(123, 174, 142, 0.15)' : 'var(--color-bg-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }
          }, h(Icon, { name: 'check', size: 14, color: post.status === 'published' ? 'var(--color-complete)' : 'var(--color-text-tertiary)' })),
          h('button', {
            onClick: () => handleDelete(post),
            style: {
              width: '28px', height: '28px', borderRadius: '50%',
              backgroundColor: 'var(--color-bg-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }
          }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
        )
      )
    );
  };

  const filteredPosts = posts.filter(p => p.status === activeTab);

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '社交媒体', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); openForm(null); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    // 计划中 / 已发布 切换
    h('div', {
      style: { display: 'flex', gap: 'var(--space-xs)', padding: '0 var(--space-lg) var(--space-sm)' }
    },
      POST_TABS.map(tab =>
        h('button', {
          key: tab.key,
          onClick: () => { Haptics.selection(); setActiveTab(tab.key); },
          style: {
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            fontSize: '14px', fontWeight: 500,
            backgroundColor: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: activeTab === tab.key ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, tab.label + ' (' + posts.filter(p => p.status === tab.key).length + ')')
      )
    ),

    h('div', { className: 'scroll-container page' },
      filteredPosts.length === 0
        ? h(EmptyState, { icon: '📱', title: activeTab === 'planned' ? '没有计划中的发布' : '没有已发布的记录', subtitle: '点击右上角 + 添加' })
        : h('div', null, filteredPosts.map(renderPost))
    ),

    // 新增/编辑表单
    h(Sheet, {
      open: showForm,
      onClose: handleCloseForm,
      title: editingPost ? '编辑计划' : '新增计划',
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

        // 状态选择
        h('div', null,
          h('label', {
            style: {
              fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)',
              paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)',
            }
          }, '状态'),
          h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
            POST_TABS.map(tab =>
              h('button', {
                key: tab.key,
                onClick: () => { Haptics.selection(); setStatus(tab.key); },
                style: {
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                  fontSize: '15px', fontWeight: 500,
                  backgroundColor: status === tab.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: status === tab.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, tab.label)
            )
          )
        ),

        // 平台选择器
        h('div', null,
          h('label', {
            style: {
              fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)',
              paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)',
            }
          }, '平台'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
            CATEGORIES.socialPlatforms.map(plat =>
              h('button', {
                key: plat.key,
                onClick: () => { Haptics.selection(); setPlatform(plat.key); },
                style: {
                  padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: '14px', fontWeight: 500,
                  backgroundColor: platform === plat.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: platform === plat.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, plat.icon + ' ' + plat.label)
            )
          )
        ),

        h(Input, {
          label: '内容',
          value: content,
          onChange: setContent,
          placeholder: '输入发布内容...',
          multiline: true,
          rows: 3,
        }),

        h(Input, {
          label: '计划日期',
          value: scheduledDate,
          onChange: setScheduledDate,
          type: 'date',
        }),

        h(Input, {
          label: '备注',
          value: notes,
          onChange: setNotes,
          placeholder: '如：配图说明、话题标签等',
          multiline: true,
          rows: 2,
        }),

        h(Button, { fullWidth: true, onClick: handleSave }, editingPost ? '保存' : '添加'),
      )
    )
  );
}

window.SocialPage = SocialPage;

})();
