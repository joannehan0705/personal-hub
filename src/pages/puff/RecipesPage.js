(function() {
/**
 * Personal Hub — 配方管理页
 */

const { createElement: h, useState, useEffect } = React;

function RecipesPage() {
  const { dataVersion, refreshData, showToast } = useApp();
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  // 表单状态
  const [name, setName] = useState('');
  const [steps, setSteps] = useState('');
  const [servings, setServings] = useState('');
  const [productId, setProductId] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [dataVersion]);

  const loadData = async () => {
    const [recipeData, productData] = await Promise.all([
      DAO.recipes.getAll(),
      DAO.products.getAll(),
    ]);
    recipeData.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    setRecipes(recipeData);
    setProducts(productData);
  };

  const openForm = (recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setName(recipe.name || '');
      setSteps(recipe.steps || '');
      setServings(recipe.servings != null ? String(recipe.servings) : '');
      setProductId(recipe.productId || '');
      setIngredients(recipe.ingredients || []);
      setNotes(recipe.notes || '');
    } else {
      setEditingRecipe(null);
      setName('');
      setSteps('');
      setServings('');
      setProductId('');
      setIngredients([]);
      setNotes('');
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
      showToast('请输入配方名称', 'warning');
      return;
    }

    const totalCost = ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);

    const data = {
      name: name.trim(),
      steps: steps.trim(),
      servings: parseInt(servings) || 1,
      productId: productId || null,
      ingredients,
      notes: notes.trim(),
      totalCost,
    };

    if (editingRecipe) {
      await DAO.recipes.update(editingRecipe.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.recipes.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    handleCloseForm();
  };

  const handleDelete = async (recipe) => {
    await DAO.recipes.delete(recipe.id);
    showToast('已删除', 'success');
    Haptics.success();
    refreshData();
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '', cost: '' }]);
  };

  const updateIngredient = (index, field, value) => {
    setIngredients(ingredients.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing
    ));
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const getProductName = (pid) => {
    if (!pid) return null;
    const p = products.find(p => p.id === pid);
    return p ? p.name : null;
  };

  const renderRecipe = (recipe) => {
    const productName = getProductName(recipe.productId);

    return h('div', {
      key: recipe.id,
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
        // 信息
        h('div', {
          onClick: () => { Haptics.light(); openForm(recipe); },
          style: { flex: 1, minWidth: 0 }
        },
          h('div', { style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' } }, recipe.name),
          h('div', {
            style: {
              fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px',
              display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)',
            }
          },
            productName && h('span', null, `关联: ${productName}`),
            h('span', null, `${recipe.servings || 1} 份`),
          ),
          (recipe.totalCost != null && recipe.totalCost > 0) && h('div', {
            style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }
          },
            h('span', { className: 'numeric' }, `成本 ${FormatUtils.money(recipe.totalCost)}`)
          ),
        ),

        // 删除按钮
        h('button', {
          onClick: () => handleDelete(recipe),
          style: {
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: 'var(--color-bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }
        }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
      )
    );
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '配方', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); openForm(null); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    h('div', { className: 'scroll-container page' },
      h('div', { className: 'section-header' }, '配方列表'),
      recipes.length === 0
        ? h(EmptyState, { icon: '📝', title: '还没有配方', subtitle: '点击右上角 + 添加配方' })
        : h('div', null, recipes.map(renderRecipe))
    ),

    // 新增/编辑表单
    h(Sheet, {
      open: showForm,
      onClose: handleCloseForm,
      title: editingRecipe ? '编辑配方' : '新增配方',
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

        h(Input, {
          label: '名称',
          value: name,
          onChange: setName,
          placeholder: '输入配方名称',
          required: true,
        }),

        // 关联产品
        products.length > 0 && h('div', null,
          h('label', {
            style: {
              fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)',
              paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)',
            }
          }, '关联产品'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
            h('button', {
              onClick: () => { Haptics.selection(); setProductId(''); },
              style: {
                padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: '14px', fontWeight: 500,
                backgroundColor: !productId ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: !productId ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, '无'),
            products.map(p =>
              h('button', {
                key: p.id,
                onClick: () => { Haptics.selection(); setProductId(p.id); },
                style: {
                  padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: '14px', fontWeight: 500,
                  backgroundColor: productId === p.id ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: productId === p.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, p.name)
            )
          )
        ),

        h(Input, {
          label: '份数',
          value: servings,
          onChange: setServings,
          placeholder: '1',
          type: 'number',
        }),

        h(Input, {
          label: '步骤说明',
          value: steps,
          onChange: setSteps,
          placeholder: '详细制作步骤...',
          multiline: true,
          rows: 4,
        }),

        // 原料列表
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
            : h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' } },
                ingredients.map((ing, index) =>
                  h('div', {
                    key: index,
                    style: {
                      display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      minWidth: 0,
                    }
                  },
                    h('input', {
                      value: ing.name,
                      onChange: (e) => updateIngredient(index, 'name', e.target.value),
                      placeholder: '原料名',
                      style: { flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', color: 'var(--color-text-primary)' }
                    }),
                    h('input', {
                      value: ing.quantity,
                      onChange: (e) => updateIngredient(index, 'quantity', e.target.value),
                      placeholder: '用量',
                      style: { width: '52px', flexShrink: 0, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', color: 'var(--color-text-primary)', textAlign: 'right' }
                    }),
                    h('input', {
                      value: ing.unit,
                      onChange: (e) => updateIngredient(index, 'unit', e.target.value),
                      placeholder: '单位',
                      style: { width: '44px', flexShrink: 0, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', color: 'var(--color-text-primary)' }
                    }),
                    h('input', {
                      value: ing.cost,
                      onChange: (e) => updateIngredient(index, 'cost', e.target.value),
                      placeholder: '成本',
                      type: 'number',
                      style: { width: '52px', flexShrink: 0, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', color: 'var(--color-text-primary)', textAlign: 'right' }
                    }),
                    h('button', {
                      onClick: () => removeIngredient(index),
                      style: {
                        width: '24px', height: '24px', borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }
                    }, h(Icon, { name: 'close', size: 12, color: 'var(--color-text-tertiary)' }))
                  )
                )
              )
        ),

        // 成本合计
        ingredients.length > 0 && h('div', {
          style: {
            display: 'flex', justifyContent: 'space-between',
            padding: 'var(--space-sm) 0',
            borderTop: '1px solid var(--color-border)',
          }
        },
          h('span', { style: { fontSize: '15px', fontWeight: 600 } }, '总成本'),
          h('span', {
            style: { fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)' },
            className: 'numeric'
          }, FormatUtils.money(ingredients.reduce((sum, ing) => sum + (parseFloat(ing.cost) || 0), 0)))
        ),

        // 备注
        h(Input, {
          label: '备注',
          value: notes,
          onChange: setNotes,
          placeholder: '如：注意事项、烘焙温度等',
          multiline: true,
          rows: 2,
        }),

        h(Button, { fullWidth: true, onClick: handleSave }, editingRecipe ? '保存' : '添加'),
      )
    )
  );
}

window.RecipesPage = RecipesPage;

})();
