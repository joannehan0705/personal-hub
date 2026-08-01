(function() {
/**
 * Personal Hub — Studio 详情页 (Sheet)
 */

const { createElement: h } = React;

function StudioDetail({ open, onClose, note, onEdit, onToggleFavorite, onShare, onArchive, onUnarchive, onDelete, viewMode }) {
  if (!note) return null;

  const cat = CATEGORIES.getNoteCategory(note.category);
  const isCloset = note.category === 'closet';
  const o = note.outfit || {};

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const labelStyle = {
    fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px',
  };

  const sectionStyle = {
    padding: 'var(--space-md) 0',
    borderTop: '1px solid var(--color-border-light)',
  };

  const tagChipStyle = {
    display: 'inline-block',
    padding: '4px 10px', borderRadius: 'var(--radius-pill)',
    backgroundColor: 'var(--color-bg-subtle)', fontSize: '13px',
    fontWeight: 500, color: 'var(--color-text-secondary)',
    marginRight: '6px', marginBottom: '4px',
  };

  const actionBtnStyle = (color) => ({
    width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-bg-subtle)', fontSize: '20px',
    color: color || 'var(--color-text-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  });

  return h(Sheet, { open, onClose, title: '灵感详情' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '0' } },

      // 分类标签
      h('div', null,
        h('span', {
          style: {
            display: 'inline-block', padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--color-accent-light)', fontSize: '13px',
            fontWeight: 500, color: 'var(--color-accent)',
          }
        }, `${cat.icon} ${cat.label}`)
      ),

      // 标题
      h('h2', {
        style: {
          fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)',
          margin: 'var(--space-sm) 0 var(--space-xs)',
          lineHeight: 1.3,
        }
      }, note.title),

      // 时间
      h('div', {
        style: { fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-md)' }
      },
        `创建于 ${formatDate(note.createdAt)}`,
        note.updatedAt && note.updatedAt !== note.createdAt && ` · 更新于 ${formatDate(note.updatedAt)}`
      ),

      // 正文
      note.content && h('div', { style: sectionStyle },
        h('div', { style: labelStyle }, '正文'),
        h('div', {
          style: {
            fontSize: '15px', lineHeight: 1.6, color: 'var(--color-text-primary)',
            whiteSpace: 'pre-wrap',
          }
        }, note.content)
      ),

      // 标签
      (note.tags && note.tags.length > 0) && h('div', { style: sectionStyle },
        h('div', { style: labelStyle }, '标签'),
        h('div', null,
          note.tags.map(tag => h('span', { key: tag, style: tagChipStyle }, '#' + tag))
        )
      ),

      // 备注
      note.remarks && h('div', { style: sectionStyle },
        h('div', { style: labelStyle }, '备注'),
        h('div', {
          style: { fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }
        }, note.remarks)
      ),

      // ===== Closet 专属区域 =====
      isCloset && h('div', { style: sectionStyle },
        h('div', { style: { ...labelStyle, marginBottom: 'var(--space-sm)' } }, '👕 Outfit Details'),

        // Outfit
        (o.top || o.bottom || o.shoes || o.bag || o.accessory) && h('div', {
          style: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--space-md)' }
        },
          o.top && h('div', { style: { fontSize: '14px', color: 'var(--color-text-secondary)' } },
            h('span', { style: { color: 'var(--color-text-tertiary)', width: '70px', display: 'inline-block' } }, 'Top:'),
            o.top
          ),
          o.bottom && h('div', { style: { fontSize: '14px', color: 'var(--color-text-secondary)' } },
            h('span', { style: { color: 'var(--color-text-tertiary)', width: '70px', display: 'inline-block' } }, 'Bottom:'),
            o.bottom
          ),
          o.shoes && h('div', { style: { fontSize: '14px', color: 'var(--color-text-secondary)' } },
            h('span', { style: { color: 'var(--color-text-tertiary)', width: '70px', display: 'inline-block' } }, 'Shoes:'),
            o.shoes
          ),
          o.bag && h('div', { style: { fontSize: '14px', color: 'var(--color-text-secondary)' } },
            h('span', { style: { color: 'var(--color-text-tertiary)', width: '70px', display: 'inline-block' } }, 'Bag:'),
            o.bag
          ),
          o.accessory && h('div', { style: { fontSize: '14px', color: 'var(--color-text-secondary)' } },
            h('span', { style: { color: 'var(--color-text-tertiary)', width: '70px', display: 'inline-block' } }, 'Accessory:'),
            o.accessory
          ),
        ),

        // Style Tags
        (note.styleTags && note.styleTags.length > 0) && h('div', { style: { marginBottom: 'var(--space-sm)' } },
          h('div', { style: labelStyle }, 'Style Tags'),
          h('div', null,
            note.styleTags.map(tag => h('span', { key: tag, style: tagChipStyle }, tag))
          )
        ),

        // Color Palette
        (note.colorPalette && note.colorPalette.length > 0) && h('div', { style: { marginBottom: 'var(--space-sm)' } },
          h('div', { style: labelStyle }, 'Color Palette'),
          h('div', { style: { fontSize: '14px', color: 'var(--color-text-secondary)' } },
            note.colorPalette.join(', ')
          )
        ),

        // Season + Occasion
        (note.season || note.occasion) && h('div', { style: { display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-sm)' } },
          note.season && h('div', null,
            h('div', { style: labelStyle }, 'Season'),
            h('span', { style: tagChipStyle },
              (CATEGORIES.closetSeasons.find(s => s.key === note.season) || {}).label || note.season
            )
          ),
          note.occasion && h('div', null,
            h('div', { style: labelStyle }, 'Occasion'),
            h('span', { style: tagChipStyle },
              (CATEGORIES.closetOccasions.find(o => o.key === note.occasion) || {}).label || note.occasion
            )
          ),
        ),

        // Brand
        note.brand && h('div', { style: { marginBottom: 'var(--space-sm)' } },
          h('div', { style: labelStyle }, 'Brand'),
          h('div', { style: { fontSize: '14px', color: 'var(--color-text-secondary)' } }, note.brand)
        ),

        // Source Link
        note.sourceLink && h('div', null,
          h('div', { style: labelStyle }, 'Source Link'),
          h('a', {
            href: note.sourceLink,
            target: '_blank',
            rel: 'noopener noreferrer',
            style: { fontSize: '14px', color: 'var(--color-accent)', wordBreak: 'break-all' }
          }, note.sourceLink)
        ),
      ),

      // ===== 操作按钮区 =====
      h('div', {
        style: {
          display: 'flex', gap: 'var(--space-md)',
          paddingTop: 'var(--space-lg)',
          justifyContent: 'center',
        }
      },
        h('button', {
          onClick: () => { Haptics.light(); onEdit(); },
          style: actionBtnStyle('var(--color-accent)'),
        }, '✏️'),

        h('button', {
          onClick: () => { Haptics.light(); onToggleFavorite(); },
          style: actionBtnStyle(note.favorite ? 'var(--color-accent)' : null),
        }, note.favorite ? '⭐' : '☆'),

        h('button', {
          onClick: () => { Haptics.light(); onShare(); },
          style: actionBtnStyle(),
        }, '📤'),

        h('button', {
          onClick: () => {
            Haptics.light();
            viewMode === 'archived' ? onUnarchive() : onArchive();
          },
          style: actionBtnStyle(),
        }, viewMode === 'archived' ? '📥' : '📦'),

        h('button', {
          onClick: () => {
            Haptics.warning();
            if (confirm('确定删除此灵感？')) onDelete();
          },
          style: actionBtnStyle('var(--color-deadline)'),
        }, '🗑'),
      ),
    )
  );
}

window.StudioDetail = StudioDetail;

})();
