(function() {
/**
 * Personal Hub — 宠物记录表单（动态字段）
 */

const { createElement: h, useState, useEffect } = React;

function PetForm({ open, onClose, record, petName: initialPet, recordType: initialType }) {
  const { showToast } = useApp();
  const [petName, setPetName] = useState('cookie');
  const [type, setType] = useState('medical');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(DateUtils.today());
  const [time, setTime] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  // 特有字段
  const [hospital, setHospital] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medication, setMedication] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [location, setLocation] = useState('');
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [foodName, setFoodName] = useState('');
  const [foodBrand, setFoodBrand] = useState('');
  const [amount, setAmount] = useState('');
  const [symptom, setSymptom] = useState('');
  const [treatment, setTreatment] = useState('');
  const [needVet, setNeedVet] = useState(false);

  // 药品特有字段
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [medDuration, setMedDuration] = useState('');

  // Recurring
  const [recurring, setRecurring] = useState('none');
  const [weekday, setWeekday] = useState(1);
  const [recurringEndDate, setRecurringEndDate] = useState('');

  useEffect(() => {
    if (open) {
      if (record) {
        setPetName(record.petName || 'cookie');
        setType(record.type || 'medical');
        setTitle(record.title || '');
        setDate(record.date || DateUtils.today());
        setTime(record.time || '');
        setCost(record.cost ? String(record.cost) : '');
        setNotes(record.notes || '');
        setHospital(record.hospital || '');
        setDiagnosis(record.diagnosis || '');
        setMedication(record.medication || '');
        setVaccineName(record.vaccineName || '');
        setNextDate(record.nextDate || '');
        setLocation(record.location || '');
        setItemName(record.itemName || '');
        setBrand(record.brand || '');
        setFoodName(record.foodName || '');
        setFoodBrand(record.foodBrand || '');
        setAmount(record.amount || '');
        setSymptom(record.symptom || '');
        setTreatment(record.treatment || '');
        setNeedVet(record.needVet || false);
        setMedName(record.medName || '');
        setMedDose(record.medDose || '');
        setMedFrequency(record.medFrequency || '');
        setMedDuration(record.medDuration || '');
        setRecurring(record.recurring || 'none');
        setWeekday(record.weekday != null ? record.weekday : (record.date ? new Date(record.date + 'T00:00:00').getDay() : 1));
        setRecurringEndDate(record.recurringEndDate || '');
      } else {
        setPetName(initialPet || 'cookie');
        setType(initialType || 'medical');
        setTitle(''); setDate(DateUtils.today()); setTime(''); setCost(''); setNotes('');
        setHospital(''); setDiagnosis(''); setMedication('');
        setVaccineName(''); setNextDate(''); setLocation('');
        setItemName(''); setBrand('');
        setFoodName(''); setFoodBrand(''); setAmount('');
        setSymptom(''); setTreatment(''); setNeedVet(false);
        setMedName(''); setMedDose(''); setMedFrequency(''); setMedDuration('');
        setRecurring('none');
        setWeekday(initialType ? (new Date().getDay() || 1) : 1);
        setRecurringEndDate('');
      }
    }
  }, [open, record, initialPet, initialType]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('请输入标题', 'warning');
      return;
    }

    const isRecurringType = APP_CONFIG.petRecurringTypes.includes(type);

    const data = {
      petName,
      type,
      title: title.trim(),
      date,
      time: time || null,
      cost: parseFloat(cost) || 0,
      notes: notes.trim(),
      ...(type === 'medical' ? {
        hospital: hospital.trim(),
        diagnosis: diagnosis.trim(),
        medication: medication.trim(),
      } : {}),
      ...(type === 'vaccine' ? {
        vaccineName: vaccineName.trim(),
        nextDate: nextDate || null,
      } : {}),
      ...(type === 'bath' ? {
        location: location.trim(),
        nextDate: nextDate || null,
      } : {}),
      ...(type === 'medication' ? {
        medName: medName.trim(),
        medDose: medDose.trim(),
        medFrequency: medFrequency.trim(),
        medDuration: medDuration.trim(),
      } : {}),
      ...(type === 'supplies' ? {
        itemName: itemName.trim(),
        brand: brand.trim(),
      } : {}),
      ...(type === 'diet' ? {
        foodName: foodName.trim(),
        foodBrand: foodBrand.trim(),
        amount: amount.trim(),
      } : {}),
      ...(type === 'observation' ? {
        symptom: symptom.trim(),
        treatment: treatment.trim(),
        needVet,
      } : {}),
      // Recurring
      ...(isRecurringType ? {
        recurring,
        weekday: recurring === 'weekly' || recurring === 'biweekly' ? weekday : undefined,
        recurringEndDate: recurringEndDate || null,
      } : {}),
    };

    if (record) {
      await DAO.pets.update(record.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.pets.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    onClose();
  };

  const isRecurringType = APP_CONFIG.petRecurringTypes.includes(type);
  const showRecurring = isRecurringType;
  const showWeekday = recurring === 'weekly' || recurring === 'biweekly';
  const showDate = recurring === 'none' || recurring === 'monthly' || recurring === 'daily';

  const inputStyle = { marginTop: 'var(--space-lg)' };

  return h(Sheet, { open, onClose, title: record ? '编辑记录' : '新增记录' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      // 宠物选择
      h('div', null,
        h('label', { style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' } }, '宠物'),
        h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
          APP_CONFIG.pets.map(pet =>
            h('button', {
              key: pet.key,
              onClick: () => { Haptics.selection(); setPetName(pet.key); },
              style: {
                flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                fontSize: '15px', fontWeight: 500,
                backgroundColor: petName === pet.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: petName === pet.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, `${pet.icon} ${pet.label}`)
          )
        )
      ),

      // 记录类型
      h('div', null,
        h('label', { style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' } }, '类型'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
          APP_CONFIG.petRecordTypes.map(t =>
            h('button', {
              key: t.key,
              onClick: () => { Haptics.selection(); setType(t.key); },
              style: {
                padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
                backgroundColor: type === t.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: type === t.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, `${t.icon} ${t.label}`)
          )
        )
      ),

      h(Input, { label: '标题', value: title, onChange: setTitle, placeholder: '如：年度体检', required: true }),

      // Recurring 设置（药品和洗澡支持）
      showRecurring && h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '重复'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
          APP_CONFIG.recurringFrequencies.map(opt =>
            h('button', {
              key: opt.key,
              onClick: () => { Haptics.selection(); setRecurring(opt.key); },
              style: {
                padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
                backgroundColor: recurring === opt.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: recurring === opt.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, opt.label)
          )
        )
      ),

      // weekday 选择（weekly / biweekly 时显示）
      showWeekday && h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '每周几'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
          APP_CONFIG.weekdays.map(w =>
            h('button', {
              key: w.key,
              onClick: () => { Haptics.selection(); setWeekday(w.key); },
              style: {
                padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
                backgroundColor: weekday === w.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: weekday === w.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, w.label)
          )
        )
      ),

      // 日期（weekly/biweekly 时不显示，用 weekday 代替）
      showDate && h(Input, { label: '日期', value: date, onChange: setDate, type: 'date' }),

      // 时间（可选）
      showDate && h(Input, { label: '时间（可选）', value: time, onChange: setTime, type: 'time' }),

      // recurring 结束日期
      showRecurring && recurring !== 'none' && h(Input, {
        label: '结束日期（可选）',
        value: recurringEndDate,
        onChange: setRecurringEndDate,
        type: 'date',
        placeholder: '不选则持续',
      }),

      // Medical 特有
      type === 'medical' && h('div', null,
        h(Input, { label: '医院', value: hospital, onChange: setHospital, placeholder: '医院名称' }),
        h(Input, { label: '诊断', value: diagnosis, onChange: setDiagnosis, placeholder: '诊断信息', style: inputStyle }),
        h(Input, { label: '用药', value: medication, onChange: setMedication, placeholder: '用药信息', style: inputStyle }),
      ),

      // Vaccine 特有
      type === 'vaccine' && h('div', null,
        h(Input, { label: '疫苗名称', value: vaccineName, onChange: setVaccineName, placeholder: '如：狂犬疫苗' }),
        h(Input, { label: '下次接种日期', value: nextDate, onChange: setNextDate, type: 'date', style: inputStyle }),
      ),

      // Bath 特有
      type === 'bath' && h('div', null,
        h(Input, { label: '洗澡地点', value: location, onChange: setLocation, placeholder: '如：PetSmart' }),
        h(Input, { label: '下次预约', value: nextDate, onChange: setNextDate, type: 'date', style: inputStyle }),
      ),

      // Medication（药品）特有
      type === 'medication' && h('div', null,
        h(Input, { label: '药品名称', value: medName, onChange: setMedName, placeholder: '如：Apoquel' }),
        h(Input, { label: '剂量', value: medDose, onChange: setMedDose, placeholder: '如：16mg', style: inputStyle }),
        h(Input, { label: '用药频率', value: medFrequency, onChange: setMedFrequency, placeholder: '如：每日两次', style: inputStyle }),
        h(Input, { label: '持续时长', value: medDuration, onChange: setMedDuration, placeholder: '如：14天', style: inputStyle }),
      ),

      // Supplies 特有
      type === 'supplies' && h('div', null,
        h(Input, { label: '物品名', value: itemName, onChange: setItemName, placeholder: '物品名称' }),
        h(Input, { label: '品牌', value: brand, onChange: setBrand, placeholder: '品牌', style: inputStyle }),
      ),

      // Diet 特有
      type === 'diet' && h('div', null,
        h(Input, { label: '食物', value: foodName, onChange: setFoodName, placeholder: '食物名称' }),
        h(Input, { label: '品牌', value: foodBrand, onChange: setFoodBrand, placeholder: '品牌', style: inputStyle }),
        h(Input, { label: '用量', value: amount, onChange: setAmount, placeholder: '如：200g/天', style: inputStyle }),
      ),

      // Observation 特有
      type === 'observation' && h('div', null,
        h(Input, { label: '症状', value: symptom, onChange: setSymptom, placeholder: '观察到的症状', multiline: true, rows: 2 }),
        h(Input, { label: '处理方式', value: treatment, onChange: setTreatment, placeholder: '已采取的处理', multiline: true, rows: 2, style: inputStyle }),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', padding: '0 var(--space-xs)' } },
          h(Checkbox, { checked: needVet, onChange: setNeedVet }),
          h('span', { style: { fontSize: '15px', color: 'var(--color-text-secondary)' } }, '需要就医'),
        )
      ),

      h(Input, { label: '费用', value: cost, onChange: setCost, type: 'number', placeholder: '0' }),
      h(Input, { label: '备注', value: notes, onChange: setNotes, placeholder: '添加备注（可选）', multiline: true, rows: 2 }),

      h(Button, { fullWidth: true, onClick: handleSave }, record ? '保存' : '添加'),
    )
  );
}

window.PetForm = PetForm;

})();
