(function() {
/**
 * Personal Hub — 宠物页面
 */

const { createElement: h, useState, useEffect } = React;

function PetsPage() {
  const { dataVersion, refreshData, activePet, dispatch, ACTIONS, route } = useApp();
  const [activeType, setActiveType] = useState('medical');
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
  }, [activePet, activeType, dataVersion]);

  const loadRecords = async () => {
    const data = await DAO.pets.getByPetAndType(activePet, activeType);
    setRecords(data);
  };

  const handleDelete = async (id) => {
    await DAO.pets.delete(id);
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
      window.location.hash = '/pets';
    }
    refreshData();
  };

  const currentPet = APP_CONFIG.pets.find(p => p.key === activePet);
  const currentType = APP_CONFIG.petRecordTypes.find(t => t.key === activeType);

  const renderRecord = (record) => {
    const hasReminder = record.nextDate && DateUtils.daysFromToday(record.nextDate) <= 7;
    const isOverdue = record.nextDate && DateUtils.isPast(record.nextDate);
    const isRecurring = record.recurring && record.recurring !== 'none';

    // recurring 频率显示
    const freqLabel = isRecurring
      ? { daily: '每天', weekly: '每周', biweekly: '每两周', monthly: '每月' }[record.recurring]
      : null;
    const weekdayLabel = isRecurring && (record.recurring === 'weekly' || record.recurring === 'biweekly')
      ? APP_CONFIG.weekdays.find(w => w.key === record.weekday)?.label
      : null;

    return h('div', {
      key: record.id,
      onClick: () => handleEdit(record),
      style: {
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-1)',
        border: hasReminder ? '1px solid var(--color-today)' : '1px solid transparent',
      }
    },
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-md)',
        }
      },
        h('div', { style: { fontSize: '24px', flexShrink: 0, width: '32px', textAlign: 'center' } }, currentType.icon),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { style: { fontSize: '17px', color: 'var(--color-text-primary)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' } },
            h('span', null, record.title),
            isRecurring && h('span', {
              style: { fontSize: '11px', color: 'var(--color-accent)', backgroundColor: 'var(--color-bg-subtle)', padding: '1px 6px', borderRadius: 'var(--radius-pill)', flexShrink: 0 }
            }, `🔁 ${freqLabel}${weekdayLabel ? ' ' + weekdayLabel : ''}`)
          ),
          h('div', {
            style: { fontSize: '13px', color: 'var(--color-text-tertiary)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }
          },
            // recurring 记录不显示具体日期，显示频率
            isRecurring
              ? h('span', null, `${freqLabel}${weekdayLabel ? ' ' + weekdayLabel : ''}`)
              : (record.date && h('span', null, `${record.date.slice(0,4)}年${parseInt(record.date.slice(5,7))}月${parseInt(record.date.slice(8,10))}日`)),
            record.hospital && h('span', null, record.hospital),
            record.vaccineName && h('span', null, record.vaccineName),
            record.medName && h('span', null, record.medName),
            record.medDose && h('span', null, record.medDose),
            record.symptom && h('span', null, record.symptom),
          ),
          record.notes && h('div', {
            style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
          }, record.notes),
          // 下次提醒
          record.nextDate && h('div', {
            style: {
              marginTop: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: isOverdue ? 'var(--color-deadline)' : hasReminder ? 'var(--color-today)' : 'var(--color-bg-subtle)',
              color: (isOverdue || hasReminder) ? '#FFFFFF' : 'var(--color-text-secondary)',
            }
          },
            h(Icon, { name: 'bell', size: 12, color: (isOverdue || hasReminder) ? '#FFFFFF' : 'var(--color-text-tertiary)' }),
            `下次: ${record.nextDate.slice(0,4)}年${parseInt(record.nextDate.slice(5,7))}月${parseInt(record.nextDate.slice(8,10))}日${isOverdue ? ' (已过期)' : ''}`
          ),
        ),
        h('button', {
          onClick: (e) => { e.stopPropagation(); handleDelete(record.id); },
          style: {
            width: '28px', height: '28px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'var(--color-bg-subtle)', flexShrink: 0,
          }
        }, h(Icon, { name: 'trash', size: 14, color: 'var(--color-text-tertiary)' }))
      )
    )
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, {
      title: '宠物', showBack: true,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); setEditingRecord(null); setShowForm(true); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    // 宠物切换
    h('div', {
      style: {
        display: 'flex',
        gap: 'var(--space-sm)',
        padding: '0 var(--space-lg) var(--space-sm)',
      }
    },
      APP_CONFIG.pets.map(pet =>
        h('button', {
          key: pet.key,
          onClick: () => { Haptics.selection(); dispatch({ type: ACTIONS.SET_ACTIVE_PET, payload: pet.key }); },
          style: {
            flex: 1,
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: activePet === pet.key ? 'var(--color-accent)' : 'var(--color-bg-card)',
            color: activePet === pet.key ? '#FFFFFF' : 'var(--color-text-secondary)',
            fontSize: '15px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            boxShadow: 'var(--shadow-1)',
            transition: 'background-color 0.2s, color 0.2s',
          }
        }, `${pet.icon} ${pet.label}`, h('span', { style: { fontSize: '12px', fontWeight: 400, opacity: 0.7 } }, pet.type))
      )
    ),

    // 记录类型 Tab
    h('div', {
      style: {
        display: 'flex',
        gap: 'var(--space-xs)',
        padding: '0 var(--space-lg) var(--space-sm)',
        overflowX: 'auto',
      }
    },
      APP_CONFIG.petRecordTypes.map(type =>
        h('button', {
          key: type.key,
          onClick: () => { Haptics.selection(); setActiveType(type.key); },
          style: {
            padding: '6px 12px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            backgroundColor: activeType === type.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
            color: activeType === type.key ? '#FFFFFF' : 'var(--color-text-secondary)',
          }
        }, `${type.icon} ${type.label}`)
      )
    ),

    h('div', { className: 'scroll-container page' },
      records.length === 0
        ? h(EmptyState, { icon: currentType.icon, title: `${currentPet.label}的${currentType.label}记录为空`, subtitle: '点击右上角 + 添加' })
        : h('div', null, records.map(renderRecord))
    ),

    h(PetForm, {
      open: showForm,
      onClose: handleCloseForm,
      record: editingRecord,
      petName: activePet,
      recordType: activeType,
    })
  );
}

window.PetsPage = PetsPage;

})();
