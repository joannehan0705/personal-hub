(function() {
/**
 * Personal Hub — Alex 记录表单（动态字段）
 * 支持：School, IEP, Hockey, 课外班, Activity, Reading, Medical
 * Hockey 和课外班支持 recurring（重复）设置
 */

const { createElement: h, useState, useEffect } = React;

function AlexForm({ open, onClose, record, category: initialCategory }) {
  const { showToast } = useApp();
  const [category, setCategory] = useState('school');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(DateUtils.today());
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  // Hockey 特有字段
  const [opponent, setOpponent] = useState('');
  const [score, setScore] = useState('');
  const [duration, setDuration] = useState('');

  // 课外班特有字段
  const [className, setClassName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [location, setLocation] = useState('');

  // Activity 特有字段
  const [activityType, setActivityType] = useState('');
  const [activityLocation, setActivityLocation] = useState('');

  // Recurring（Hockey 和课外班共有）
  const [recurring, setRecurring] = useState('none');
  const [weekday, setWeekday] = useState(1); // 默认周一
  const [recurringEndDate, setRecurringEndDate] = useState('');

  // Medical 特有字段
  const [diagnosis, setDiagnosis] = useState('');
  const [medication, setMedication] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Reading 特有字段
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [readingStatus, setReadingStatus] = useState('reading');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (open) {
      if (record) {
        setCategory(record.category || 'school');
        setTitle(record.title || '');
        setDate(record.date || DateUtils.today());
        setTime(record.time || '');
        setNotes(record.notes || '');
        setOpponent(record.opponent || '');
        setScore(record.score || '');
        setDuration(record.duration || '');
        setClassName(record.className || '');
        setTeacher(record.teacher || '');
        setLocation(record.location || '');
        setActivityType(record.activityType || '');
        setActivityLocation(record.activityLocation || '');
        setRecurring(record.recurring || 'none');
        setWeekday(record.weekday != null ? record.weekday : (record.date ? new Date(record.date + 'T00:00:00').getDay() : 1));
        setRecurringEndDate(record.recurringEndDate || '');
        setDiagnosis(record.diagnosis || '');
        setMedication(record.medication || '');
        setFollowUpDate(record.followUpDate || '');
        setBookTitle(record.bookTitle || '');
        setBookAuthor(record.bookAuthor || '');
        setReadingStatus(record.readingStatus || 'reading');
        setRating(record.rating || 0);
      } else {
        setCategory(initialCategory || 'school');
        setTitle('');
        setDate(DateUtils.today());
        setTime('');
        setNotes('');
        setOpponent(''); setScore(''); setDuration('');
        setClassName(''); setTeacher(''); setLocation('');
        setActivityType(''); setActivityLocation('');
        setRecurring('none'); setWeekday(1); setRecurringEndDate('');
        setDiagnosis(''); setMedication(''); setFollowUpDate('');
        setBookTitle(''); setBookAuthor(''); setReadingStatus('reading'); setRating(0);
      }
    }
  }, [open, record, initialCategory]);

  // 当前分类是否支持 recurring
  const supportsRecurring = APP_CONFIG.alexRecurringCategories.includes(category);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('请输入标题', 'warning');
      return;
    }

    const data = {
      category,
      title: title.trim(),
      date,
      time: time || null,
      notes: notes.trim(),
      // Hockey 特有
      ...(category === 'hockey' ? {
        opponent: opponent.trim(),
        score: score.trim(),
        duration: duration.trim(),
      } : {}),
      // 课外班特有
      ...(category === 'class' ? {
        className: className.trim(),
        teacher: teacher.trim(),
        location: location.trim(),
      } : {}),
      // Activity 特有
      ...(category === 'activity' ? {
        activityType: activityType.trim(),
        activityLocation: activityLocation.trim(),
      } : {}),
      // Recurring（Hockey 和课外班）
      ...(supportsRecurring ? {
        recurring,
        weekday: (recurring === 'weekly' || recurring === 'biweekly') ? weekday : null,
        recurringEndDate: recurringEndDate || null,
      } : {}),
      // Medical 特有
      ...(category === 'medical' ? {
        diagnosis: diagnosis.trim(),
        medication: medication.trim(),
        followUpDate: followUpDate || null,
      } : {}),
      // Reading 特有
      ...(category === 'reading' ? {
        bookTitle: bookTitle.trim(),
        bookAuthor: bookAuthor.trim(),
        readingStatus,
        rating,
      } : {}),
    };

    if (record) {
      await DAO.alex.update(record.id, data);
      showToast('已更新', 'success');
    } else {
      await DAO.alex.create(data);
      showToast('已添加', 'success');
    }
    Haptics.success();
    onClose();
  };

  const inputGap = { marginTop: 'var(--space-lg)' };

  return h(Sheet, { open, onClose, title: record ? '编辑记录' : '新增记录' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      // 分类选择
      h('div', null,
        h('label', {
          style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
        }, '分类'),
        h('div', {
          style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }
        },
          APP_CONFIG.alexCategories.map(cat =>
            h('button', {
              key: cat.key,
              onClick: () => { Haptics.selection(); setCategory(cat.key); },
              style: {
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: category === cat.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: category === cat.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, `${cat.icon} ${cat.label}`)
          )
        )
      ),

      h(Input, { label: '标题', value: title, onChange: setTitle, placeholder: '输入标题', required: true }),

      // 日期：仅在 non-recurring 或 monthly 时显示（weekly/biweekly 用星期选择器替代）
      (!supportsRecurring || recurring === 'none' || recurring === 'monthly') && h(Input, {
        label: '日期', value: date, onChange: setDate, type: 'date',
      }),

      h(Input, { label: '时间（可选）', value: time, onChange: setTime, type: 'time' }),

      // ===== Hockey 特有字段 =====
      category === 'hockey' && h('div', null,
        h(Input, { label: '对手', value: opponent, onChange: setOpponent, placeholder: '如：Falcons' }),
        h(Input, { label: '比分', value: score, onChange: setScore, placeholder: '如：3:2', style: inputGap }),
        h(Input, { label: '时长', value: duration, onChange: setDuration, placeholder: '如：1.5h', style: inputGap }),
      ),

      // ===== 课外班特有字段 =====
      category === 'class' && h('div', null,
        h(Input, { label: '课程名称', value: className, onChange: setClassName, placeholder: '如：数学课' }),
        h(Input, { label: '老师', value: teacher, onChange: setTeacher, placeholder: '老师姓名', style: inputGap }),
        h(Input, { label: '地点', value: location, onChange: setLocation, placeholder: '上课地点', style: inputGap }),
      ),

      // ===== Activity 特有字段 =====
      category === 'activity' && h('div', null,
        h(Input, { label: '活动类型', value: activityType, onChange: setActivityType, placeholder: '如：户外/艺术/社交' }),
        h(Input, { label: '地点', value: activityLocation, onChange: setActivityLocation, placeholder: '活动地点', style: inputGap }),
      ),

      // ===== Recurring 设置（Hockey 和课外班） =====
      supportsRecurring && h('div', {
        style: {
          backgroundColor: 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-lg)',
        }
      },
        h('div', {
          style: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }
        }, '🔁 重复设置'),
        // 频率选择
        h('div', {
          style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginBottom: recurring !== 'none' ? 'var(--space-md)' : '0' }
        },
          APP_CONFIG.recurringFrequencies.map(freq =>
            h('button', {
              key: freq.key,
              onClick: () => { Haptics.selection(); setRecurring(freq.key); },
              style: {
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: recurring === freq.key ? 'var(--color-accent)' : 'var(--color-bg-card)',
                color: recurring === freq.key ? '#FFFFFF' : 'var(--color-text-secondary)',
              }
            }, freq.label)
          )
        ),
        // 星期选择器（仅 weekly / biweekly）
        (recurring === 'weekly' || recurring === 'biweekly') && h('div', {
          style: { marginBottom: 'var(--space-md)' }
        },
          h('div', {
            style: { fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-xs)' }
          }, recurring === 'weekly' ? '每周' : '每两周', '哪一天'),
          h('div', {
            style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }
          },
            APP_CONFIG.weekdays.map(wd =>
              h('button', {
                key: wd.key,
                onClick: () => { Haptics.selection(); setWeekday(wd.key); },
                style: {
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: weekday === wd.key ? 'var(--color-accent)' : 'var(--color-bg-card)',
                  color: weekday === wd.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, wd.label)
            )
          )
        ),

        // 重复截止日期（daily 不需要）
        recurring !== 'none' && h('div', null,
          h('div', {
            style: { fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }
          }, '重复截止日期（可选，留空则持续到年底）'),
          h('input', {
            type: 'date',
            value: recurringEndDate,
            onChange: (e) => setRecurringEndDate(e.target.value),
            style: {
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              outline: 'none',
              backgroundColor: 'var(--color-bg-card)',
              fontSize: '16px',
              color: 'var(--color-text-primary)',
              boxSizing: 'border-box',
            }
          })
        )
      ),

      // ===== Medical 特有字段 =====
      category === 'medical' && h('div', null,
        h(Input, { label: '诊断', value: diagnosis, onChange: setDiagnosis, placeholder: '诊断信息' }),
        h(Input, { label: '用药', value: medication, onChange: setMedication, placeholder: '用药信息', style: inputGap }),
        h(Input, { label: '复诊日期', value: followUpDate, onChange: setFollowUpDate, type: 'date', style: inputGap }),
      ),

      // ===== Reading 特有字段 =====
      category === 'reading' && h('div', null,
        h(Input, { label: '书名', value: bookTitle, onChange: setBookTitle, placeholder: '书名' }),
        h(Input, { label: '作者', value: bookAuthor, onChange: setBookAuthor, placeholder: '作者', style: inputGap }),
        h('div', { style: inputGap },
          h('label', {
            style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
          }, '状态'),
          h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
            [
              { key: 'planned', label: '计划读' },
              { key: 'reading', label: '在读' },
              { key: 'completed', label: '已完成' },
            ].map(s =>
              h('button', {
                key: s.key,
                onClick: () => { Haptics.selection(); setReadingStatus(s.key); },
                style: {
                  flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                  fontSize: '14px', fontWeight: 500,
                  backgroundColor: readingStatus === s.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: readingStatus === s.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, s.label)
            )
          )
        ),
        h('div', { style: inputGap },
          h('label', {
            style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
          }, '评分'),
          h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
            [1, 2, 3, 4, 5].map(n =>
              h('button', {
                key: n,
                onClick: () => { Haptics.selection(); setRating(n); },
                style: {
                  fontSize: '28px',
                  backgroundColor: 'transparent',
                  color: n <= rating ? '#E8C547' : 'var(--color-border)',
                }
              }, '★')
            )
          )
        ),
      ),

      h(Input, { label: '备注', value: notes, onChange: setNotes, placeholder: '添加备注（可选）', multiline: true, rows: 2 }),

      h(Button, { fullWidth: true, onClick: handleSave }, record ? '保存' : '添加'),
    )
  );
}

window.AlexForm = AlexForm;

})();
