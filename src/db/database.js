(function() {
/**
 * Personal Hub — IndexedDB 数据库初始化
 * 使用 idb 库封装，创建所有 Object Store 和索引
 */

const DB_NAME = APP_CONFIG.dbName;
const DB_VERSION = APP_CONFIG.dbVersion;

let dbPromise = null;

/**
 * 初始化数据库
 */
function initDB() {
  if (dbPromise) return dbPromise;

  dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // ===== todos =====
      if (!db.objectStoreNames.contains('todos')) {
        const store = db.createObjectStore('todos', { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('priority', 'priority');
        store.createIndex('date', 'date');
        store.createIndex('completedAt', 'completedAt');
      }

      // ===== shopping =====
      if (!db.objectStoreNames.contains('shopping')) {
        const store = db.createObjectStore('shopping', { keyPath: 'id' });
        store.createIndex('category', 'category');
        store.createIndex('purchased', 'purchased');
      }

      // ===== transactions =====
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('type', 'type');
        store.createIndex('category', 'category');
        store.createIndex('date', 'date');
      }

      // ===== budgets =====
      if (!db.objectStoreNames.contains('budgets')) {
        const store = db.createObjectStore('budgets', { keyPath: 'id' });
        store.createIndex('category', 'category');
        store.createIndex('month', 'month');
      }

      // ===== alex =====
      if (!db.objectStoreNames.contains('alex')) {
        const store = db.createObjectStore('alex', { keyPath: 'id' });
        store.createIndex('category', 'category');
        store.createIndex('date', 'date');
      }

      // ===== pets =====
      if (!db.objectStoreNames.contains('pets')) {
        const store = db.createObjectStore('pets', { keyPath: 'id' });
        store.createIndex('petName', 'petName');
        store.createIndex('type', 'type');
        store.createIndex('date', 'date');
        store.createIndex('nextDate', 'nextDate');
      }

      // ===== orders =====
      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('customer', 'customer');
        store.createIndex('pickupDate', 'pickupDate');
        store.createIndex('orderNumber', 'orderNumber');
      }

      // ===== products =====
      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id' });
        store.createIndex('active', 'active');
      }

      // ===== customers =====
      if (!db.objectStoreNames.contains('customers')) {
        const store = db.createObjectStore('customers', { keyPath: 'id' });
        store.createIndex('name', 'name');
      }

      // ===== recipes =====
      if (!db.objectStoreNames.contains('recipes')) {
        db.createObjectStore('recipes', { keyPath: 'id' });
      }

      // ===== inventory =====
      if (!db.objectStoreNames.contains('inventory')) {
        const store = db.createObjectStore('inventory', { keyPath: 'id' });
        store.createIndex('category', 'category');
      }

      // ===== puffTodos =====
      if (!db.objectStoreNames.contains('puffTodos')) {
        const store = db.createObjectStore('puffTodos', { keyPath: 'id' });
        store.createIndex('completed', 'completed');
        store.createIndex('date', 'date');
      }

      // ===== socialPosts =====
      if (!db.objectStoreNames.contains('socialPosts')) {
        const store = db.createObjectStore('socialPosts', { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('scheduledDate', 'scheduledDate');
      }

      // ===== notes (V2, V6 增强) =====
      if (!db.objectStoreNames.contains('notes')) {
        const store = db.createObjectStore('notes', { keyPath: 'id' });
        store.createIndex('category', 'category');
        store.createIndex('pinned', 'pinned');
        store.createIndex('archived', 'archived');
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('favorite', 'favorite');
        store.createIndex('tags', 'tags', { multiEntry: true });
      } else if (oldVersion < 7) {
        // V5/V6→V7 升级：补充 favorite 和 tags 索引
        const store = transaction.objectStore('notes');
        if (!store.indexNames.contains('favorite')) {
          store.createIndex('favorite', 'favorite');
        }
        if (!store.indexNames.contains('tags')) {
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
      }

      // ===== menus (V2) =====
      if (!db.objectStoreNames.contains('menus')) {
        const store = db.createObjectStore('menus', { keyPath: 'id' });
        store.createIndex('date', 'date');
        store.createIndex('archived', 'archived');
      }

      // ===== wishlist (V2) =====
      if (!db.objectStoreNames.contains('wishlist')) {
        const store = db.createObjectStore('wishlist', { keyPath: 'id' });
        store.createIndex('purchased', 'purchased');
        store.createIndex('archived', 'archived');
      }

      // ===== meta =====
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }

      // ===== lifeRecipes (V3) — 生活食谱 =====
      if (!db.objectStoreNames.contains('lifeRecipes')) {
        const store = db.createObjectStore('lifeRecipes', { keyPath: 'id' });
        store.createIndex('category', 'category');
        store.createIndex('favorite', 'favorite');
        store.createIndex('createdAt', 'createdAt');
      }

      // ===== pickupPoints (V4) — 泡芙取货点 =====
      if (!db.objectStoreNames.contains('pickupPoints')) {
        const store = db.createObjectStore('pickupPoints', { keyPath: 'id' });
        store.createIndex('name', 'name');
      }

      // ===== allowance (V5) — 零用钱记录 =====
      if (!db.objectStoreNames.contains('allowance')) {
        const store = db.createObjectStore('allowance', { keyPath: 'id' });
        store.createIndex('type', 'type');
        store.createIndex('date', 'date');
        store.createIndex('category', 'category');
      }

      // ===== allowanceGoals (V5) — 储蓄目标 =====
      if (!db.objectStoreNames.contains('allowanceGoals')) {
        db.createObjectStore('allowanceGoals', { keyPath: 'id' });
      }
    },
  });

  return dbPromise;
}

