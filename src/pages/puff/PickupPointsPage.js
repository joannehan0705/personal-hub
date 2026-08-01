(function() {
/**
 * Personal Hub — 泡芙取货点管理页
 * 字段：name, address, description
 */

const { createElement: h, useState, useEffect } = React;

function PickupPointsPage() {
  const { dataVersion, refreshData, showToast } = useApp();
  const [points, setPoints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);

  // 表单状态
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadPoints();
  }, [dataVersion]);

  const loadPoints = async () => {
    const data = await DAO.pickupPoints.getAll();
    data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    setPoints(data);
  };

  const openForm = (point) => {
    if (point) {
      setEditingPoint(point);
      setName(point.name || '');
      setAddress(point.address || '');
      setDescription(point.description || '');
    } else {
      setEditingPoint(null);
      setName('');
      setAddress('');
      setDescription('');
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPoint(null);
    refreshData();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('请输入取货点名称', 'warning');
      return;
    }

    const data = {
      name: name.trim(),
      address: address.trim(),
      description: description.trim(),
    };

    if (editingPoint) {
      await DAO.pickupPoints.update(editingPoint.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.pickupPoints.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    handleCloseForm();
  };

  const handleDelete = async (point) => {
    if (!confirm(`确定删除「${point.name}」？`)) return;
    await DAO.pickupPoints.delete(point.id);
    showToast('已删除', 'success');
    Haptics.success();
    refreshData();
  };

  const renderPoint = (point) => h('div', {
    key: point.id,
    onClick: () => { Haptics.light(); openForm(point); },
    style: {
      padding: 'var(--space-md) var(--space-lg)',
      marginBottom: 'var(--space-sm)',
      backgroundColor: 'var(--color-bg-card)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-1)',
      display: 'flex',
      alignItems: 'flex-start',
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
    }, '📍'),

    h('div', { style: { flex: 1, minWidth: 0 } },
      h('div', {
        style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }
      }, point.name),
      point.address && h('div', {
        style: {
          fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px',
          display: 'flex', alignItems: 'center', gap: '4px',
        }
      }, point.address),
      point.description && h('div', {
        style: {
          fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }
      }, point.description)
    ),

    h('button', {
      onClick: (e) => { e.stopPropagation(); handleDelete(point); },
      style: {
        width: '28px', height: '28px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0,
      }
    }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
  );

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '取货点', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); openForm(null); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    h('div', { className: 'scroll-container page' },
      points.length === 0
        ? h(EmptyState, { icon: '📍', title: '还没有取货点', subtitle: '点击右上角 + 添加' })
        : h('div', null, points.map(renderPoint))
    ),

    // 新增/编辑表单
    h(Sheet, {
      open: showForm,
      onClose: handleCloseForm,
      title: editingPoint ? '编辑取货点' : '新增取货点',
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

        h(Input, {
          label: '名称',
          value: name,
          onChange: setName,
          placeholder: '如：学校门口、地铁站A口',
          required: true,
        }),

        h(Input, {
          label: '地址',
          value: address,
          onChange: setAddress,
          placeholder: '详细地址',
        }),

        h(Input, {
          label: '描述',
          value: description,
          onChange: setDescription,
          placeholder: '如：停车方便、靠近路口等',
          multiline: true,
          rows: 2,
        }),

        h(Button, { fullWidth: true, onClick: handleSave }, editingPoint ? '保存' : '添加'),
      )
    )
  );
}

window.PickupPointsPage = PickupPointsPage;

})();