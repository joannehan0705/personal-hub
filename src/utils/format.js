(function() {
/**
 * Personal Hub — 格式化工具
 */

const FormatUtils = {
  /**
   * 格式化金额
   * 35 → "$35"
   * 35.5 → "$35.50"
   * 1280 → "$1,280"
   */
  money(amount, withSign = false) {
    if (amount == null || isNaN(amount)) return '$0';
    const num = Math.abs(amount);
    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    const sign = amount < 0 ? '-' : (withSign ? '+' : '');
    return `${sign}$${formatted}`;
  },

  /**
   * 格式化金额带类型（收入/支出）
   * 支出: "-$35" (红色)
   * 收入: "+$280" (绿色)
   */
  moneyWithType(amount, type) {
    const prefix = type === 'income' ? '+' : '-';
    return `${prefix}$${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  },

  /**
   * 时间显示 HH:mm → "下午 4:00"
   */
  time(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    return `${h}:${String(m).padStart(2, '0')}`;
  },

  /**
   * 相对时间
   * "刚刚" / "3分钟前" / "2小时前" / "昨天" / "3天前" / "7月28日"
   */
  relativeTime(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return DateUtils.friendlyDate(DateUtils.toDateStr(new Date(timestamp)));
  },

  /**
   * 订单号格式化
   * 29 → "#029"
   */
  orderNumber(num) {
    return `#${String(num).padStart(3, '0')}`;
  },

  /**
   * 百分比
   * 0.75 → "75%"
   * 1.2 → "120%"
   */
  percent(value) {
    return `${Math.round(value * 100)}%`;
  },
};

window.FormatUtils = FormatUtils;

})();