// 初始化并暴露到全局
window.initDB = initDB;
window.dbReady = initDB();

// 便捷访问：db 为 Promise<DB>
window.db = null;
window.dbReady.then(database => {
  window.db = database;
  // 初始化 meta 默认值
  database.get('meta', 'orderSequence').then(val => {
    if (val === undefined) {
      database.put('meta', { key: 'orderSequence', value: 0 });
    }
  });
  database.get('meta', 'schemaVersion').then(val => {
    if (val === undefined) {
      database.put('meta', { key: 'schemaVersion', value: DB_VERSION });
    }
  });
  // 一次性迁移：旧订单状态 new→pending, confirmed→making
  database.get('meta', 'orderStatusMigrated').then(val => {
    if (!val) {
      database.getAll('orders').then(orders => {
        let needUpdate = false;
        const updates = orders.map(o => {
          let newStatus = o.status;
          if (o.status === 'new') { newStatus = 'pending'; needUpdate = true; }
          else if (o.status === 'confirmed') { newStatus = 'making'; needUpdate = true; }
          return needUpdate ? { ...o, status: newStatus } : null;
        }).filter(Boolean);
        if (needUpdate) {
          const tx = database.transaction('orders', 'readwrite');
          Promise.all(updates.map(o => tx.store.put(o))).then(() => tx.done);
        }
        database.put('meta', { key: 'orderStatusMigrated', value: true });
      });
    }
  });
  // 一次性迁移：notes V6 — pinned→favorite, 补 tags/remarks 默认值, shopping→quick
  database.get('meta', 'notesMigratedV6').then(val => {
    if (!val) {
      database.getAll('notes').then(notes => {
        const updates = notes.map(n => {
          const needUpdate = n.favorite === undefined || (n.pinned && !n.favorite) || n.tags === undefined || n.remarks === undefined || n.category === 'shopping';
          if (!needUpdate) return null;
          return {
            ...n,
            favorite: n.favorite !== undefined ? n.favorite : (n.pinned || false),
            tags: n.tags || [],
            remarks: n.remarks || '',
            category: n.category === 'shopping' ? 'quick' : n.category,
          };
        }).filter(Boolean);
        if (updates.length > 0) {
          const tx = database.transaction('notes', 'readwrite');
          Promise.all(updates.map(n => tx.store.put(n))).then(() => tx.done);
        }
        database.put('meta', { key: 'notesMigratedV6', value: true });
      });
    }
  });
}).catch(err => {
  console.error('IndexedDB 初始化失败:', err);
});

})();
