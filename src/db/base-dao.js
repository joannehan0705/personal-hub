(function() {
/**
 * Personal Hub — 基础 DAO 类
 * 封装通用的 CRUD 操作，各模块 DAO 继承此类
 */

class BaseDAO {
  constructor(storeName) {
    this.storeName = storeName;
  }

  /**
   * 获取 DB 实例
   */
  async getDB() {
    if (window.db) return window.db;
    return await window.dbReady;
  }

  /**
   * 新增记录
   */
  async create(data) {
    const db = await this.getDB();
    const id = data.id || generateId();
    const now = new Date().toISOString();
    const record = {
      ...data,
      id,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    await db.put(this.storeName, record);
    return record;
  }

  /**
   * 按 ID 查询
   */
  async getById(id) {
    const db = await this.getDB();
    return await db.get(this.storeName, id);
  }

  /**
   * 查询全部
   */
  async getAll() {
    const db = await this.getDB();
    return await db.getAll(this.storeName);
  }

  /**
   * 按索引查询
   */
  async getByIndex(indexName, value) {
    const db = await this.getDB();
    return await db.getAllFromIndex(this.storeName, indexName, value);
  }

  /**
   * 更新记录
   */
  async update(id, updates) {
    const db = await this.getDB();
    const existing = await db.get(this.storeName, id);
    if (!existing) throw new Error(`记录不存在: ${id}`);
    const updated = {
      ...existing,
      ...updates,
      id, // 确保 ID 不被覆盖
      updatedAt: new Date().toISOString(),
    };
    await db.put(this.storeName, updated);
    return updated;
  }

  /**
   * 替换整条记录（保留 ID）
   */
  async save(record) {
    const db = await this.getDB();
    const now = new Date().toISOString();
    const data = {
      ...record,
      updatedAt: now,
    };
    if (!data.createdAt) data.createdAt = now;
    await db.put(this.storeName, data);
    return data;
  }

  /**
   * 删除
   */
  async delete(id) {
    const db = await this.getDB();
    await db.delete(this.storeName, id);
  }

  /**
   * 清空
   */
  async clear() {
    const db = await this.getDB();
    await db.clear(this.storeName);
  }

  /**
   * 批量写入
   */
  async bulkPut(records) {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    await Promise.all(records.map(r => tx.store.put(r)));
    await tx.done;
  }

  /**
   * 统计数量
   */
  async count() {
    const db = await this.getDB();
    return await db.count(this.storeName);
  }
}

window.BaseDAO = BaseDAO;

})();
