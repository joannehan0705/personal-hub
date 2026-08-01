(function() {
/**
 * Personal Hub — CSV 导出工具
 */

const CSVUtils = {
  /**
   * 将记账数据导出为 CSV 字符串
   */
  transactionsToCSV(transactions) {
    const headers = ['日期', '类型', '分类', '金额', '备注', '创建时间'];
    const rows = transactions.map(tx => {
      const cat = tx.type === 'income'
        ? (tx.scope === 'puff' ? CATEGORIES.getPuffIncomeCategory(tx.category) : CATEGORIES.getIncomeCategory(tx.category)).label
        : (tx.scope === 'puff' ? CATEGORIES.getPuffExpenseCategory(tx.category) : CATEGORIES.getExpenseCategory(tx.category)).label;
      return [
        tx.date,
        tx.type === 'income' ? '收入' : '支出',
        cat,
        tx.amount,
        tx.notes || '',
        tx.createdAt || '',
      ];
    });

    return this._buildCSV(headers, rows);
  },

  /**
   * 构建 CSV 字符串
   * @private
   */
  _buildCSV(headers, rows) {
    const allRows = [headers, ...rows];
    return allRows.map(row =>
      row.map(cell => {
        // 转义引号和逗号
        const str = String(cell || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');
  },

  /**
   * 触发文件下载
   */
  download(content, filename, mimeType = 'text/csv;charset=utf-8') {
    const blob = new Blob(['\ufeff' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * 生成带日期的文件名
   */
  filename(prefix, ext) {
    const now = new Date();
    const dateStr = DateUtils.toDateStr(now).replace(/-/g, '');
    return `${prefix}_${dateStr}.${ext}`;
  },
};

window.CSVUtils = CSVUtils;

})();
