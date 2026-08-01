(function() {
/**
 * Personal Hub — 所有模块 DAO 定义
 * 统一注册到 window.DAO 命名空间
 */

// 优先级权重映射
const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1, none: 0 };

// ===== Todos DAO =====
class TodosDAO extends BaseDAO {
  constructor() { super('todos'); }

  async getByStatus(status) {
    if (status === 'completed') {
      const all = await this.getAll();
      return all
        .filter(t => t.completed)
        .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
    }
    const today = DateUtils.today();
    const weekStart = DateUtils.startOfWeek();
    const weekEnd = DateUtils.endOfWeek();
    const all = await this.getAll();

    const filtered = all.filter(t => {
      if (t.completed) return false;
      if (status === 'today') return t.date === today || t.status === 'today';
      if (status === 'week') return t.date && t.date >= weekStart && t.date <= weekEnd && t.date !== today;
      if (status === 'later') return t.date && t.date > weekEnd && t.status !== 'someday';
      if (status === 'someday') return t.status === 'someday';
      if (status === 'waiting') return t.status === 'waiting';
      return false;
    });

    // someday 分组：按优先级排序，同级按 sortOrder
    if (status === 'someday') {
      return filtered.sort((a, b) => {
        const pa = PRIORITY_WEIGHT[a.priority] || 0;
        const pb = PRIORITY_WEIGHT[b.priority] || 0;
        if (pb !== pa) return pb - pa; // high 在前
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
    }

    // 有日期的分组：按日期排序，同日期按 time 排序
    return filtered.sort((a, b) => {
      const dateCompare = (a.date || '').localeCompare(b.date || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.time || '').localeCompare(b.time || '');
    });
  }

  async getToday() {
    const today = DateUtils.today();
    const all = await this.getAll();
    return all
      .filter(t => !t.completed && (t.date === today || t.status === 'today'))
      .sort((a, b) => {
        // 有 time 的排在前面，按 time 排序；无 time 的按 sortOrder 排后面
        const aHasTime = !!a.time;
        const bHasTime = !!b.time;
        if (aHasTime && !bHasTime) return -1;
        if (!aHasTime && bHasTime) return 1;
        if (aHasTime && bHasTime) return (a.time || '').localeCompare(b.time || '');
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }

  async complete(id) {
    return await this.update(id, {
      completed: true,
      completedAt: new Date().toISOString(),
      status: 'completed',
    });
  }

  async uncomplete(id) {
    const todo = await this.getById(id);
    if (!todo) return null;
    const today = DateUtils.today();
    let status = 'later';
    if (todo.date === today) status = 'today';
    else if (todo.date && DateUtils.isThisWeek(todo.date)) status = 'week';
    return await this.update(id, {
      completed: false,
      completedAt: null,
      status,
    });
  }

  async reorder(id, newOrder) {
    return await this.update(id, { sortOrder: newOrder });
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(t =>
      !t.completed &&
      ((t.title || '').toLowerCase().includes(lower) ||
       (t.notes || '').toLowerCase().includes(lower))
    ).slice(0, 20);
  }
}

// ===== Shopping DAO =====
class ShoppingDAO extends BaseDAO {
  constructor() { super('shopping'); }

  async getUnpurchased() {
    const all = await this.getAll();
    return all
      .filter(s => !s.purchased)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getPurchased() {
    const all = await this.getAll();
    return all
      .filter(s => s.purchased)
      .sort((a, b) => (b.purchasedAt || '').localeCompare(a.purchasedAt || ''));
  }

  async togglePurchased(id) {
    const item = await this.getById(id);
    if (!item) return null;
    const purchased = !item.purchased;
    return await this.update(id, {
      purchased,
      purchasedAt: purchased ? new Date().toISOString() : null,
    });
  }

  async getStats() {
    const all = await this.getAll();
    let estimated = 0, actual = 0;
    for (const item of all) {
      if (!item.purchased) {
        estimated += item.estimatedPrice || 0;
      } else {
        actual += item.actualPrice || item.estimatedPrice || 0;
      }
    }
    return { estimated, actual, total: estimated + actual };
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(s =>
      (s.name || '').toLowerCase().includes(lower) ||
      (s.notes || '').toLowerCase().includes(lower)
    ).slice(0, 20);
  }
}

// ===== Transactions DAO =====
class TransactionsDAO extends BaseDAO {
  constructor() { super('transactions'); }

  /**
   * 获取某月的交易记录（含订阅虚拟展开）
   * scope: 'personal' | 'puff' | null(全部)
   */
  async getByMonth(monthStr, scope = null) {
    const [start, end] = DateUtils.monthRange(monthStr);
    const all = await super.getAll();
    const [year, mon] = monthStr.split('-').map(Number);
    const monthDate = new Date(year, mon - 1, 15); // 月中用于判断

    const result = [];
    for (const t of all) {
      if (scope && (t.scope || 'personal') !== scope) continue;

      if (t.recordType === 'subscription') {
        // 订阅：检查该月是否在订阅周期内
        const startDate = DateUtils.parse(t.date);
        if (!startDate) continue;
        const endDate = t.recurringEndDate ? DateUtils.parse(t.recurringEndDate) : null;
        if (monthDate < startDate) continue;
        if (endDate && monthDate > endDate) continue;

        // 根据频率判断该月是否有记录
        let inMonth = false;
        if (t.recurring === 'monthly') {
          inMonth = true;
        } else if (t.recurring === 'weekly') {
          // 检查该月是否有匹配 weekday 的日期
          const weekday = t.weekday != null ? t.weekday : startDate.getDay();
          // 该月至少有一个匹配的 weekday
          for (let d = 1; d <= 28; d++) {
            const testDate = new Date(year, mon - 1, d);
            if (testDate.getDay() === weekday) { inMonth = true; break; }
          }
        } else if (t.recurring === 'yearly') {
          inMonth = (startDate.getMonth() === mon - 1);
        } else if (t.recurring === 'daily') {
          inMonth = true;
        }

        if (inMonth) {
          // 虚拟记录：该月的日期
          const day = Math.min(startDate.getDate(), 28);
          const virtualDate = `${monthStr}-${String(day).padStart(2, '0')}`;
          result.push({ ...t, id: `${t.id}_sub_${monthStr}`, date: virtualDate, isVirtual: true, parentId: t.id });
        }
      } else {
        // 普通记录 & 分期记录
        if (t.date >= start && t.date <= end) {
          result.push(t);
        }
      }
    }

    return result.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async getByDate(dateStr, scope = null) {
    const all = await super.getAll();
    return all
      .filter(t => t.date === dateStr)
      .filter(t => scope ? (t.scope || 'personal') === scope : true);
  }

  async getMonthlySummary(monthStr, scope = null) {
    const records = await this.getByMonth(monthStr, scope);
    let income = 0, expense = 0;
    for (const t of records) {
      if (t.type === 'income') income += t.amount || 0;
      else expense += t.amount || 0;
    }
    return { income, expense, balance: income - expense, count: records.length };
  }

  async getCategorySummary(monthStr, scope = null) {
    const records = await this.getByMonth(monthStr, scope);
    const summary = {};
    for (const t of records) {
      if (!summary[t.category]) summary[t.category] = { type: t.type, amount: 0, count: 0 };
      summary[t.category].amount += t.amount || 0;
      summary[t.category].count++;
    }
    return summary;
  }

  /**
   * 获取所有订阅记录
   */
  async getSubscriptions(scope = null) {
    const all = await super.getAll();
    return all
      .filter(t => t.recordType === 'subscription')
      .filter(t => scope ? (t.scope || 'personal') === scope : true)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  /**
   * 创建分期记录：生成 N 条关联记录
   */
  async createInstallment(data, totalInstallments) {
    const groupId = `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const records = [];
    const startDate = DateUtils.parse(data.date);

    for (let i = 0; i < totalInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const record = {
        ...data,
        date: DateUtils.toDateStr(dueDate),
        recordType: 'installment',
        installmentTotal: totalInstallments,
        installmentNo: i + 1,
        installmentGroupId: groupId,
      };
      const created = await this.create(record);
      records.push(created);
    }
    return records;
  }

  /**
   * 删除分期：根据 groupId 删除全部分期记录
   */
  async deleteInstallmentGroup(groupId) {
    const all = await super.getAll();
    const records = all.filter(t => t.installmentGroupId === groupId);
    for (const r of records) {
      await this.delete(r.id);
    }
    return records.length;
  }

  async getAll(scope = null) {
    const all = await super.getAll();
    return scope ? all.filter(t => (t.scope || 'personal') === scope) : all;
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(t => {
      const cat = t.type === 'income'
        ? (t.scope === 'puff' ? CATEGORIES.getPuffIncomeCategory(t.category) : CATEGORIES.getIncomeCategory(t.category)).label
        : (t.scope === 'puff' ? CATEGORIES.getPuffExpenseCategory(t.category) : CATEGORIES.getExpenseCategory(t.category)).label;
      return cat.toLowerCase().includes(lower) ||
             (t.notes || '').toLowerCase().includes(lower) ||
             String(t.amount).includes(lower);
    }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  }
}

// ===== Budgets DAO =====
class BudgetsDAO extends BaseDAO {
  constructor() { super('budgets'); }

  async getByMonth(monthStr) {
    const all = await this.getAll();
    return all.filter(b => b.month === monthStr);
  }

  async getOrCreate(category, monthStr, defaultLimit = 0) {
    const all = await this.getAll();
    const existing = all.find(b => b.category === category && b.month === monthStr);
    if (existing) return existing;

    // 尝试找上个月该分类的预算
    const prevMonth = DateUtils.prevMonth(monthStr);
    const prev = all.find(b => b.category === category && b.month === prevMonth);
    const limit = prev ? prev.limit : defaultLimit;

    return await this.create({ category, month: monthStr, limit });
  }

  async setBudget(category, monthStr, limit) {
    const all = await this.getAll();
    const existing = all.find(b => b.category === category && b.month === monthStr);
    if (existing) {
      return await this.update(existing.id, { limit });
    }
    return await this.create({ category, month: monthStr, limit });
  }
}

// ===== Alex DAO =====
class AlexDAO extends BaseDAO {
  constructor() { super('alex'); }

  async getByCategory(category) {
    const records = await this.getByIndex('category', category);
    return records.sort((a, b) => {
      // recurring 记录排在前面
      const aRecurring = a.recurring && a.recurring !== 'none';
      const bRecurring = b.recurring && b.recurring !== 'none';
      if (aRecurring && !bRecurring) return -1;
      if (!aRecurring && bRecurring) return 1;
      return (b.date || '').localeCompare(a.date || '');
    });
  }

  async getToday() {
    const today = DateUtils.today();
    const todayDate = new Date(today + 'T00:00:00');
    const todayWeekday = todayDate.getDay(); // 0=周日 ... 6=周六
    const all = await this.getAll();
    return all.filter(r => {
      // 非 recurring：日期匹配今天
      if (!r.recurring || r.recurring === 'none') {
        return r.date === today;
      }

      // 获取开始日期：优先 recurringStartDate，其次 date
      const startDateStr = r.recurringStartDate || r.date;
      if (!startDateStr) return false;
      const startDate = new Date(startDateStr + 'T00:00:00');

      // 如果今天早于开始日期，不显示
      if (todayDate < startDate) return false;

      // 检查结束日期
      if (r.recurringEndDate) {
        const endDate = new Date(r.recurringEndDate + 'T00:00:00');
        if (todayDate > endDate) return false;
      }

      // daily：每天都显示（从开始日期起）
      if (r.recurring === 'daily') return true;

      // weekly：weekday 匹配今天
      if (r.recurring === 'weekly') {
        return r.weekday === todayWeekday;
      }

      // biweekly：weekday 匹配，且本周是间隔周
      if (r.recurring === 'biweekly') {
        if (r.weekday !== todayWeekday) return false;
        // 计算从开始日期到今天过了多少周，偶数周才显示
        const diffDays = Math.floor((todayDate - startDate) / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        return diffWeeks % 2 === 0;
      }

      // monthly：日期（几号）匹配今天
      if (r.recurring === 'monthly') {
        return todayDate.getDate() === startDate.getDate();
      }
      return false;
    });
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(r =>
      (r.title || '').toLowerCase().includes(lower) ||
      (r.notes || '').toLowerCase().includes(lower)
    ).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 20);
  }
}

// ===== Pets DAO =====
class PetsDAO extends BaseDAO {
  constructor() { super('pets'); }

  async getByPet(petName) {
    return await this.getByIndex('petName', petName);
  }

  async getByPetAndType(petName, type) {
    const all = await this.getByPet(petName);
    const filtered = all.filter(r => r.type === type);

    // 对 recurring 记录排序：recurring 记录排在前面
    return filtered.sort((a, b) => {
      if (a.recurring && a.recurring !== 'none' && !(b.recurring && b.recurring !== 'none')) return -1;
      if (!(a.recurring && a.recurring !== 'none') && b.recurring && b.recurring !== 'none') return 1;
      return (b.date || '').localeCompare(a.date || '');
    });
  }

  async getUpcomingReminders(days = 7) {
    const today = DateUtils.today();
    const endDate = DateUtils.addDays(today, days);
    const all = await this.getAll();
    return all
      .filter(r => r.nextDate && r.nextDate >= today && r.nextDate <= endDate)
      .sort((a, b) => (a.nextDate || '').localeCompare(b.nextDate || ''));
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(r =>
      (r.title || '').toLowerCase().includes(lower) ||
      (r.notes || '').toLowerCase().includes(lower) ||
      (r.symptom || '').toLowerCase().includes(lower)
    ).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 20);
  }
}

// ===== Orders DAO =====
class OrdersDAO extends BaseDAO {
  constructor() { super('orders'); }

  async getByStatus(status) {
    const orders = await this.getByIndex('status', status);
    return orders.sort((a, b) => (b.pickupDate || '').localeCompare(a.pickupDate || ''));
  }

  async getRecent(limit = 5) {
    const all = await this.getAll();
    return all
      .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
      .sort((a, b) => (a.pickupDate || '').localeCompare(b.pickupDate || ''))
      .slice(0, limit);
  }

  async getNextOrderNumber() {
    const db = await this.getDB();
    const meta = await db.get('meta', 'orderSequence');
    const next = (meta?.value || 0) + 1;
    await db.put('meta', { key: 'orderSequence', value: next });
    return next;
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(o =>
      (o.customer || '').toLowerCase().includes(lower) ||
      String(o.orderNumber).includes(lower) ||
      (o.notes || '').toLowerCase().includes(lower)
    ).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 20);
  }

  async updateStatus(id, newStatus) {
    return await this.update(id, { status: newStatus });
  }

  async getTodayPickups() {
    const today = DateUtils.today();
    const all = await this.getAll();
    return all.filter(o => o.pickupDate === today && o.status !== 'completed' && o.status !== 'cancelled');
  }
}

// ===== Products DAO =====
class ProductsDAO extends BaseDAO {
  constructor() { super('products'); }

  async getActive() {
    const all = await this.getAll();
    return all.filter(p => p.active !== false);
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(p =>
      (p.name || '').toLowerCase().includes(lower) ||
      (p.description || '').toLowerCase().includes(lower)
    ).slice(0, 20);
  }
}

// ===== Customers DAO =====
class CustomersDAO extends BaseDAO {
  constructor() { super('customers'); }

  async getByName(name) {
    return await this.getByIndex('name', name);
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(c =>
      (c.name || '').toLowerCase().includes(lower) ||
      (c.phone || '').includes(keyword) ||
      (c.wechat || '').toLowerCase().includes(lower)
    ).slice(0, 20);
  }
}

// ===== Recipes DAO =====
class RecipesDAO extends BaseDAO {
  constructor() { super('recipes'); }
}

// ===== PickupPoints DAO (V4) =====
class PickupPointsDAO extends BaseDAO {
  constructor() { super('pickupPoints'); }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(p =>
      (p.name || '').toLowerCase().includes(lower) ||
      (p.address || '').toLowerCase().includes(lower)
    ).slice(0, 20);
  }
}

// ===== Allowance DAO (V5) — 零用钱记录 =====
class AllowanceDAO extends BaseDAO {
  constructor() { super('allowance'); }

  async getByMonth(monthStr) {
    const [start, end] = DateUtils.monthRange(monthStr);
    const all = await this.getAll();
    return all
      .filter(t => t.date >= start && t.date <= end)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async getMonthlySummary(monthStr) {
    const records = await this.getByMonth(monthStr);
    let income = 0, expense = 0;
    for (const t of records) {
      if (t.type === 'income') income += t.amount || 0;
      else expense += t.amount || 0;
    }
    return { income, expense, balance: income - expense };
  }

  async getBalance() {
    const all = await super.getAll();
    let income = 0, expense = 0;
    for (const t of all) {
      if (t.type === 'income') income += t.amount || 0;
      else expense += t.amount || 0;
    }
    return income - expense;
  }

  // 截至某日期的余额（用于历史月份的月末余额）
  async getBalanceUpTo(dateStr) {
    const all = await super.getAll();
    let income = 0, expense = 0;
    for (const t of all) {
      if ((t.date || '') <= dateStr) {
        if (t.type === 'income') income += t.amount || 0;
        else expense += t.amount || 0;
      }
    }
    return income - expense;
  }

  async getRecent(limit = 5) {
    const all = await this.getAll();
    return all
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, limit);
  }

  async getAll() {
    const all = await super.getAll();
    return all.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(t =>
      (t.notes || '').toLowerCase().includes(lower) ||
      String(t.amount).includes(lower)
    ).slice(0, 20);
  }
}

// ===== AllowanceGoals DAO (V5) — 储蓄目标 =====
class AllowanceGoalsDAO extends BaseDAO {
  constructor() { super('allowanceGoals'); }

  async getAll() {
    const all = await super.getAll();
    return all.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  }

  // 获取指定月份应显示的目标
  async getActiveForMonth(monthStr) {
    const [monthStart, monthEnd] = DateUtils.monthRange(monthStr);
    const all = await this.getAll();
    return all.filter(g => {
      if (g.status === 'cancelled') return false;
      // 优先用 createdDate（手动填的本地日期），否则用 createdAt（ISO）
      const createdDate = g.createdDate || (g.createdAt || '').slice(0, 10);
      if (createdDate > monthEnd) return false;
      if (g.status === 'completed') {
        // 已完成目标：在创建月到完成月之间的所有月份都可见
        // 优先用 completedDate（手动填的），否则用 completedAt
        const completedDate = g.completedDate || (g.completedAt || '').slice(0, 10);
        // 完成日期 >= 当前查看月份的开始 → 在当前月份仍可见
        // 完成日期 < 当前查看月份的开始 → 已超出可见范围
        if (completedDate && completedDate < monthStart) return false;
        return true;
      }
      return true;
    });
  }

  // 计算目标的已存金额（全局累计，从 allowance 记录中汇总）
  async getGoalProgress(goalId) {
    const allRecords = await DAO.allowance.getAll();
    let saved = 0;
    for (const t of allRecords) {
      // 收入分配到目标
      if (t.type === 'income' && t.goalId === goalId) {
        saved += t.allocationAmount != null ? t.allocationAmount : (t.amount || 0);
      }
      // 支出来自目标
      if (t.type === 'expense' && t.expenseFromGoal === goalId) {
        saved -= t.amount || 0;
      }
    }
    return saved;
  }
}

// ===== LifeRecipes DAO (V3) =====
class LifeRecipesDAO extends BaseDAO {
  constructor() { super('lifeRecipes'); }

  async getByCategory(category) {
    const all = await this.getAll();
    if (category === 'all') return all;
    if (category === 'favorite') return all.filter(r => !!r.favorite);
    return all.filter(r => r.category === category);
  }

  async toggleFavorite(id) {
    const recipe = await this.getById(id);
    if (!recipe) return null;
    return await this.update(id, { favorite: !recipe.favorite });
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(r =>
      (r.name || '').toLowerCase().includes(lower) ||
      (r.notes || '').toLowerCase().includes(lower) ||
      (r.source || '').toLowerCase().includes(lower) ||
      (Array.isArray(r.ingredients) ? r.ingredients.join(' ') : '').toLowerCase().includes(lower)
    ).slice(0, 20);
  }
}

// ===== Inventory DAO =====
class InventoryDAO extends BaseDAO {
  constructor() { super('inventory'); }

  async getLowStock() {
    const all = await this.getAll();
    return all.filter(i => i.quantity <= (i.minQuantity || 0));
  }
}

// ===== PuffTodos DAO =====
class PuffTodosDAO extends BaseDAO {
  constructor() { super('puffTodos'); }

  async getActive() {
    const all = await this.getAll();
    return all.filter(t => !t.completed).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  async getCompleted() {
    const all = await this.getAll();
    return all.filter(t => t.completed).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  }
}

// ===== SocialPosts DAO =====
class SocialPostsDAO extends BaseDAO {
  constructor() { super('socialPosts'); }

  async getPlanned() {
    const all = await this.getAll();
    return all.filter(p => p.status === 'planned').sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
  }
}

// ===== Notes DAO =====
class NotesDAO extends BaseDAO {
  constructor() { super('notes'); }

  async getActive() {
    const all = await this.getAll();
    return all
      .filter(n => !n.archived)
      .sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }

  async getArchived() {
    const all = await this.getAll();
    return all.filter(n => n.archived)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async getFavorites() {
    const all = await this.getAll();
    return all
      .filter(n => !n.archived && n.favorite)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async toggleFavorite(id) {
    const note = await this.getById(id);
    if (!note) return null;
    return await this.update(id, { favorite: !note.favorite });
  }

  async getByTag(tag) {
    const all = await this.getAll();
    return all.filter(n =>
      (Array.isArray(n.tags) && n.tags.includes(tag)) ||
      (Array.isArray(n.styleTags) && n.styleTags.includes(tag))
    );
  }

  async getAllTags() {
    const all = await this.getAll();
    const tagSet = new Set();
    all.forEach(n => {
      if (Array.isArray(n.tags)) n.tags.forEach(t => tagSet.add(t));
      if (Array.isArray(n.styleTags)) n.styleTags.forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }

  // 兼容旧代码
  async togglePin(id) {
    const note = await this.getById(id);
    if (!note) return null;
    return await this.update(id, { pinned: !note.pinned, favorite: !note.favorite });
  }

  async archive(id) {
    return await this.update(id, { archived: true });
  }

  async unarchive(id) {
    return await this.update(id, { archived: false });
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(n => {
      const cat = CATEGORIES.getNoteCategory(n.category);
      const catLabel = (cat?.label || '').toLowerCase();
      return (n.title || '').toLowerCase().includes(lower) ||
             (n.content || '').toLowerCase().includes(lower) ||
             (n.remarks || '').toLowerCase().includes(lower) ||
             catLabel.includes(lower) ||
             (Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(lower))) ||
             (Array.isArray(n.styleTags) && n.styleTags.some(t => t.toLowerCase().includes(lower))) ||
             (n.brand || '').toLowerCase().includes(lower);
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 30);
  }
}

// ===== Menus DAO =====
class MenusDAO extends BaseDAO {
  constructor() { super('menus'); }

  async getActive() {
    const all = await this.getAll();
    return all.filter(m => !m.archived).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  async getArchived() {
    const all = await this.getAll();
    return all.filter(m => m.archived).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  async archive(id) {
    return await this.update(id, { archived: true });
  }

  async unarchive(id) {
    return await this.update(id, { archived: false });
  }
}

// ===== Wishlist DAO =====
class WishlistDAO extends BaseDAO {
  constructor() { super('wishlist'); }

  async getActive() {
    const all = await this.getAll();
    return all
      .filter(w => !w.archived && !w.purchased)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getPurchased() {
    const all = await this.getAll();
    return all.filter(w => w.purchased && !w.archived).sort((a, b) => (b.purchasedAt || '').localeCompare(a.purchasedAt || ''));
  }

  async getArchived() {
    const all = await this.getAll();
    return all.filter(w => w.archived).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async togglePurchased(id) {
    const item = await this.getById(id);
    if (!item) return null;
    return await this.update(id, {
      purchased: !item.purchased,
      purchasedAt: !item.purchased ? new Date().toISOString() : null,
    });
  }

  async getStats() {
    const all = await this.getAll();
    let total = 0, purchased = 0;
    for (const w of all) {
      if (!w.archived) {
        total += w.estimatedPrice || 0;
        if (w.purchased) purchased += w.estimatedPrice || 0;
      }
    }
    return { total, purchased, remaining: total - purchased };
  }

  async archive(id) {
    return await this.update(id, { archived: true });
  }

  async unarchive(id) {
    return await this.update(id, { archived: false });
  }

  async search(keyword) {
    const all = await this.getAll();
    const lower = keyword.toLowerCase();
    return all.filter(w =>
      (w.name || '').toLowerCase().includes(lower) ||
      (w.notes || '').toLowerCase().includes(lower)
    ).slice(0, 20);
  }
}

// ===== 统一注册 =====
window.DAO = {
  todos: new TodosDAO(),
  shopping: new ShoppingDAO(),
  transactions: new TransactionsDAO(),
  budgets: new BudgetsDAO(),
  alex: new AlexDAO(),
  pets: new PetsDAO(),
  orders: new OrdersDAO(),
  products: new ProductsDAO(),
  customers: new CustomersDAO(),
  recipes: new RecipesDAO(),
  pickupPoints: new PickupPointsDAO(),
  allowance: new AllowanceDAO(),
  allowanceGoals: new AllowanceGoalsDAO(),
  lifeRecipes: new LifeRecipesDAO(),
  inventory: new InventoryDAO(),
  puffTodos: new PuffTodosDAO(),
  socialPosts: new SocialPostsDAO(),
  notes: new NotesDAO(),
  menus: new MenusDAO(),
  wishlist: new WishlistDAO(),
};

})();
