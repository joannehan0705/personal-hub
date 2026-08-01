(function() {
/**
 * Personal Hub — 灵感笔记表单
 */

const { createElement: h, useState, useEffect } = React;

function NoteForm({ open, onClose, note }) {
  const { showToast } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('quick');
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (open) {
      if (note) {
        setTitle(note.title || '');
        setContent(note.content || '');
        setCategory(note.category || 'quick');
        setPinned(note.pinned || false);
      } else {
        setTitle('');
        setContent('');
        setCategory('quick');
        setPinned(false);
      }
    }
  }, [open, note]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('请输入标题', 'warning');
      return;
    }

    const data = {
      title: title.trim(),
      content: content.trim(),
      category,
      pinned,
      archived: note?.archived || false,
    };

    if (note) {
      await DAO.notes.update(note.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.notes.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    onClose();
  };

  return h(Sheet, { open, onClose, title: note ? '编辑灵感' : '新增灵感' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      h(Input, {
        label: '标题',
        value: title,
        onChange: setTitle,
        placeholder: '灵感标题...',
        required: true,
      }),

      h(Input, {
        label: '内容',
        value: content,
        onChange: setContent,
        placeholder: '写下你的灵感...',
        multiline: true,
        rows: 4,
      }),

      // 分类选择
      h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '分类'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
          CATEGORIES.notes.map(cat =>
            h('button', {
              key: cat.key,
              onClick: () => { Haptics.selection(); setCategory(cat.key); },
              style: {
                padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                fontSize: '14px', fontWeight: 500,
                backgroundColor: category === cat.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: category === cat.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, `${cat.icon} ${cat.label}`)
          )
        )
      ),

      // Pin 置顶
      h('div', {
        style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '0 var(--space-xs)' }
      },
        h(Checkbox, { checked: pinned, onChange: setPinned }),
        h('span', { style: { fontSize: '15px', color: pinned ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontWeight: pinned ? 600 : 400 } }, '📌 置顶')
      ),

      h(Button, { fullWidth: true, onClick: handleSave }, note ? '保存' : '添加'),
    )
  );
}

window.NoteForm = NoteForm;

})();
