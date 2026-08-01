/**
 * Personal Hub �? Service Worker
 * 缓存策略：Cache First，离线优�?
 */

const CACHE_NAME = 'personal-hub-v22';

// 需要缓存的资源
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/styles/theme.css',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/default-icon.png',
  './src/constants/config.js',
  './src/constants/categories.js',
  './src/utils/id.js',
  './src/utils/date.js',
  './src/utils/format.js',
  './src/utils/haptics.js',
  './src/utils/csv.js',
  './src/utils/backup.js',
  './src/db/database.js',
  './src/db/base-dao.js',
  './src/db/dao/index.js',
  './src/store/AppContext.js',
  './src/components/ui/Icon.js',
  './src/components/ui/Button.js',
  './src/components/ui/Input.js',
  './src/components/ui/Card.js',
  './src/components/ui/Checkbox.js',
  './src/components/ui/Tag.js',
  './src/components/ui/Select.js',
  './src/components/layout/Sheet.js',
  './src/components/layout/NavBar.js',
  './src/components/layout/TabBar.js',
  './src/components/layout/FAB.js',
  './src/components/layout/Sidebar.js',
  './src/components/shared/QuickAdd.js',
  './src/components/shared/SearchBar.js',
  './src/pages/todo/TodoPage.js',
  './src/pages/todo/TodoForm.js',
  './src/pages/shopping/ShoppingPage.js',
  './src/pages/shopping/ShoppingForm.js',
  './src/pages/finance/FinancePage.js',
  './src/pages/finance/TransactionForm.js',
  './src/pages/finance/BudgetPage.js',
  './src/pages/finance/StatsPage.js',
  './src/pages/alex/AlexPage.js',
  './src/pages/alex/AlexForm.js',
  './src/pages/alex/AllowancePage.js',
  './src/pages/pets/PetsPage.js',
  './src/pages/pets/PetForm.js',
  './src/pages/life/LifeRecipesPage.js',
  './src/pages/puff/PuffPage.js',
  './src/pages/puff/OrdersPage.js',
  './src/pages/puff/OrderForm.js',
  './src/pages/puff/OrderDetail.js',
  './src/pages/puff/ProductsPage.js',
  './src/pages/puff/ProductForm.js',
  './src/pages/puff/CustomersPage.js',
  './src/pages/puff/RecipesPage.js',
  './src/pages/puff/PickupPointsPage.js',
  './src/pages/puff/InventoryPage.js',
  './src/pages/puff/SocialPage.js',
  './src/pages/puff/PuffFinancePage.js',
  './src/pages/puff/PuffTransactionForm.js',
  './src/pages/puff/MenuPage.js',
  './src/pages/puff/MenuForm.js',
  './src/pages/home/sections/OverviewCard.js',
  './src/pages/home/sections/TodoSection.js',
  './src/pages/home/HomePage.js',
  './src/pages/notes/NotesPage.js',
  './src/pages/notes/NoteForm.js',
  './src/pages/wishlist/WishlistPage.js',
  './src/pages/wishlist/WishlistForm.js',
  './src/pages/settings/SearchPage.js',
  './src/pages/settings/DataManagement.js',
  './src/pages/settings/SettingsPage.js',
  './src/pages/settings/IconCustomizePage.js',
  './src/pages/settings/AboutPage.js',
  './src/app.js',
  // CDN 资源
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://unpkg.com/idb@8.0.0/build/umd.js',
];

// 安装：预缓存所有资�?
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 逐个缓存，避免一个失败导致全部失�?
      await Promise.all(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err => {
            console.log('缓存失败:', url, err.message);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓�?
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 拦截请求：Cache First，fallback to network
self.addEventListener('fetch', (event) => {
  // �? GET 请求直接放行
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // 后台更新缓存
        fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
        }).catch(() => {});
        return cached;
      }

      // 无缓存，从网络获�?
      return fetch(event.request).then(response => {
        if (response.ok && (event.request.url.startsWith('http') || event.request.url.startsWith('https'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // 离线且无缓存
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
