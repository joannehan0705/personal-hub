(function() {
/**
 * Personal Hub — 数据管理页面 V2
 * 新增：数据库信息显示、数据统计、origin 检测
 */

const { createElement: h, useState, useEffect, useRef } = React;

function DataManagement() {
  const { showToast, refreshData } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);
  const [importMode, setImportMode] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [lastBackup, setLastBackup] = useState(null);
  const fileInputRef = useRef(null);

  // 加载数据库信息和统计数据
  useEffect(() => {
    loadDbInfo();
  }, []);

  const loadDbInfo = async () => {
    try {
      const db = window.db;
      if (!db) return;

      // 基本信息
      const info = {
        name: db.name,
        version: db.version,
        origin: window.location.origin,
        stores: Array.from(db.objectStoreNames),
        lastBackup: null,
        counts: {},
      };

      // 各 store 记录数量
      for (const store of info.stores) {
        try {
          info.counts[store] = await db.count(store);
        } catch(e) {
          info.counts[store] = 'error';
        }
      }

      // 最后备份时间
      const backupMeta = await db.get('meta', 'lastBackupDate');
      if (backupMeta) {
        info.lastBackup = backupMeta.value;
      }

      setDbInfo(info);
    } catch(e) {
      console.error('加载数据库信息失败:', e);
    }
  };

  const handleExportJSON = async () => {
    try {
      await BackupUtils.exportAndDownload();
      showToast('JSON 已导出', 'success');
      refreshData();
      loadDbInfo(); // 刷新备份时间
    } catch (err) {
      showToast('导出失败：' + err.message, 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      const allTx = await DAO.transactions.getAll();
      if (allTx.length === 0) {
        showToast('没有记账数据可导出', 'warning');
        return;
      }
      const csv = CSVUtils.transactionsToCSV(allTx.sort((a, b) => b.date.localeCompare(a.date)));
      CSVUtils.download(csv, CSVUtils.filename('transactions', 'csv'));
      showToast('CSV 已导出', 'success');
    } catch (err) {
      showToast('导出失败：' + err.message, 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await BackupUtils.readFile(file);
      BackupUtils.validate(data);
      setPendingData(data);
      setImportMode('choose');
    } catch (err) {
      showToast(err.message, 'error');
    }
    e.target.value = '';
  };

  const handleImportOverwrite = async () => {
    if (!pendingData) return;
    try {
      await BackupUtils.importOverwrite(pendingData);
      showToast('数据已覆盖导入', 'success');
      refreshData();
      loadDbInfo();
    } catch (err) {
      showToast('导入失败：' + err.message, 'error');
    }
    setPendingData(null);
    setImportMode(null);
  };

  const handleImportMerge = async () => {
    if (!pendingData) return;
    try {
      await BackupUtils.importMerge(pendingData);
      showToast('数据已合并导入', 'success');
      refreshData();
      loadDbInfo();
    } catch (err) {
      showToast('导入失败：' + err.message, 'error');
    }
    setPendingData(null);
    setImportMode(null);
  };

  const handleClear = async () => {
    setConfirmClear(false);
    try {
      await BackupUtils.clearAll();
      showToast('数据已清空，可随时恢复', 'success');
      refreshData();
      loadDbInfo();
    } catch (err) {
      showToast('清空失败：' + err.message, 'error');
    }
  };

  const handleRestore = async () => {
    try {
      const hasBackup = await BackupUtils.hasBackup();
      if (!hasBackup) {
        showToast('没有可恢复的备份', 'warning');
        return;
      }
      await BackupUtils.restoreFromBackup();
      showToast('数据已恢复', 'success');
      refreshData();
      loadDbInfo();
    } catch (err) {
      showToast('恢复失败：' + err.message, 'error');
    }
  };

  const menuItem = (icon, title, subtitle, onClick, danger = false) =>
    h('div', {
      onClick: () => { Haptics.light(); onClick(); },
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-lg) var(--space-xl)',
        cursor: 'pointer',
        borderBottom: '1px solid var(--color-border-light)',
      }
    },
      h('div', {
        style: {
          width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
          backgroundColor: danger ? 'rgba(232,130,107,0.1)' : 'var(--color-bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }
      }, h(Icon, { name: icon, size: 20, color: danger ? 'var(--color-deadline)' : 'var(--color-text-secondary)' })),
      h('div', { style: { flex: 1 } },
        h('div', { style: { fontSize: '17px', color: danger ? 'var(--color-deadline)' : 'var(--color-text-primary)' } }, title),
        h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, subtitle)
      )
    );

  const friendlyDate = (isoStr) => {
    if (!isoStr) return '从未';
    try {
      const d = new Date(isoStr);
      return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    } catch(e) { return isoStr; }
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, { title: '数据管理', showBack: true }),

    h('div', { className: 'scroll-container page' },
      h('div', { style: { padding: '0 0 var(--space-md)' } },

        // ===== 数据库信息卡片 =====
        dbInfo && h(Card, { style: { marginBottom: 'var(--space-md)' } },
          h('div', { style: { fontSize: '15px', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-accent)' } }, '📊 数据库信息'),
          h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '14px' } },
            h('div', null,
              h('div', { style: { color: 'var(--color-text-tertiary)', fontSize: '12px' } }, '数据库名称'),
              h('div', { style: { fontWeight: 500 } }, dbInfo.name),
            ),
            h('div', null,
              h('div', { style: { color: 'var(--color-text-tertiary)', fontSize: '12px' } }, '数据库版本'),
              h('div', { style: { fontWeight: 500 } }, `v${dbInfo.version}`),
            ),
            h('div', null,
              h('div', { style: { color: 'var(--color-text-tertiary)', fontSize: '12px' } }, '访问 Origin'),
              h('div', { style: { fontWeight: 500, fontSize: '13px', wordBreak: 'break-all' } }, dbInfo.origin),
            ),
            h('div', null,
              h('div', { style: { color: 'var(--color-text-tertiary)', fontSize: '12px' } }, '最后备份'),
              h('div', { style: { fontWeight: 500 } }, friendlyDate(dbInfo.lastBackup)),
            ),
          ),
          // 数据统计
          h('div', { style: { marginTop: 'var(--space-md)', fontSize: '13px', color: 'var(--color-text-secondary)' } },
            h('div', { style: { fontWeight: 600, marginBottom: 'var(--space-xs)' } }, '各模块记录数'),
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-xs)' } },
              dbInfo.stores.filter(s => s !== 'meta').map(store =>
                h('div', { key: store, style: { display: 'flex', justifyContent: 'space-between', padding: '2px 6px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-xs)' } },
                  h('span', null, store),
                  h('span', { className: 'numeric', style: { fontWeight: 500 } }, dbInfo.counts[store] || 0),
                )
              )
            ),
          ),
        ),

        // ===== 备份与恢复 =====
        h('div', { className: 'section-header' }, h('span', null, '备份与恢复')),
        h(Card, { padding: false },
          menuItem('export', '导出完整 JSON', '备份全部数据为 JSON 文件', handleExportJSON),
          menuItem('import', '导入 JSON', '从备份文件恢复数据', handleImportClick),
          menuItem('download', '导出 CSV', '导出记账数据为 CSV', handleExportCSV),
          menuItem('refresh', '恢复数据', '恢复到上次导入前的备份', handleRestore),
        ),

        // ===== 危险操作 =====
        h('div', { className: 'section-header', style: { color: 'var(--color-deadline)' } }, h('span', null, '危险操作')),
        h(Card, { padding: false },
          menuItem('trash', '清空数据', '删除所有数据（会自动备份）', () => setConfirmClear(true), true),
        ),

        h('div', {
          style: {
            padding: 'var(--space-xl)',
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
            lineHeight: 1.6,
          }
        },
          '所有数据保存在设备本地的 IndexedDB 中。建议定期导出 JSON 备份。换手机或清除浏览器数据会导致数据丢失，请提前备份。',
          h('br'),
          h('br'),
          'Safari 浏览器和添加到主屏幕的 PWA 共享同一个 IndexedDB（同一 origin），数据不会因添加到主屏幕而丢失。',
        ),
      )
    ),

    // 隐藏的文件选择器
    h('input', {
      ref: fileInputRef,
      type: 'file',
      accept: '.json,application/json',
      onChange: handleFileChange,
      style: { display: 'none' }
    }),

    // 清空确认
    h(ConfirmDialog, {
      open: confirmClear,
      title: '确认清空所有数据？',
      message: '此操作将删除所有数据（待办、购物、记账、Alex、零用钱、储蓄目标、宠物、订单、食谱、取货点、笔记等）。系统会自动创建备份，你可以随时通过「恢复数据」找回。',
      confirmText: '清空',
      danger: true,
      onConfirm: handleClear,
      onCancel: () => setConfirmClear(false),
    }),

    // 导入模式选择
    h(ConfirmDialog, {
      open: importMode === 'choose',
      title: '选择导入方式',
      message: '覆盖模式将清空当前数据后导入；合并模式将保留已有数据，仅添加新记录。',
      confirmText: '覆盖导入',
      cancelText: '合并导入',
      danger: true,
      onConfirm: handleImportOverwrite,
      onCancel: handleImportMerge,
    }),
  );
}

window.DataManagement = DataManagement;

})();
