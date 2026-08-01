(function() {
/**
 * Personal Hub — 分类常量
 */

const CATEGORIES = {
  // 购物分类
  shopping: [
    { key: 'food',     label: '食品',     icon: '🍎' },
    { key: 'daily',    label: '日用品',   icon: '🧴' },
    { key: 'pet',      label: '宠物用品', icon: '🐾' },
    { key: 'alex',     label: 'Alex用品', icon: '👦' },
    { key: 'puff',     label: '泡芙原料', icon: '🧁' },
    { key: 'other',    label: '其他',     icon: '📦' },
  ],

  // 支出分类（生活记账，不含泡芙）
  expense: [
    { key: 'food',          label: '餐饮',   icon: '🍽️' },
    { key: 'transport',     label: '交通',   icon: '🚗' },
    { key: 'shopping',      label: '购物',   icon: '🛒' },
    { key: 'home',          label: '居家',   icon: '🏠' },
    { key: 'pet',           label: '宠物',   icon: '🐾' },
    { key: 'alex',          label: 'Alex',  icon: '👦' },
    { key: 'medical',       label: '医疗',   icon: '💊' },
    { key: 'entertainment', label: '娱乐',   icon: '🎬' },
    { key: 'other',         label: '其他',   icon: '📦' },
  ],

  // 收入分类（生活记账，不含泡芙）
  income: [
    { key: 'salary',        label: '工资',   icon: '💵' },
    { key: 'other_income',  label: '其他收入', icon: '💰' },
  ],

  // 泡芙支出分类
  puffExpense: [
    { key: 'puff_ingredient', label: '原材料', icon: '🥚' },
    { key: 'puff_packaging',  label: '包装',   icon: '📦' },
    { key: 'puff_equipment',  label: '设备',   icon: '🔧' },
    { key: 'puff_rent',       label: 'Rent',   icon: '🏠' },
    { key: 'puff_utility',    label: 'Utility', icon: '💡' },
    { key: 'puff_transport',  label: '交通',   icon: '🚗' },
    { key: 'puff_license',    label: 'License', icon: '📄' },
    { key: 'puff_other',      label: '其他',   icon: '📦' },
  ],

  // 泡芙收入分类
  puffIncome: [
    { key: 'puff_sales',  label: '泡芙', icon: '🧁' },
    { key: 'puff_tip',    label: 'Tip',  icon: '💝' },
    { key: 'puff_income_other', label: '其他', icon: '💰' },
  ],

  // 泡芙产品分类
  product: [
    { key: 'classic',  label: '经典款',   icon: '☁️' },
    { key: 'testing',  label: 'Testing',  icon: '💡' },
    { key: 'seasonal', label: '节日限定', icon: '🎁' },
    { key: 'special',  label: 'Special',  icon: '🎀' },
  ],

  // 灵感分类
  notes: [
    { key: 'puff_idea',    label: '泡芙灵感', icon: '🧁' },
    { key: 'product_idea', label: '产品创意', icon: '💡' },
    { key: 'life',         label: '生活想法', icon: '🌿' },
    { key: 'quick',        label: '随手记录', icon: '✏️' },
    { key: 'shopping',     label: '购物灵感', icon: '🛒' },
    { key: 'future',       label: '未来计划', icon: '🔮' },
  ],

  // 库存分类
  inventory: [
    { key: 'ingredient', label: '原料',   icon: '🥚' },
    { key: 'packaging',  label: '包装',   icon: '📦' },
    { key: 'tool',       label: '工具',   icon: '🔧' },
  ],

  // 社交平台
  socialPlatforms: [
    { key: 'instagram',   label: 'Instagram',  icon: '📷' },
    { key: 'xiaohongshu', label: '小红书',      icon: '📕' },
    { key: 'wechat',      label: '微信',        icon: '💬' },
    { key: 'other',       label: '其他',        icon: '📱' },
  ],
};

// 辅助：根据 key 获取分类信息
CATEGORIES.getShoppingCategory = (key) => CATEGORIES.shopping.find(c => c.key === key) || CATEGORIES.shopping[5];
CATEGORIES.getExpenseCategory = (key) => CATEGORIES.expense.find(c => c.key === key) || CATEGORIES.expense[8];
CATEGORIES.getIncomeCategory = (key) => CATEGORIES.income.find(c => c.key === key) || CATEGORIES.income[1];
CATEGORIES.getProductCategory = (key) => CATEGORIES.product.find(c => c.key === key) || CATEGORIES.product[3];
CATEGORIES.getInventoryCategory = (key) => CATEGORIES.inventory.find(c => c.key === key) || CATEGORIES.inventory[2];
CATEGORIES.getPuffExpenseCategory = (key) => CATEGORIES.puffExpense.find(c => c.key === key) || CATEGORIES.puffExpense[7];
CATEGORIES.getPuffIncomeCategory = (key) => CATEGORIES.puffIncome.find(c => c.key === key) || CATEGORIES.puffIncome[2];
CATEGORIES.getNoteCategory = (key) => CATEGORIES.notes.find(c => c.key === key) || CATEGORIES.notes[3];

window.CATEGORIES = CATEGORIES;

})();
