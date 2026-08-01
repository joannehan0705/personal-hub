(function() {
/**
 * Personal Hub — 生活食谱页
 * 分类：All, Favorite, Breakfast, Lunch, Dinner, Dessert, Drinks, Snacks
 * 字段：name, category, ingredients[], steps, notes, source
 */

const { createElement: h, useState, useEffect } = React;

const LIFE_RECIPE_CATEGORIES = [
  { key: 'all',        label: 'All',       icon: '📋' },
  { key: 'breakfast',  label: 'Breakfast', icon: '🥣' },
  { key: 'lunch',      label: 'Lunch',     icon: '🍱' },
  { key: 'dinner',     label: 'Dinner',    icon: '🍝' },
  { key: 'dessert',    label: 'Dessert',   icon: '🍰' },
  { key: 'drinks',     label: 'Drinks',    icon: '🥤' },
  { key: 'snacks',     label: 'Snacks',    icon: '🥟' },
];

function LifeRecipesPage() {
  const { dataVersion, refreshData, showToast } = useApp();
  const [recipes, setRecipes] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  // 表单状态
  const [name, setName] = useState('');
  const [category, setCategory] = useState('breakfast');
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('');

  useEffect(() => {
    loadRecipes();
  }, [dataVersion]);

  const loadRecipes = async () => {
    const data = await DAO.lifeRecipes.getAll();
    data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    setRecipes(data);
  };

  const filtered = recipes.filter(r => {
    if (activeCategory === 'all') return true;
    return r.category === activeCategory;
  });

  const openForm = (recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setName(recipe.name || '');
      setCategory(recipe.category || 'breakfast');
      setIngredients(Array.isArray(recipe.ingredients) ? recipe.ingredients : []);
      setSteps(recipe.steps || '');
      setNotes(recipe.notes || '');
      setSource(recipe.source || '');
    } else {
      setEditingRecipe(null);
      setName('');
      setCategory(activeCategory === 'all' ? 'breakfast' : activeCategory);
      setIngredients(['']);
      setSteps('');
      setNotes('');
      setSource('');
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecipe(null);
    refreshData();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('请输入食谱名称', 'warning');
      return;
    }
    const cleanedIngredients = ingredients.map(s => (s || '').trim()).filter(Boolean);

    const data = {
      name: name.trim(),
      category,
      ingredients: cleanedIngredients,
      steps: steps.trim(),
      notes: notes.trim(),
      source: source.trim(),
    };

    if (editingRecipe) {
      await DAO.lifeRecipes.update(editingRecipe.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.lifeRecipes.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    handleCloseForm();
  };

  const handleDelete = async (recipe) => {
    if (!confirm(`确定删除「${recipe.name}」？`)) return;
    await DAO.lifeRecipes.delete(recipe.id);
    showToast('已删除', 'success');
    Haptics.success();
    refreshData();
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const updateIngredient = (index, value) => {
    const next = ingredients.slice();
    next[index] = value;
    setIngredients(next);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const renderRecipe = (recipe) => {
    const cat = LIFE_RECIPE_CATEGORIES.find(c => c.key === recipe.category) || LIFE_RECIPE_CATEGORIES[2];
    return h('div', {
      key: recipe.id,
      onClick: () => { Haptics.light(); openForm(recipe); },
      style: {
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        cursor: 'pointer',
      }
    },
      h('div', {
        style: {
          width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', flexShrink: 0,
        }
      }, cat.icon),

      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', {
          style: {
            fontSize: '16px', fontWeight: 600,
            color: 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }
        }, recipe.name),
        h('div', {
          style: {
            fontSize: '13px', color: 'var(--color-text-tertiary)',
            marginTop: '4px',
            display: 'flex',
            gap: 'var(--space-sm)',
            flexWrap: 'wrap',
          }
        },
          h('span', null, cat.label),
          recipe.source && h('span', null, '· ' + recipe.source)
        )
      ),

      h('button', {
        onClick: (e) => { e.stopPropagation(); handleDelete(recipe); },
        style: {
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: 'var(--color-bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }
      }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
    );
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '食谱', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); openForm(null); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    // 分类切换按钮
    h('div', {
      style: {
        display: 'flex',
        gap: 'var(--space-xs)',
        padding: '0 var(--space-lg) var(--space-sm)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }
    },
      LIFE_RECIPE_CATEGORIES.map(c =>
        h('button', {
          key: c.key,
          onClick: () => { Haptics.selection(); setActiveCategory(c.key); },
          style: {
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '14px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            backgroundColor: activeCategory === c.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: activeCategory === c.key ? '#FFFFFF' : 'var(--color-text-secondary)',
            transition: 'background-color 0.2s, color 0.2s',
          }
        }, c.icon + ' ' + c.label)
      )
    ),

    h('div', { className: 'scroll-container page' },
      filtered.length === 0
        ? h(EmptyState, {
            icon: LIFE_RECIPE_CATEGORIES.find(c => c.key === activeCategory)?.icon || '🍳',
            title: '还没有食谱',
            subtitle: '点击右上角 + 添加',
          })
        : h('div', null, filtered.map(renderRecipe))
    ),

    // 新增/编辑表单
    h(Sheet, {
      open: showForm,
      onClose: handleCloseForm,
      title: editingRecipe ? '编辑食谱' : '新增食谱',
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

        h(Input, {
          label: '名称',
          value: name,
          onChange: setName,
          placeholder: '输入食谱名称',
          required: true,
        }),

        // 分类选择
        h('div', null,
          h('label', {
            style: {
              fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)',
              paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)',
            }
          }, '分类'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
            LIFE_RECIPE_CATEGORIES.filter(c => c.key !== 'all' && c.key !== 'favorite').map(c =>
              h('button', {
                key: c.key,
                onClick: () => { Haptics.selection(); setCategory(c.key); },
                style: {
                  padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: '14px', fontWeight: 500,
                  backgroundColor: category === c.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: category === c.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, c.icon + ' ' + c.label)
            )
          )
        ),

        // Ingredients（每行一个）
        h('div', null,
          h('div', {
            style: {
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 'var(--space-xs)',
            }
          },
            h('label', {
              style: {
                fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)',
                paddingLeft: 'var(--space-xs)',
              }
            }, '原料'),
            h('button', {
              onClick: () => { Haptics.light(); addIngredient(); },
              style: {
                padding: '4px 10px', borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--color-bg-subtle)',
                fontSize: '13px', fontWeight: 500, color: 'var(--color-accent)',
              }
            }, '+ 添加')
          ),
          ingredients.length === 0
            ? h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', padding: 'var(--space-sm) 0' } }, '点击"添加"添加原料')
            : h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' } },
                ingredients.map((ing, index) =>
                  h('div', {
                    key: index,
                    style: {
                      display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
                      minWidth: 0,
                    }
                  },
                    h('input', {
                      value: ing,
                      onChange: (e) => updateIngredient(index, e.target.value),
                      placeholder: '如：鸡蛋 3 个',
                      style: {
                        flex: 1, minWidth: 0,
                        padding: '10px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-bg-base)',
                        fontSize: '15px',
                        outline: 'none',
                        color: 'var(--color-text-primary)',
                      }
                    }),
                    h('button', {
                      onClick: () => removeIngredient(index),
                      style: {
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }
                    }, h(Icon, { name: 'close', size: 14, color: 'var(--color-text-tertiary)' }))
                  )
                )
              )
        ),

        // 步骤
        h(Input, {
          label: '步骤',
          value: steps,
          onChange: setSteps,
          placeholder: '详细制作步骤...',
          multiline: true,
          rows: 4,
        }),

        // Notes
        h(Input, {
          label: 'Notes',
          value: notes,
          onChange: setNotes,
          placeholder: '如：注意事项、小贴士等',
          multiline: true,
          rows: 2,
        }),

        // Source
        h(Input, {
          label: 'Source',
          value: source,
          onChange: setSource,
          placeholder: '如：网站链接、书名、朋友推荐等',
        }),

        h(Button, { fullWidth: true, onClick: handleSave }, editingRecipe ? '保存' : '添加'),
      )
    )
  );
}

window.LifeRecipesPage = LifeRecipesPage;

})();