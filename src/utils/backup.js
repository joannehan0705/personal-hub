(function() {
/**
 * Personal Hub — JSON 备份与恢复工具
 */

const BackupUtils = {
  /**
   * 获取数据库中所有 store 名称（动态读取，不硬编码）
   */
  getAllStoreNames() {
    const db = window.db;
    if (!db) return [];
    return Array.from(db.objectStoreNames).filter(s => s !== 'meta');
  },

  /**
   * 导出全部数据为 JSON 对象
   */
  async exportAll() {
    const stores = this.getAllStoreNames();

    const data = {};
    for (const store of stores) {
      data[store] = await window.db.getAll(store);
    }

    // meta 单独处理：导出有用的 meta 数据（排除备份本身）
    const metaAll = await window.db.getAll('meta');
    data['meta'] = metaAll.filter(m => m.key !== 'lastBackupBeforeImport');

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appVersion: APP_CONFIG.version,
      data: data,
    };
  },

  /**
   * 导出 JSON 并下载
   */
  async exportAndDownload() {
    const exportData = await this.exportAll();
    const json = JSON.stringify(exportData, null, 2);
    const filename = CSVUtils.filename('personal-hub-backup', 'json');
    CSVUtils.download(json, filename, 'application/json');

    // 记录导出时间
    await window.db.put('meta', {
      key: 'lastBackupDate',
      value: new Date().toISOString(),
    });
  },

  /**
   * 校验导入数据格式
   */
  validate(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('无效的备份文件：数据格式错误');
    }
    if (!data.version) {
      throw new Error('无效的备份文件：缺少版本信息');
    }
    if (!data.data || typeof data.data !== 'object') {
      throw new Error('无效的备份文件：缺少数据内容');
    }

    // 校验所有 store 数据都是数组
    for (const store of Object.keys(data.data)) {
      if (data.data[store] !== null && !Array.isArray(data.data[store])) {
        throw new Error(`无效的备份文件：${store} 数据格式错误`);
      }
    }

    return true;
  },

  /**
   * 导入数据前自动备份当前数据
   */
  async backupBeforeImport() {
    const backup = await this.exportAll();
    await window.db.put('meta', {
      key: 'lastBackupBeforeImport',
      value: backup,
    });
    return backup;
  },

  /**
   * 导入数据（覆盖模式）
   */
  async importOverwrite(data) {
    this.validate(data);

    // 先备份
    await this.backupBeforeImport();

    const stores = Object.keys(data.data);
    for (const store of stores) {
      if (data.data[store] && Array.isArray(data.data[store])) {
        await window.db.clear(store);
        const tx = window.db.transaction(store, 'readwrite');
        for (const record of data.data[store]) {
          await tx.store.put(record);
        }
        await tx.done;
      }
    }

    // 记录操作日志
    await this.logOperation('import', `覆盖导入，共 ${stores.length} 个数据表`);
  },

  /**
   * 导入数据（合并模式）
   */
  async importMerge(data) {
    this.validate(data);

    // 先备份
    await this.backupBeforeImport();

    let totalImported = 0;
    const stores = Object.keys(data.data);

    for (const store of stores) {
      if (data.data[store] && Array.isArray(data.data[store])) {
        const tx = window.db.transaction(store, 'readwrite');
        for (const record of data.data[store]) {
          // 按 ID 判断：已存在则跳过
          const existing = await tx.store.get(record.id);
          if (!existing) {
            await tx.store.put(record);
            totalImported++;
          }
        }
        await tx.done;
      }
    }

    await this.logOperation('import', `合并导入，新增 ${totalImported} 条记录`);
  },

  /**
   * 清空所有数据（自动备份后清空）
   */
  async clearAll() {
    // 自动备份
    await this.backupBeforeImport();

    const stores = this.getAllStoreNames();

    for (const store of stores) {
      await window.db.clear(store);
    }

    // 重置订单序号
    await window.db.put('meta', { key: 'orderSequence', value: 0 });

    await this.logOperation('clear', '清空所有数据，已自动备份');
  },

  /**
   * 恢复到导入前的备份
   */
  async restoreFromBackup() {
    const meta = await window.db.get('meta', 'lastBackupBeforeImport');
    if (!meta || !meta.value) {
      throw new Error('没有可恢复的备份');
    }

    const backup = meta.value;
    const stores = Object.keys(backup.data);

    for (const store of stores) {
      if (backup.data[store] && Array.isArray(backup.data[store])) {
        await window.db.clear(store);
        const tx = window.db.transaction(store, 'readwrite');
        for (const record of backup.data[store]) {
          await tx.store.put(record);
        }
        await tx.done;
      }
    }

    await this.logOperation('restore', '从导入前备份恢复');
  },

  /**
   * 检查是否有可恢复的备份
   */
  async hasBackup() {
    const meta = await window.db.get('meta', 'lastBackupBeforeImport');
    return !!(meta && meta.value);
  },

  /**
   * 记录操作日志
   */
  async logOperation(action, details) {
    const logMeta = await window.db.get('meta', 'operationLog');
    const log = logMeta?.value || [];
    log.unshift({
      action,
      timestamp: new Date().toISOString(),
      details,
    });
    // 只保留最近 50 条
    if (log.length > 50) log.length = 50;
    await window.db.put('meta', { key: 'operationLog', value: log });
  },

  /**
   * 读取文件内容
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (err) {
          reject(new Error('文件解析失败，请确认是有效的 JSON 备份文件'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  },
};

window.BackupUtils = BackupUtils;

})();
