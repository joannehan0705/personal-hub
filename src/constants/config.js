(function() {
/**
 * Personal Hub — 应用全局配置
 */

const APP_CONFIG = {
  // 应用信息
  name: 'Personal Hub',
  version: '2.18.0',

  // 数据库
  dbName: 'personal-hub-db',
  dbVersion: 5,

  // 本地存储键前缀
  storagePrefix: 'ph_',

  // 优先级
  priorities: {
    none:   { label: '无', color: 'transparent', dot: null },
    low:    { label: '低', color: '#6B9EC4', dot: '#6B9EC4' },
    medium: { label: '中', color: '#E8C547', dot: '#E8C547' },
    high:   { label: '高', color: '#E8826B', dot: '#E8826B' },
  },

  // 待办分组
  todoGroups: [
    { key: 'today',    label: '今天' },
    { key: 'week',     label: '本周' },
    { key: 'later',    label: '以后' },
    { key: 'someday',  label: '时间待定' },
    { key: 'waiting',  label: '等待回复' },
    { key: 'completed',label: '已完成' },
  ],

  // 订单状态
  orderStatus: {
    new:       { label: '新建',   color: '#6B9EC4', icon: '○' },
    confirmed: { label: '已确认', color: '#E8C547', icon: '◐' },
    making:    { label: '制作中', color: '#8B7EC8', icon: '◑' },
    ready:     { label: '待取货', color: '#E8826B', icon: '●' },
    completed: { label: '已完成', color: '#7BAE8E', icon: '✓' },
    cancelled: { label: '已取消', color: '#9C968B', icon: '✕' },
  },

  // 订单状态流转
  orderFlow: {
    new:       ['confirmed', 'cancelled'],
    confirmed: ['making', 'cancelled'],
    making:    ['ready', 'cancelled'],
    ready:     ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  },

  // Alex 子模块
  alexCategories: [
    { key: 'school',    label: 'School',    icon: '📚' },
    { key: 'allowance', label: '零用钱',     icon: '💰' },
    { key: 'hockey',    label: 'Hockey',    icon: '🏒' },
    { key: 'class',     label: '课外班',     icon: '🎓' },
    { key: 'iep',       label: 'IEP',       icon: '📋' },
    { key: 'activity',  label: 'Activity',  icon: '🎯' },
    { key: 'reading',   label: 'Reading',   icon: '📖' },
    { key: 'medical',   label: 'Medical',   icon: '🏥' },
  ],

  // Alex 支持 recurring（重复）的子模块
  alexRecurringCategories: ['hockey', 'class'],

  // 重复频率选项
  recurringFrequencies: [
    { key: 'none',       label: '不重复' },
    { key: 'daily',      label: '每天' },
    { key: 'weekly',     label: '每周' },
    { key: 'biweekly',   label: '每两周' },
    { key: 'monthly',    label: '每月' },
  ],

  // 星期选项（0=周日 ... 6=周六）
  weekdays: [
    { key: 1, label: '周一' },
    { key: 2, label: '周二' },
    { key: 3, label: '周三' },
    { key: 4, label: '周四' },
    { key: 5, label: '周五' },
    { key: 6, label: '周六' },
    { key: 0, label: '周日' },
  ],

  // 宠物
  pets: [
    { key: 'cookie', label: 'Cookie', icon: '🐶', type: '狗' },
    { key: 'puff',   label: 'Puff',   icon: '🐱', type: '猫' },
  ],

  // 宠物记录类型
  petRecordTypes: [
    { key: 'medical',     label: '医疗',   icon: '🏥' },
    { key: 'vaccine',     label: '疫苗',   icon: '💉' },
    { key: 'bath',        label: '洗澡',   icon: '🛁' },
    { key: 'medication',  label: '药品',   icon: '💊' },
    { key: 'supplies',    label: '用品',   icon: '🛍️' },
    { key: 'diet',        label: '饮食',   icon: '🍽️' },
    { key: 'observation', label: '异常观察', icon: '👁️' },
  ],

  // 宠物支持 recurring 的记录类型
  petRecurringTypes: ['medication', 'bath'],

  // 首页卡片
  homeSections: [
    'overview', 'todo', 'someday', 'shopping',
    'finance', 'alex', 'pets', 'orders'
  ],

  // 搜索历史最大保存数
  maxSearchHistory: 20,

  // 零用钱收入分类
  allowanceIncomeCategories: [
    { key: 'weekly',    label: '每周零用钱', icon: '💵' },
    { key: 'chore',     label: '家务奖励',   icon: '🧹' },
    { key: 'reading',   label: '阅读奖励',   icon: '📖' },
    { key: 'hockey',    label: 'Hockey',    icon: '🏒' },
    { key: 'school',    label: '学校表现',   icon: '🎓' },
    { key: 'birthday',  label: '生日',       icon: '🎂' },
    { key: 'gift',      label: '礼物',       icon: '🎁' },
    { key: 'other',     label: '其他',       icon: '✨' },
  ],

  // 零用钱支出分类
  allowanceExpenseCategories: [
    { key: 'food',      label: 'Food',      icon: '🍔' },
    { key: 'toys',      label: 'Toys',      icon: '🧸' },
    { key: 'books',     label: 'Books',     icon: '📚' },
    { key: 'hockey',    label: 'Hockey',    icon: '🏒' },
    { key: 'shopping',  label: 'Shopping',  icon: '🛍️' },
    { key: 'gifts',     label: 'Gifts',     icon: '🎁' },
    { key: 'other',     label: 'Other',     icon: '✨' },
  ],
};

// 暴露到全局
window.APP_CONFIG = APP_CONFIG;

})();
