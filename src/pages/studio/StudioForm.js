(function() {
/**
 * Personal Hub — Studio 编辑表单
 * 通用字段 + 标签系统 + Closet 条件字段
 */

const { createElement: h, useState, useEffect } = React;

function StudioForm({ open, onClose, note }) {
  const { showToast } = useApp();

  // 通用字段
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('quick');
  const [tags, setTags] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [favorite, setFavorite] = useState(false);

  // 标签输入
  const [tagInput, setTagInput] = useState('');
  const [fullscreenEdit, setFullscreenEdit] = useState(false);

  // Closet 专属
  const [outfitTop, setOutfitTop] = useState('');
  const [outfitBottom, setOutfitBottom] = useState('');
  const [outfitShoes, setOutfitShoes] = useState('');
  const [outfitBag, setOutfitBag] = useState('');
  const [outfitAccessory, setOutfitAccessory] = useState('');
  const [styleTags, setStyleTags] = useState([]);
  const [colorPalette, setColorPalette] = useState('');
  const [season, setSeason] = useState('');
  const [occasion, setOccasion] = useState('');
  const [brand, setBrand] = useState('');
  const [sourceLink, setSourceLink] = useState('');

  useEffect(() => {
    if (open) {
      setFullscreenEdit(false);
      if (note) {
        setTitle(note.title || '');
        setContent(note.content || '');
        setCategory(note.category || 'quick');
        setTags(note.tags || []);
        setRemarks(note.remarks || '');
        setFavorite(note.favorite || false);

        // Closet 字段
        const o = note.outfit || {};
        setOutfitTop(o.top || '');
        setOutfitBottom(o.bottom || '');
        setOutfitShoes(o.shoes || '');
        setOutfitBag(o.bag || '');
        setOutfitAccessory(o.accessory || '');
        setStyleTags(note.styleTags || []);
        setColorPalette(Array.isArray(note.colorPalette) ? note.colorPalette.join(', ') : '');
        setSeason(note.season || '');
        setOccasion(note.occasion || '');
        setBrand(note.brand || '');
        setSourceLink(note.sourceLink || '');
      } else {
        setTitle(''); setContent(''); setCategory('quick');
        setTags([]); setRemarks(''); setFavorite(false);
        setOutfitTop(''); setOutfitBottom(''); setOutfitShoes('');
        setOutfitBag(''); setOutfitAccessory('');
        setStyleTags([]); setColorPalette(''); setSeason('');
        setOccasion(''); setBrand(''); setSourceLink('');
      }
      setTagInput('');
    }
  }, [open, note]);

  // 标签管理
  const addTag = (tag) => {
    const t = tag.trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput('');
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const togglePresetTag = (tag) => {
    Haptics.selection();
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  // StyleTags 管理
  const toggleStyleTag = (tag) => {
    Haptics.selection();
    if (styleTags.includes(tag)) {
      setStyleTags(styleTags.filter(t => t !== tag));
    } else {
      setStyleTags([...styleTags, tag]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('请输入标题', 'warning');
      return;
    }

    const data = {
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
      remarks: remarks.trim(),
      favorite,
      archived: note?.archived || false,
    };

    // Closet 专属字段
    if (category === 'closet') {
      data.outfit = {
        top: outfitTop.trim(),
        bottom: outfitBottom.trim(),
        shoes: outfitShoes.trim(),
        bag: outfitBag.trim(),
        accessory: outfitAccessory.trim(),
      };
      data.styleTags = styleTags;
      data.colorPalette = colorPalette.split(',').map(s => s.trim()).filter(Boolean);
      data.season = season;
      data.occasion = occasion;
      data.brand = brand.trim();
      data.sourceLink = sourceLink.trim();
    }

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

  // 标签 chip 样式
  const tagChipStyle = (active) => ({
    padding: '6px 12px', borderRadius: 'var(--radius-pill)',
    fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap',
    backgroundColor: active ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
    color: active ? '#FFFFFF' : 'var(--color-text-secondary)',
  });

  const labelStyle = {
    fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)',
    paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)',
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

      // 内容（可全屏编辑）
      h('div', null,
        h('div', {
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' },
        },
          h('label', {
            style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)' },
          }, '内容'),
          h('button', {
            onClick: () => { Haptics.light(); setFullscreenEdit(true); },
            style: {
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-bg-subtle)', border: 'none',
              fontSize: '12px', color: 'var(--color-text-secondary)', cursor: 'pointer',
            },
          }, '⤢ 全屏编辑'),
        ),
        h(Input, {
          value: content,
          onChange: setContent,
          placeholder: '写下你的灵感...',
          multiline: true,
          rows: 4,
        }),
      ),

      // 分类选择
      h('div', null,
        h('label', { style: labelStyle }, '分类'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
          CATEGORIES.notes.map(cat =>
            h('button', {
              key: cat.key,
              onClick: () => { Haptics.selection(); setCategory(cat.key); },
              style: tagChipStyle(category === cat.key),
            }, `${cat.icon} ${cat.label}`)
          )
        )
      ),

      // 标签
      h('div', null,
        h('label', { style: labelStyle }, '标签'),
        // 已选标签
        tags.length > 0 && h('div', {
          style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--space-sm)' }
        },
          tags.map(tag =>
            h('span', {
              key: tag,
              onClick: () => { Haptics.light(); removeTag(tag); },
              style: {
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '5px 10px', borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--color-accent-light)', fontSize: '13px',
                color: 'var(--color-accent)', fontWeight: 500, cursor: 'pointer',
              }
            }, '#' + tag, h('span', { style: { fontSize: '15px', lineHeight: 1 } }, '×'))
          )
        ),
        // 预设标签
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--space-sm)' } },
          CATEGORIES.studioTagPresets.map(tag =>
            h('button', {
              key: tag,
              onClick: () => togglePresetTag(tag),
              style: tagChipStyle(tags.includes(tag)),
            }, tag)
          )
        ),
        // 自定义输入
        h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
          h('input', {
            value: tagInput,
            onChange: (e) => setTagInput(e.target.value),
            onKeyDown: (e) => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); }
            },
            placeholder: '自定义标签...',
            style: {
              flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              fontSize: '14px', backgroundColor: 'var(--color-bg-subtle)',
              border: 'none', outline: 'none', color: 'var(--color-text-primary)',
            }
          }),
          h('button', {
            onClick: () => { Haptics.light(); addTag(tagInput); },
            style: {
              width: '36px', borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-bg-subtle)',
              fontSize: '18px', color: 'var(--color-accent)',
            }
          }, '+')
        )
      ),

      h(Input, {
        label: '备注',
        value: remarks,
        onChange: setRemarks,
        placeholder: '额外说明、注意事项等...',
        multiline: true,
        rows: 2,
      }),

      // ===== Closet 专属字段 =====
      category === 'closet' && h('div', {
        style: {
          padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-bg-subtle)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)',
        }
      },
        h('div', {
          style: { fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)' }
        }, '👕 Outfit Details'),

        // Outfit 5 字段
        h(Input, { label: 'Top', value: outfitTop, onChange: setOutfitTop, placeholder: '如 White Linen Shirt' }),
        h(Input, { label: 'Bottom', value: outfitBottom, onChange: setOutfitBottom, placeholder: '如 Straight Jeans' }),
        h(Input, { label: 'Shoes', value: outfitShoes, onChange: setOutfitShoes, placeholder: '如 Black Loafers' }),
        h(Input, { label: 'Bag', value: outfitBag, onChange: setOutfitBag, placeholder: '如 Black Shoulder Bag' }),
        h(Input, { label: 'Accessory', value: outfitAccessory, onChange: setOutfitAccessory, placeholder: '如 Gold Earrings' }),

        // Style Tags
        h('div', null,
          h('label', { style: labelStyle }, 'Style Tags'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
            CATEGORIES.closetStyleTags.map(tag =>
              h('button', {
                key: tag,
                onClick: () => toggleStyleTag(tag),
                style: tagChipStyle(styleTags.includes(tag)),
              }, tag)
            )
          )
        ),

        // Color Palette
        h(Input, {
          label: 'Color Palette',
          value: colorPalette,
          onChange: setColorPalette,
          placeholder: 'White, Blue, Black',
        }),

        // Season
        h('div', null,
          h('label', { style: labelStyle }, 'Season'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
            CATEGORIES.closetSeasons.map(s =>
              h('button', {
                key: s.key,
                onClick: () => { Haptics.selection(); setSeason(season === s.key ? '' : s.key); },
                style: tagChipStyle(season === s.key),
              }, s.label)
            )
          )
        ),

        // Occasion
        h('div', null,
          h('label', { style: labelStyle }, 'Occasion'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
            CATEGORIES.closetOccasions.map(o =>
              h('button', {
                key: o.key,
                onClick: () => { Haptics.selection(); setOccasion(occasion === o.key ? '' : o.key); },
                style: tagChipStyle(occasion === o.key),
              }, o.label)
            )
          )
        ),

        // Brand
        h(Input, { label: 'Brand (optional)', value: brand, onChange: setBrand, placeholder: '品牌名...' }),

        // Source Link
        h(Input, { label: 'Source Link (optional)', value: sourceLink, onChange: setSourceLink, placeholder: 'https://...' }),
      ),

      // 收藏
      h('div', {
        style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '0 var(--space-xs)' }
      },
        h(Checkbox, { checked: favorite, onChange: setFavorite }),
        h('span', {
          style: { fontSize: '15px', color: favorite ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontWeight: favorite ? 600 : 400 }
        }, '⭐ 收藏')
      ),

      h(Button, { fullWidth: true, onClick: handleSave }, note ? '保存' : '添加'),
    ),

    // 全屏编辑覆盖层
    fullscreenEdit && h('div', {
      style: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'var(--color-bg-base)', zIndex: 10000,
        display: 'flex', flexDirection: 'column',
        paddingTop: 'var(--safe-top)',
      },
    },
      // 顶部栏
      h('div', {
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-sm) var(--space-lg)', height: '44px',
          borderBottom: '1px solid var(--color-border-light)',
          flexShrink: 0,
        },
      },
        h('button', {
          onClick: () => { Haptics.light(); setFullscreenEdit(false); },
          style: { fontSize: '16px', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' },
        }, '完成'),
        h('span', { style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' } }, '编辑内容'),
        h('div', { style: { width: '44px' } }),
      ),
      // 编辑区
      h('textarea', {
        value: content,
        onChange: (e) => setContent(e.target.value),
        placeholder: '写下你的灵感...',
        autoFocus: true,
        style: {
          flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'none',
          padding: 'var(--space-lg)', fontSize: '16px', lineHeight: 1.8,
          fontFamily: 'inherit', color: 'var(--color-text-primary)',
          backgroundColor: 'transparent',
        },
      }),
    ),
  );
}

window.StudioForm = StudioForm;

})();
