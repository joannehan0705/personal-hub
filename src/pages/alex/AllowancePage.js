(function() {
/**
 * Personal Hub — Alex 零用钱页面（V2 优化版）
 * 月份切换 + 余额逻辑 + 储蓄目标自动计算 + 联动记账
 */

const { createElement: h, useState, useEffect } = React;

function AllowancePage() {
  const app = useApp();
  const { dataVersion, refreshData, showToast, dispatch, ACTIONS } = app;
  // 兼容旧版 AppContext：如果没有 allowanceMonth，使用当前月份
  const allowanceMonth = app.allowanceMonth || DateUtils.currentMonth();
  const [balance, setBalance] = useState(0);
  const [monthSummary, setMonthSummary] = useState({ income: 0, expense: 0 });
  const [goals, setGoals] = useState([]);
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('transaction'); // 'transaction' | 'goal'
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);

  // 记录表单状态
  const [txType, setTxType] = useState('income');
  const [amount, setAmount] = useState('');
  const [txDate, setTxDate] = useState(DateUtils.today());
  const [txCategory, setTxCategory] = useState('');
  const [txNotes, setTxNotes] = useState('');
  // 收入：分配到目标
  const [allocateToGoal, setAllocateToGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  // 支出：资金来源
  const [expenseFromGoal, setExpenseFromGoal] = useState(false);

  // 目标表单状态
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalStatus, setGoalStatus] = useState('in_progress');
  const [goalCreatedDate, setGoalCreatedDate] = useState('');
  const [goalCompletedDate, setGoalCompletedDate] = useState('');

  // 视图模式：'main' | 'goalDetail' | 'allocation'
  const [viewMode, setViewMode] = useState('main');
  // 当前选中的目标（详情/分配视图使用）
  const [selectedGoal, setSelectedGoal] = useState(null);
  // 分配记录列表（详情视图）
  const [allocationRecords, setAllocationRecords] = useState([]);
  // 可分配收入列表（分配视图）
  const [allocatableIncome, setAllocatableIncome] = useState([]);
  // 每条收入的分配输入 { [recordId]: string }
  const [allocationInputs, setAllocationInputs] = useState({});
  // 完成庆祝动画
  const [showCelebration, setShowCelebration] = useState(false);
  // 创建目标后的分配提示
  const [newlyCreatedGoal, setNewlyCreatedGoal] = useState(null);

  const isCurrentMonth = allowanceMonth === DateUtils.currentMonth();

  useEffect(() => {
    loadData();
  }, [dataVersion, allowanceMonth]);

  const loadData = async () => {
    const [, monthEnd] = DateUtils.monthRange(allowanceMonth);
    const [summary, monthRecords, activeGoals] = await Promise.all([
      DAO.allowance.getMonthlySummary(allowanceMonth),
      DAO.allowance.getByMonth(allowanceMonth),
      DAO.allowanceGoals.getActiveForMonth(allowanceMonth),
    ]);

    const bal = isCurrentMonth
      ? await DAO.allowance.getBalance()
      : await DAO.allowance.getBalanceUpTo(monthEnd);

    // 为每个目标计算已存金额
    const goalsWithProgress = await Promise.all(
      activeGoals.map(async g => {
        const saved = await DAO.allowanceGoals.getGoalProgress(g.id);
        return { ...g, saved };
      })
    );

    setBalance(bal);
    setMonthSummary(summary);
    setRecords(monthRecords);
    setGoals(goalsWithProgress);
  };

  const handlePrevMonth = () => {
    Haptics.light();
    dispatch({ type: ACTIONS.SET_ALLOWANCE_MONTH, payload: DateUtils.prevMonth(allowanceMonth) });
  };
  const handleNextMonth = () => {
    Haptics.light();
    dispatch({ type: ACTIONS.SET_ALLOWANCE_MONTH, payload: DateUtils.nextMonth(allowanceMonth) });
  };

  // ===== 表单打开 =====
  const openTransactionForm = (type, record) => {
    setFormType('transaction');
    if (record) {
      setEditingRecord(record);
      setTxType(record.type || type);
      setAmount(record.amount != null ? String(record.amount) : '');
      setTxDate(record.date || DateUtils.today());
      setTxCategory(record.category || '');
      setTxNotes(record.notes || '');
      setAllocateToGoal(!!record.goalId);
      setSelectedGoalId(record.goalId || '');
      setAllocationAmount(record.allocationAmount != null ? String(record.allocationAmount) : '');
      setExpenseFromGoal(!!record.expenseFromGoal);
    } else {
      setEditingRecord(null);
      setTxType(type);
      setAmount('');
      setTxDate(DateUtils.today());
      setTxCategory('');
      setTxNotes('');
      setAllocateToGoal(false);
      setSelectedGoalId('');
      setAllocationAmount('');
      setExpenseFromGoal(false);
    }
    setShowForm(true);
  };

  const openGoalForm = (goal) => {
    setFormType('goal');
    if (goal) {
      setEditingGoal(goal);
      setGoalName(goal.name || '');
      setGoalTarget(goal.target != null ? String(goal.target) : '');
      setGoalStatus(goal.status || 'in_progress');
      // 创建日期：优先用手动填的，否则从 createdAt 提取
      setGoalCreatedDate(goal.createdDate || (goal.createdAt ? goal.createdAt.slice(0, 10) : ''));
      // 完成日期：优先用手动填的，否则从 completedAt 提取
      setGoalCompletedDate(goal.completedDate || (goal.completedAt ? goal.completedAt.slice(0, 10) : ''));
    } else {
      setEditingGoal(null);
      setGoalName('');
      setGoalTarget('');
      setGoalStatus('in_progress');
      setGoalCreatedDate(DateUtils.today()); // 默认今天
      setGoalCompletedDate('');
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    setEditingGoal(null);
    refreshData();
  };

  // ===== 保存记录 =====
  const handleSaveTransaction = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast('请输入有效金额', 'warning');
      return;
    }
    const categories = txType === 'income'
      ? APP_CONFIG.allowanceIncomeCategories
      : APP_CONFIG.allowanceExpenseCategories;
    if (!txCategory) {
      showToast('请选择分类', 'warning');
      return;
    }

    const data = {
      type: txType,
      amount: amt,
      date: txDate,
      category: txCategory,
      notes: txNotes.trim(),
    };

    // 收入：分配到目标
    if (txType === 'income' && allocateToGoal && selectedGoalId) {
      data.goalId = selectedGoalId;
      data.allocationAmount = allocationAmount ? parseFloat(allocationAmount) : amt;
    }

    // 支出：资金来源为目标
    if (txType === 'expense' && expenseFromGoal && selectedGoalId) {
      data.expenseFromGoal = selectedGoalId;
    }

    if (editingRecord) {
      // 编辑：更新 allowance 记录
      await DAO.allowance.update(editingRecord.id, data);
      // 如果是支出且有关联的 transaction，也更新
      if (editingRecord.type === 'expense' && editingRecord.syncedTransactionId) {
        await DAO.transactions.update(editingRecord.syncedTransactionId, {
          amount: amt,
          date: txDate,
          notes: txNotes.trim() || (categories.find(c => c.key === txCategory)?.label || ''),
        });
      }
      // 编辑收入分配后，也检查目标是否达标
      if (txType === 'income' && data.goalId) {
        await checkAndAutoCompleteGoal(data.goalId, txDate);
      }
      showToast('已更新', 'success');
    } else {
      // 新建
      const created = await DAO.allowance.create(data);
      // 如果是支出，同步到 transactions
      if (txType === 'expense') {
        const catLabel = categories.find(c => c.key === txCategory)?.label || txCategory;
        const txRecord = await DAO.transactions.create({
          type: 'expense',
          amount: amt,
          category: 'alex',
          date: txDate,
          notes: txNotes.trim() || catLabel,
          scope: 'personal',
          recordType: 'normal',
        });
        // 保存关联 ID
        if (txRecord && txRecord.id) {
          await DAO.allowance.update(created.id, { syncedTransactionId: txRecord.id });
        }
      }
      // 收入分配到目标后，检查是否达标
      if (txType === 'income' && data.goalId) {
        await checkAndAutoCompleteGoal(data.goalId, txDate);
      }
      showToast(txType === 'income' ? '收入已记录' : '支出已记录', 'success');
    }
    Haptics.success();
    handleCloseForm();
  };

  // ===== 检查储蓄目标是否已达标，自动标记完成 =====
  // completionDate: 让目标达标的那笔收入的日期
  const checkAndAutoCompleteGoal = async (goalId, completionDate) => {
    if (!goalId) return;
    const goal = await DAO.allowanceGoals.getById(goalId);
    if (!goal || goal.status !== 'in_progress') return;
    const saved = await DAO.allowanceGoals.getGoalProgress(goalId);
    if (saved >= (goal.target || 0) && goal.target > 0) {
      await DAO.allowanceGoals.update(goalId, {
        status: 'completed',
        completedDate: completionDate || DateUtils.today(),
        completedAt: new Date().toISOString(),
      });
      showToast(`🎉 储蓄目标「${goal.name}」已达标！`, 'success');
      // 触发庆祝动画
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      Haptics.success();
    }
  };

  // ===== 删除记录 =====
  const handleDeleteTransaction = async (record) => {
    if (!confirm('确定删除此记录？')) return;
    await DAO.allowance.delete(record.id);
    // 删除关联的 transaction
    if (record.syncedTransactionId) {
      try { await DAO.transactions.delete(record.syncedTransactionId); } catch(e) {}
    }
    showToast('已删除', 'success');
    Haptics.success();
    refreshData();
  };

  // ===== 保存目标 =====
  const handleSaveGoal = async () => {
    if (!goalName.trim()) {
      showToast('请输入目标名称', 'warning');
      return;
    }
    const target = parseFloat(goalTarget) || 0;
    if (target <= 0) {
      showToast('请输入目标金额', 'warning');
      return;
    }

    const data = {
      name: goalName.trim(),
      target,
      status: goalStatus,
      createdDate: goalCreatedDate || null,
    };

    // 完成日期：手动填了就用手动的，否则状态切换时自动记录
    if (goalStatus === 'completed') {
      if (goalCompletedDate) {
        data.completedDate = goalCompletedDate;
      } else if (editingGoal && editingGoal.status !== 'completed') {
        data.completedDate = DateUtils.today();
        setGoalCompletedDate(DateUtils.today());
      } else if (editingGoal && editingGoal.completedDate) {
        data.completedDate = editingGoal.completedDate;
      }
    } else {
      data.completedDate = null;
      data.completedAt = null;
    }

    // 取消日期
    if (goalStatus === 'cancelled' && editingGoal && editingGoal.status !== 'cancelled') {
      data.cancelledAt = new Date().toISOString();
    }

    if (editingGoal) {
      await DAO.allowanceGoals.update(editingGoal.id, data);
      showToast('目标已更新', 'success');
      Haptics.success();
      handleCloseForm();
    } else {
      const created = await DAO.allowanceGoals.create(data);
      showToast('目标已创建', 'success');
      Haptics.success();
      handleCloseForm();
      // 创建后检查是否有可分配收入，提示用户
      const allocatable = await DAO.allowance.getAllocatableIncome(created.id);
      if (allocatable.length > 0) {
        setTimeout(() => {
          setNewlyCreatedGoal(created);
        }, 300);
      }
    }
  };

  const handleDeleteGoal = async (goal) => {
    if (!confirm(`确定删除「${goal.name}」？\n关联的收入分配和支出记录将被取消关联，资金将回到可用余额。`)) return;
    // Step 1: 取消所有关联记录的分配
    const unallocatedCount = await DAO.allowanceGoals.unallocateGoal(goal.id);
    // Step 2: 删除目标
    await DAO.allowanceGoals.delete(goal.id);
    // Step 3: 如果正在查看该目标详情，返回主视图
    if (selectedGoal && selectedGoal.id === goal.id) {
      setViewMode('main');
      setSelectedGoal(null);
    }
    showToast(`已删除，${unallocatedCount} 条记录已取消关联`, 'success');
    Haptics.success();
    refreshData();
  };

  // ===== 目标详情 / 分配视图导航 =====
  const openGoalDetail = async (goal) => {
    setSelectedGoal(goal);
    setViewMode('goalDetail');
    const records = await DAO.allowanceGoals.getAllocationRecords(goal.id);
    setAllocationRecords(records);
  };

  const openAllocationView = async (goal) => {
    setSelectedGoal(goal);
    setViewMode('allocation');
    setAllocationInputs({});
    const income = await DAO.allowance.getAllocatableIncome(goal.id);
    setAllocatableIncome(income);
  };

  const handleBackToMain = () => {
    setViewMode('main');
    setSelectedGoal(null);
    setAllocationRecords([]);
    setAllocatableIncome([]);
    setAllocationInputs({});
    refreshData();
  };

  const handleAllocateIncome = async (recordId, goalId, amountStr) => {
    const amt = parseFloat(amountStr);
    if (!amt || amt <= 0) {
      showToast('请输入有效金额', 'warning');
      return;
    }
    const record = allocatableIncome.find(r => r.id === recordId);
    if (amt > record.remainingAllocatable) {
      showToast('分配金额不能超过可分配余额', 'warning');
      return;
    }
    await DAO.allowance.allocateToGoal(recordId, goalId, amt);
    Haptics.success();
    showToast('已分配', 'success');
    // 刷新可分配收入列表
    const income = await DAO.allowance.getAllocatableIncome(goalId);
    setAllocatableIncome(income);
    setAllocationInputs({});
    // 检查目标是否达标
    await checkAndAutoCompleteGoal(goalId, DateUtils.today());
    // 刷新当前目标的进度
    const updatedGoal = await DAO.allowanceGoals.getById(goalId);
    const saved = await DAO.allowanceGoals.getGoalProgress(goalId);
    setSelectedGoal({ ...updatedGoal, saved });
  };

  const handleUnallocateRecord = async (recordId, goalId) => {
    await DAO.allowance.unallocateRecord(recordId);
    Haptics.light();
    showToast('已取消分配', 'success');
    // 刷新分配记录
    const records = await DAO.allowanceGoals.getAllocationRecords(goalId);
    setAllocationRecords(records);
    // 刷新目标进度
    const updatedGoal = await DAO.allowanceGoals.getById(goalId);
    const saved = await DAO.allowanceGoals.getGoalProgress(goalId);
    setSelectedGoal({ ...updatedGoal, saved });
  };

  // ===== 辅助函数 =====
  const getCategoryInfo = (type, key) => {
    const cats = type === 'income'
      ? APP_CONFIG.allowanceIncomeCategories
      : APP_CONFIG.allowanceExpenseCategories;
    return cats.find(c => c.key === key) || { label: key, icon: '✨' };
  };

  const allCategories = txType === 'income'
    ? APP_CONFIG.allowanceIncomeCategories
    : APP_CONFIG.allowanceExpenseCategories;

  // ===== 渲染 =====
  const renderSummary = () => h('div', {
    style: {
      backgroundColor: 'var(--color-bg-card)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      boxShadow: 'var(--shadow-1)',
      marginBottom: 'var(--space-md)',
    }
  },
    h('div', { style: { textAlign: 'center', marginBottom: 'var(--space-md)' } },
      h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } },
        isCurrentMonth ? '当前余额' : '月末余额'
      ),
      h('div', {
        style: { fontSize: '32px', fontWeight: 700, color: 'var(--color-accent)' },
        className: 'numeric'
      }, FormatUtils.money(balance))
    ),
    h('div', {
      style: {
        display: 'flex',
        borderTop: '1px solid var(--color-border-light)',
        paddingTop: 'var(--space-md)',
      }
    },
      h('div', { style: { flex: 1, textAlign: 'center' } },
        h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } }, '本月收入'),
        h('div', {
          style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-complete)' },
          className: 'numeric'
        }, FormatUtils.money(monthSummary.income))
      ),
      h('div', { style: { width: '1px', backgroundColor: 'var(--color-border-light)' } }),
      h('div', { style: { flex: 1, textAlign: 'center' } },
        h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } }, '本月支出'),
        h('div', {
          style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-deadline)' },
          className: 'numeric'
        }, FormatUtils.money(monthSummary.expense))
      )
    )
  );

  const renderGoal = (goal) => {
    const saved = goal.saved || 0;
    const target = goal.target || 0;
    const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    const remaining = Math.max(0, target - saved);
    const statusLabels = {
      in_progress: { label: '进行中', color: 'var(--color-accent)' },
      completed: { label: '已完成', color: 'var(--color-complete)' },
      cancelled: { label: '已取消', color: 'var(--color-text-tertiary)' },
    };
    const statusInfo = statusLabels[goal.status] || statusLabels.in_progress;
    const isCompleted = goal.status === 'completed';

    return h('div', {
      key: goal.id,
      onClick: () => { Haptics.light(); openGoalDetail(goal); },
      style: {
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-md)',
        marginBottom: 'var(--space-sm)',
        boxShadow: 'var(--shadow-1)',
        cursor: 'pointer',
      }
    },
      // 头部：名称 + 状态标签 + 编辑/删除按钮
      h('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }
      },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' } },
          h('span', { style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' } }, goal.name),
          h('span', {
            style: {
              fontSize: '11px', fontWeight: 500,
              backgroundColor: statusInfo.color + '20',
              color: statusInfo.color,
              padding: '2px 8px', borderRadius: 'var(--radius-xs)',
            }
          }, statusInfo.label)
        ),
        h('div', { style: { display: 'flex', gap: '4px' } },
          h('button', {
            onClick: (e) => { e.stopPropagation(); openGoalForm(goal); },
            style: {
              width: '24px', height: '24px', borderRadius: '50%',
              backgroundColor: 'var(--color-bg-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }
          }, h(Icon, { name: 'edit', size: 12, color: 'var(--color-text-tertiary)' })),
          h('button', {
            onClick: (e) => { e.stopPropagation(); handleDeleteGoal(goal); },
            style: {
              width: '24px', height: '24px', borderRadius: '50%',
              backgroundColor: 'var(--color-bg-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }
          }, h(Icon, { name: 'trash', size: 12, color: 'var(--color-text-tertiary)' }))
        )
      ),
      // 进度条
      h('div', {
        style: {
          height: '8px',
          backgroundColor: 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          marginBottom: '6px',
        }
      },
        h('div', {
          style: {
            height: '100%',
            width: percent + '%',
            backgroundColor: percent >= 100 ? 'var(--color-complete)' : 'var(--color-accent)',
            borderRadius: 'var(--radius-pill)',
            transition: 'width 0.3s',
          }
        })
      ),
      // 统计行
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: 'var(--color-text-tertiary)',
          marginBottom: '8px',
        }
      },
        h('span', { className: 'numeric' }, '已存 ' + FormatUtils.money(saved)),
        h('span', null, percent + '%'),
        h('span', { className: 'numeric' }, '剩余 ' + FormatUtils.money(remaining))
      ),
      // 操作按钮（韩式简约：subtle pill buttons）
      h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
        !isCompleted && h('button', {
          onClick: (e) => { e.stopPropagation(); Haptics.light(); openAllocationView(goal); },
          style: {
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            fontSize: '13px', fontWeight: 500,
            backgroundColor: 'var(--color-accent-light)',
            color: 'var(--color-accent)',
          }
        }, '💰 分配'),
        h('button', {
          onClick: (e) => { e.stopPropagation(); Haptics.light(); openGoalDetail(goal); },
          style: {
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            fontSize: '13px', fontWeight: 500,
            backgroundColor: 'var(--color-bg-subtle)',
            color: 'var(--color-text-secondary)',
          }
        }, '查看详情')
      )
    );
  };

  const renderRecord = (record) => {
    const cat = getCategoryInfo(record.type, record.category);
    const isIncome = record.type === 'income';
    return h('div', {
      key: record.id,
      onClick: () => { Haptics.light(); openTransactionForm(record.type, record); },
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border-light)',
        cursor: 'pointer',
      }
    },
      h('div', {
        style: {
          width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0,
        }
      }, cat.icon),
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', {
          style: { fontSize: '15px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
        }, record.notes || cat.label),
        h('div', {
          style: { fontSize: '12px', color: 'var(--color-text-tertiary)' }
        }, DateUtils.friendlyDate(record.date), ' · ', cat.label)
      ),
      h('div', {
        style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }
      },
        h('span', {
          style: {
            fontSize: '16px', fontWeight: 600,
            color: isIncome ? 'var(--color-complete)' : 'var(--color-text-primary)',
          },
          className: 'numeric'
        }, (isIncome ? '+' : '-') + FormatUtils.money(record.amount)),
        h('button', {
          onClick: (e) => { e.stopPropagation(); handleDeleteTransaction(record); },
          style: {
            width: '24px', height: '24px', borderRadius: '50%',
            backgroundColor: 'var(--color-bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }
        }, h(Icon, { name: 'trash', size: 12, color: 'var(--color-text-tertiary)' }))
      )
    );
  };

  // ===== 庆祝动画 =====
  const renderCelebration = () => {
    if (!showCelebration) return null;
    const emojis = ['🎉', '🎊', '✨', '⭐', '🌟', '💫'];
    const pieces = Array.from({ length: 18 }, (_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const duration = 2 + Math.random() * 1;
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const isSparkle = i % 3 === 0;
      return h('span', {
        key: i,
        className: isSparkle ? 'celebration-sparkle' : 'celebration-emoji',
        style: {
          left: left + '%',
          top: isSparkle ? (20 + Math.random() * 60) + '%' : '-5%',
          animationDelay: delay + 's',
          animationDuration: duration + 's',
        }
      }, emoji);
    });
    return h('div', { className: 'celebration-overlay' }, pieces);
  };

  // ===== 创建后提示 =====
  const renderPostCreationPrompt = () => h(ConfirmDialog, {
    open: !!newlyCreatedGoal,
    title: '分配收入',
    message: '是否现在将已有收入分配到这个目标？',
    confirmText: '去分配',
    cancelText: '稍后',
    onConfirm: () => {
      const goal = newlyCreatedGoal;
      setNewlyCreatedGoal(null);
      openAllocationView(goal);
    },
    onCancel: () => setNewlyCreatedGoal(null),
  });

  // ===== 目标详情视图 =====
  const renderGoalDetail = () => {
    if (!selectedGoal) return null;
    const saved = selectedGoal.saved || 0;
    const target = selectedGoal.target || 0;
    const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    const remaining = Math.max(0, target - saved);
    const isCompleted = selectedGoal.status === 'completed';

    return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
      h(NavBar, {
        title: selectedGoal.name,
        showBack: true,
        onBack: handleBackToMain,
        rightAction: h('button', {
          onClick: () => { Haptics.light(); openGoalForm(selectedGoal); },
          style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
        }, h(Icon, { name: 'edit', size: 18, color: 'var(--color-accent)' }))
      }),

      h('div', { className: 'scroll-container page' },
        // 目标概览卡片
        h('div', {
          style: {
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            boxShadow: 'var(--shadow-1)',
            marginBottom: 'var(--space-md)',
            textAlign: 'center',
          }
        },
          h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '4px' } }, '目标金额'),
          h('div', {
            style: { fontSize: '32px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: 'var(--space-md)' },
            className: 'numeric'
          }, FormatUtils.money(target)),
          // 进度条
          h('div', {
            style: {
              height: '10px',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
              marginBottom: '8px',
            }
          },
            h('div', {
              style: {
                height: '100%', width: percent + '%',
                backgroundColor: percent >= 100 ? 'var(--color-complete)' : 'var(--color-accent)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.3s',
              }
            })
          ),
          h('div', {
            style: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-tertiary)' }
          },
            h('span', { className: 'numeric' }, '已存 ' + FormatUtils.money(saved)),
            h('span', null, percent + '%'),
            h('span', { className: 'numeric' }, '剩余 ' + FormatUtils.money(remaining))
          )
        ),

        // 元数据
        h('div', {
          style: {
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            boxShadow: 'var(--shadow-1)',
            marginBottom: 'var(--space-md)',
          }
        },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0' } },
            h('span', { style: { fontSize: '14px', color: 'var(--color-text-tertiary)' } }, '创建日期'),
            h('span', { style: { fontSize: '14px', color: 'var(--color-text-primary)' } },
              DateUtils.friendlyDate(selectedGoal.createdDate || (selectedGoal.createdAt || '').slice(0, 10)))
          ),
          selectedGoal.completedDate && h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0' } },
            h('span', { style: { fontSize: '14px', color: 'var(--color-text-tertiary)' } }, '完成日期'),
            h('span', { style: { fontSize: '14px', color: 'var(--color-complete)' } },
              DateUtils.friendlyDate(selectedGoal.completedDate))
          ),
        ),

        // 分配记录
        h('div', {
          style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', padding: '0 var(--space-xs) var(--space-sm)' }
        }, '📋 分配记录'),
        allocationRecords.length === 0
          ? h('div', {
              style: { textAlign: 'center', padding: 'var(--space-lg) 0', color: 'var(--color-text-tertiary)', fontSize: '14px' }
            }, '还没有分配记录')
          : h('div', {
              style: {
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-md)',
                padding: '0 var(--space-md)',
                boxShadow: 'var(--shadow-1)',
              }
            }, allocationRecords.map(r => {
              const cat = getCategoryInfo(r.type, r.category);
              const isIncome = r.type === 'income';
              const displayAmount = isIncome
                ? (r.allocationAmount != null ? r.allocationAmount : r.amount)
                : r.amount;
              return h('div', {
                key: r.id,
                style: {
                  display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                  padding: '10px 0', borderBottom: '1px solid var(--color-border-light)',
                }
              },
                h('div', {
                  style: {
                    width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', flexShrink: 0,
                  }
                }, cat.icon),
                h('div', {
                  style: { flex: 1, minWidth: 0, cursor: 'pointer' },
                  onClick: () => { Haptics.light(); openTransactionForm(r.type, r); },
                },
                  h('div', {
                    style: { fontSize: '15px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                  }, r.notes || cat.label),
                  h('div', {
                    style: { fontSize: '12px', color: 'var(--color-text-tertiary)' }
                  }, DateUtils.friendlyDate(r.date), ' · ', isIncome ? '收入分配' : '目标支出')
                ),
                h('span', {
                  style: {
                    fontSize: '16px', fontWeight: 600,
                    color: isIncome ? 'var(--color-complete)' : 'var(--color-deadline)',
                  },
                  className: 'numeric'
                }, (isIncome ? '+' : '-') + FormatUtils.money(displayAmount)),
                // 取消分配按钮（仅收入分配 + 进行中目标）
                isIncome && selectedGoal.status === 'in_progress' && h('button', {
                  onClick: (e) => { e.stopPropagation(); handleUnallocateRecord(r.id, selectedGoal.id); },
                  style: {
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: 'var(--color-bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }
                }, h(Icon, { name: 'close', size: 12, color: 'var(--color-text-tertiary)' }))
              );
            }))
      ),

      // 底部操作栏
      !isCompleted && h('div', { className: 'action-bar' },
        h(Button, {
          variant: 'primary', size: 'compact', fullWidth: true,
          onClick: () => { Haptics.light(); openAllocationView(selectedGoal); }
        }, '💰 分配收入到目标')
      )
    );
  };

  // ===== 分配视图 =====
  const renderAllocation = () => {
    if (!selectedGoal) return null;
    const saved = selectedGoal.saved || 0;
    const target = selectedGoal.target || 0;
    const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    const remaining = Math.max(0, target - saved);

    return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
      h(NavBar, {
        title: `分配到「${selectedGoal.name}」`,
        showBack: true,
        onBack: () => { openGoalDetail(selectedGoal); },
      }),

      h('div', { className: 'scroll-container page' },
        // 目标进度概览
        h('div', {
          style: {
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            boxShadow: 'var(--shadow-1)',
            marginBottom: 'var(--space-md)',
            textAlign: 'center',
          }
        },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
            h('span', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '已存'),
            h('span', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '剩余'),
          ),
          h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
            h('span', { style: { fontSize: '20px', fontWeight: 700, color: 'var(--color-accent)' }, className: 'numeric' }, FormatUtils.money(saved)),
            h('span', { style: { fontSize: '20px', fontWeight: 700, color: 'var(--color-text-secondary)' }, className: 'numeric' }, FormatUtils.money(remaining)),
          ),
          h('div', {
            style: { height: '8px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }
          },
            h('div', {
              style: {
                height: '100%', width: percent + '%',
                backgroundColor: 'var(--color-accent)', borderRadius: 'var(--radius-pill)',
                transition: 'width 0.3s',
              }
            })
          )
        ),

        // 可分配收入列表
        h('div', {
          style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', padding: '0 var(--space-xs) var(--space-sm)' }
        }, '可选择分配的收入'),
        allocatableIncome.length === 0
          ? h(EmptyState, { icon: '💰', title: '没有可分配的收入', subtitle: '所有收入已分配或暂无收入记录' })
          : h('div', null, allocatableIncome.map(r => {
              const cat = getCategoryInfo('income', r.category);
              const inputVal = allocationInputs[r.id] || '';
              return h('div', {
                key: r.id,
                style: {
                  backgroundColor: 'var(--color-bg-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  marginBottom: 'var(--space-sm)',
                  boxShadow: 'var(--shadow-1)',
                }
              },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '8px' } },
                  h('div', {
                    style: {
                      width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0,
                    }
                  }, cat.icon),
                  h('div', { style: { flex: 1, minWidth: 0 } },
                    h('div', { style: { fontSize: '15px', color: 'var(--color-text-primary)' } }, r.notes || cat.label),
                    h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } },
                      DateUtils.friendlyDate(r.date), ' · 收入 ', FormatUtils.money(r.amount)),
                  ),
                  h('div', { style: { textAlign: 'right' } },
                    h('div', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' } }, '可分配'),
                    h('div', { style: { fontSize: '15px', fontWeight: 600, color: 'var(--color-complete)' }, className: 'numeric' }, FormatUtils.money(r.remainingAllocatable)),
                  )
                ),
                // 分配输入 + 按钮
                h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
                  h('input', {
                    type: 'number',
                    value: inputVal,
                    onChange: (e) => setAllocationInputs(prev => ({ ...prev, [r.id]: e.target.value })),
                    placeholder: '分配金额',
                    style: {
                      flex: 1,
                      backgroundColor: 'var(--color-bg-subtle)',
                      border: '2px solid transparent',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      fontSize: '16px',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                      minWidth: 0,
                    }
                  }),
                  h(Button, {
                    variant: 'primary', size: 'compact',
                    onClick: () => handleAllocateIncome(r.id, selectedGoal.id, inputVal),
                    style: { flexShrink: 0 }
                  }, '分配')
                )
              );
            }))
      )
    );
  };

  // ===== 主视图 =====
  const renderMainView = () => h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },

    h(NavBar, {
      title: '零用钱', showBack: false,
      rightAction: h('button', {
        onClick: () => { Haptics.light(); openGoalForm(null); },
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, h(Icon, { name: 'plus', size: 24, color: 'var(--color-accent)' }))
    }),

    // 月份选择器
    h('div', {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'var(--space-lg)', padding: 'var(--space-sm) 0',
      }
    },
      h('button', {
        onClick: handlePrevMonth,
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }
      }, h(Icon, { name: 'chevronLeft', size: 22, color: 'var(--color-text-secondary)' })),
      h('span', {
        style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' }
      }, DateUtils.monthLabel(allowanceMonth)),
      h('button', {
        onClick: handleNextMonth,
        style: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }
      }, h(Icon, { name: 'chevronRight', size: 22, color: 'var(--color-text-secondary)' }))
    ),

    h('div', { className: 'scroll-container page' },
      // 统计概览
      renderSummary(),

      // 储蓄目标
      h('div', {
        style: {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 var(--space-xs) var(--space-sm)',
        }
      },
        h('span', { style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' } }, '🎯 储蓄目标'),
        goals.length > 0 && h('button', {
          onClick: () => { Haptics.light(); openGoalForm(null); },
          style: { fontSize: '14px', color: 'var(--color-accent)', fontWeight: 500 }
        }, '+ 添加')
      ),
      goals.length === 0
        ? h('div', {
            style: {
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: 'var(--space-4xl) 0', textAlign: 'center',
            }
          },
            h('div', { style: { fontSize: '48px', marginBottom: 'var(--space-md)', opacity: 0.4 } }, '🎯'),
            h('div', {
              style: { fontSize: '15px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-lg)' }
            }, '还没有储蓄目标'),
            h(Button, {
              variant: 'secondary', size: 'sm',
              onClick: () => { Haptics.light(); openGoalForm(null); },
            }, '+ 创建目标')
          )
        : h('div', null, goals.map(renderGoal)),

      // 记录列表
      h('div', {
        style: {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--space-lg) var(--space-xs) var(--space-sm)',
        }
      },
        h('span', { style: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' } }, '📋 记录')
      ),
      records.length === 0
        ? h('div', {
            style: { textAlign: 'center', padding: 'var(--space-lg) 0', color: 'var(--color-text-tertiary)', fontSize: '14px' }
          }, '本月没有记录')
        : h('div', {
            style: {
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: '0 var(--space-md)',
              boxShadow: 'var(--shadow-1)',
            }
          }, records.map(renderRecord))
    ),

    // 底部 Action Bar
    h('div', { className: 'action-bar' },
      h(Button, {
        variant: 'danger', size: 'compact', fullWidth: true,
        onClick: () => { Haptics.light(); openTransactionForm('expense'); }
      }, '支出'),
      h(Button, {
        variant: 'primary', size: 'compact', fullWidth: true,
        onClick: () => { Haptics.light(); openTransactionForm('income'); }
      }, '收入'),
    ),

    // 表单 Sheet
    h(Sheet, {
      open: showForm,
      onClose: handleCloseForm,
      title: formType === 'transaction'
        ? (editingRecord ? '编辑记录' : (txType === 'income' ? '新增收入' : '新增支出'))
        : (editingGoal ? '编辑目标' : '新增目标'),
    },
      formType === 'transaction'
        ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

            // 类型切换（编辑时不显示）
            !editingRecord && h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
              h('button', {
                onClick: () => { Haptics.selection(); setTxType('expense'); setTxCategory(''); setExpenseFromGoal(false); setAllocateToGoal(false); },
                style: {
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                  fontSize: '15px', fontWeight: 600,
                  backgroundColor: txType === 'expense' ? 'var(--color-deadline)' : 'var(--color-bg-subtle)',
                  color: txType === 'expense' ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, '支出'),
              h('button', {
                onClick: () => { Haptics.selection(); setTxType('income'); setTxCategory(''); setExpenseFromGoal(false); setAllocateToGoal(false); },
                style: {
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                  fontSize: '15px', fontWeight: 600,
                  backgroundColor: txType === 'income' ? 'var(--color-complete)' : 'var(--color-bg-subtle)',
                  color: txType === 'income' ? '#FFFFFF' : 'var(--color-text-secondary)',
                }
              }, '收入')
            ),

            h(Input, {
              label: '金额', value: amount, onChange: setAmount,
              placeholder: '0.00', type: 'number', required: true,
            }),

            h(Input, {
              label: '日期', value: txDate, onChange: setTxDate,
              type: 'date', required: true,
            }),

            // 分类
            h('div', null,
              h('label', {
                style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
              }, '分类'),
              h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
                allCategories.map(c =>
                  h('button', {
                    key: c.key,
                    onClick: () => { Haptics.selection(); setTxCategory(c.key); },
                    style: {
                      padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: '14px', fontWeight: 500,
                      backgroundColor: txCategory === c.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                      color: txCategory === c.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                    }
                  }, c.icon + ' ' + c.label)
                )
              )
            ),

            // 收入：分配到储蓄目标
            txType === 'income' && goals.length > 0 && h('div', null,
              h('label', {
                style: {
                  display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
                  fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)',
                  paddingLeft: 'var(--space-xs)', marginBottom: 'var(--space-xs)',
                }
              },
                h('input', {
                  type: 'checkbox', checked: allocateToGoal,
                  onChange: (e) => { setAllocateToGoal(e.target.checked); if (!e.target.checked) { setSelectedGoalId(''); setAllocationAmount(''); } },
                  style: { width: '18px', height: '18px', accentColor: 'var(--color-accent)' }
                }),
                '分配到储蓄目标'
              ),
              allocateToGoal && h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' } },
                h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
                  goals.filter(g => g.status === 'in_progress').map(g =>
                    h('button', {
                      key: g.id,
                      onClick: () => { Haptics.selection(); setSelectedGoalId(g.id); },
                      style: {
                        padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
                        backgroundColor: selectedGoalId === g.id ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                        color: selectedGoalId === g.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                      }
                    }, g.name)
                  )
                ),
                selectedGoalId && h(Input, {
                  label: '分配金额（留空则全额分配）',
                  value: allocationAmount,
                  onChange: setAllocationAmount,
                  placeholder: '默认全额',
                  type: 'number',
                })
              )
            ),

            // 支出：资金来源
            txType === 'expense' && goals.length > 0 && h('div', null,
              h('label', {
                style: {
                  display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
                  fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)',
                  paddingLeft: 'var(--space-xs)', marginBottom: 'var(--space-xs)',
                }
              },
                h('input', {
                  type: 'checkbox', checked: expenseFromGoal,
                  onChange: (e) => { setExpenseFromGoal(e.target.checked); if (!e.target.checked) setSelectedGoalId(''); },
                  style: { width: '18px', height: '18px', accentColor: 'var(--color-accent)' }
                }),
                '从储蓄目标支出'
              ),
              expenseFromGoal && h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' } },
                goals.filter(g => g.status === 'in_progress').map(g =>
                  h('button', {
                    key: g.id,
                    onClick: () => { Haptics.selection(); setSelectedGoalId(g.id); },
                    style: {
                      padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 500,
                      backgroundColor: selectedGoalId === g.id ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                      color: selectedGoalId === g.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                    }
                  }, g.name)
                )
              )
            ),

            h(Input, {
              label: '备注（可选）', value: txNotes, onChange: setTxNotes,
              placeholder: '如：完成阅读奖励', multiline: true, rows: 2,
            }),

            h(Button, { fullWidth: true, onClick: handleSaveTransaction }, editingRecord ? '保存' : '记录'),
          )

        : h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

            h(Input, {
              label: '目标名称', value: goalName, onChange: setGoalName,
              placeholder: '如：Nintendo Switch', required: true,
            }),

            h(Input, {
              label: '目标金额', value: goalTarget, onChange: setGoalTarget,
              placeholder: '0.00', type: 'number', required: true,
            }),

            // 创建日期（可选，默认今天）
            h(Input, {
              label: '创建日期', value: goalCreatedDate, onChange: setGoalCreatedDate,
              type: 'date',
            }),

            // 完成日期（状态为已完成时可填）
            goalStatus === 'completed' && h(Input, {
              label: '完成日期', value: goalCompletedDate, onChange: setGoalCompletedDate,
              type: 'date',
            }),

            // 状态切换（仅编辑时显示）
            editingGoal && h('div', null,
              h('label', {
                style: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-xs)', display: 'block', marginBottom: 'var(--space-xs)' }
              }, '状态'),
              h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
                [
                  { key: 'in_progress', label: '进行中' },
                  { key: 'completed', label: '已完成' },
                  { key: 'cancelled', label: '已取消' },
                ].map(s =>
                  h('button', {
                    key: s.key,
                    onClick: () => { Haptics.selection(); setGoalStatus(s.key); },
                    style: {
                      flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                      fontSize: '14px', fontWeight: 500,
                      backgroundColor: goalStatus === s.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                      color: goalStatus === s.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                    }
                  }, s.label)
                )
              )
            ),

            // 已存金额显示（编辑时）
            editingGoal && h('div', {
              style: {
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-md)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
              }
            },
              h('span', { style: { color: 'var(--color-text-tertiary)' } }, '已存金额（自动计算）：'),
              h('span', { style: { fontWeight: 600, color: 'var(--color-accent)' }, className: 'numeric' },
                ' ' + FormatUtils.money(editingGoal.saved || 0)
              )
            ),

            h(Button, { fullWidth: true, onClick: handleSaveGoal }, editingGoal ? '保存' : '创建目标'),
          )
    )
  );

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    renderCelebration(),
    renderPostCreationPrompt(),
    viewMode === 'main'
      ? renderMainView()
      : viewMode === 'goalDetail'
      ? renderGoalDetail()
      : viewMode === 'allocation'
      ? renderAllocation()
      : null
  );
}

window.AllowancePage = AllowancePage;

})();