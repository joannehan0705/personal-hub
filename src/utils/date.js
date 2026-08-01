(function() {
/**
 * Personal Hub — 日期处理工具
 */

const DateUtils = {
  /**
   * 获取今天的日期（ISO 日期字符串 YYYY-MM-DD）
   */
  today() {
    return this.toDateStr(new Date());
  },

  /**
   * Date 转 ISO 日期字符串 YYYY-MM-DD
   */
  toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /**
   * ISO 日期字符串转 Date 对象
   */
  parse(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr + 'T00:00:00');
  },

  /**
   * 获取本周一的日期
   */
  startOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // 周一为一周开始
    now.setDate(now.getDate() + diff);
    now.setHours(0, 0, 0, 0);
    return this.toDateStr(now);
  },

  /**
   * 获取本周日的日期
   */
  endOfWeek() {
    const start = this.parse(this.startOfWeek());
    start.setDate(start.getDate() + 6);
    return this.toDateStr(start);
  },

  /**
   * 获取当前月份 YYYY-MM
   */
  currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },

  /**
   * 判断日期是否是今天
   */
  isToday(dateStr) {
    return dateStr === this.today();
  },

  /**
   * 判断日期是否在本周
   */
  isThisWeek(dateStr) {
    if (!dateStr) return false;
    return dateStr >= this.startOfWeek() && dateStr <= this.endOfWeek();
  },

  /**
   * 判断日期是否在未来（今天之后）
   */
  isFuture(dateStr) {
    return dateStr > this.today();
  },

  /**
   * 判断日期是否在过去（今天之前）
   */
  isPast(dateStr) {
    return dateStr < this.today();
  },

  /**
   * 获取两个日期之间的天数差
   */
  daysBetween(dateStr1, dateStr2) {
    const d1 = this.parse(dateStr1);
    const d2 = this.parse(dateStr2);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  },

  /**
   * 距今天的天数（正数=未来，负数=过去）
   */
  daysFromToday(dateStr) {
    return this.daysBetween(this.today(), dateStr);
  },

  /**
   * 友好日期显示
   * 今天 → "今天"
   * 明天 → "明天"
   * 昨天 → "昨天"
   * 本周 → "周三"
   * 其他 → "7月28日"
   */
  friendlyDate(dateStr) {
    if (!dateStr) return '';
    const diff = this.daysFromToday(dateStr);
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    if (diff === -1) return '昨天';
    if (diff > 1 && diff <= 7) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return days[this.parse(dateStr).getDay()];
    }
    const date = this.parse(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  /**
   * 完整日期显示
   * "2026年7月28日 周二"
   */
  fullDate(dateStr) {
    const date = dateStr ? this.parse(dateStr) : new Date();
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${days[date.getDay()]}`;
  },

  /**
   * 获取未来 N 天的日期范围
   * 返回 [startDate, endDate]
   */
  nextDays(n) {
    const start = this.today();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + n);
    return [start, this.toDateStr(endDate)];
  },

  /**
   * 加天数
   */
  addDays(dateStr, days) {
    const date = this.parse(dateStr);
    date.setDate(date.getDate() + days);
    return this.toDateStr(date);
  },

  /**
   * 月份导航：上一个月
   */
  prevMonth(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    if (m === 1) return `${y - 1}-12`;
    return `${y}-${String(m - 1).padStart(2, '0')}`;
  },

  /**
   * 月份导航：下一个月
   */
  nextMonth(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    if (m === 12) return `${y + 1}-01`;
    return `${y}-${String(m + 1).padStart(2, '0')}`;
  },

  /**
   * 月份显示
   * "2026年7月"
   */
  monthLabel(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    return `${y}年${m}月`;
  },

  /**
   * 获取某月的日期范围
   * 返回 [firstDay, lastDay]
   */
  monthRange(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    const first = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDate = new Date(y, m, 0);
    const last = `${y}-${String(m).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;
    return [first, last];
  },
};

window.DateUtils = DateUtils;

})();
