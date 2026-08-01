(function() {
/**
 * Personal Hub — 全局搜索页面
 */

const { createElement: h, useState, useEffect } = React;

function SearchPage() {
  const { navigate } = useApp();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('ph_search_history') || '[]');
    setHistory(saved);
  }, []);

  useEffect(() => {
    if (!keyword.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => doSearch(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const doSearch = async (kw) => {
    const [todos, shopping, orders, alex, pets, txs, notes, wishlist] = await Promise.all([
      DAO.todos.search(kw),
      DAO.shopping.search(kw),
      DAO.orders.search(kw),
      DAO.alex.search(kw),
      DAO.pets.search(kw),
      DAO.transactions.search(kw),
      DAO.notes ? DAO.notes.search(kw) : [],
      DAO.wishlist ? DAO.wishlist.search(kw) : [],
    ]);

    setResults({ todos, shopping, orders, alex, pets, txs, notes, wishlist });
  };

  const saveHistory = (kw) => {
    const updated = [kw, ...history.filter(h => h !== kw)].slice(0, APP_CONFIG.maxSearchHistory);
    setHistory(updated);
    localStorage.setItem('ph_search_history', JSON.stringify(updated));
  };

  const handleResultClick = (type) => {
    if (keyword.trim()) saveHistory(keyword.trim());
    switch (type) {
      case 'todo': navigate('/todo'); break;
      case 'shopping': navigate('/shopping'); break;
      case 'order': navigate('/puff/orders'); break;
      case 'alex': navigate('/alex'); break;
      case 'pet': navigate('/pets'); break;
      case 'finance': navigate('/finance'); break;
      case 'note': navigate('/notes'); break;
      case 'wishlist': navigate('/wishlist'); break;
    }
  };

  const hasResults = results && Object.values(results).some(arr => arr.length > 0);

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, { title: '搜索', showBack: true,}),

    h(SearchBar, { value: keyword, onChange: setKeyword, placeholder: '搜索全部内容...', autoFocus: true }),

    h('div', { className: 'scroll-container page' },
      !results && history.length > 0 && h('div', null,
        h('div', { className: 'section-header' }, h('span', null, '搜索历史')),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' } },
          history.map((h, i) =>
            h('button', {
              key: i,
              onClick: () => setKeyword(h),
              style: {
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text-secondary)',
              }
            }, h)
          )
        )
      ),

      results && !hasResults && h(EmptyState, { icon: '🔍', title: '没有找到相关内容', subtitle: '试试其他关键词' }),

      results && hasResults && h('div', null,
        results.todos.length > 0 && h('div', null,
          h('div', { className: 'section-header', onClick: () => handleResultClick('todo'), style: { cursor: 'pointer' } },
            h('span', null, '📋 待办'), h('span', { className: 'count' }, `${results.todos.length} >`)
          ),
          results.todos.slice(0, 3).map(t =>
            h(Card, { key: t.id, onClick: () => handleResultClick('todo'), style: { marginBottom: 'var(--space-xs)' } },
              h('div', { style: { fontSize: '15px' } }, t.title),
              t.notes && h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, t.notes)
            )
          )
        ),

        results.shopping.length > 0 && h('div', null,
          h('div', { className: 'section-header', onClick: () => handleResultClick('shopping'), style: { cursor: 'pointer' } },
            h('span', null, '🛒 购物'), h('span', { className: 'count' }, `${results.shopping.length} >`)
          ),
          results.shopping.slice(0, 3).map(s =>
            h(Card, { key: s.id, onClick: () => handleResultClick('shopping'), style: { marginBottom: 'var(--space-xs)' } },
              h('div', { style: { fontSize: '15px' } }, s.name)
            )
          )
        ),

        results.orders.length > 0 && h('div', null,
          h('div', { className: 'section-header', onClick: () => handleResultClick('order'), style: { cursor: 'pointer' } },
            h('span', null, '🧁 订单'), h('span', { className: 'count' }, `${results.orders.length} >`)
          ),
          results.orders.slice(0, 3).map(o =>
            h(Card, { key: o.id, onClick: () => handleResultClick('order'), style: { marginBottom: 'var(--space-xs)' } },
              h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
                h('span', { style: { fontSize: '15px', fontWeight: 600 }, className: 'numeric' }, FormatUtils.orderNumber(o.orderNumber)),
                h('span', { style: { fontSize: '15px' } }, o.customer)
              )
            )
          )
        ),

        results.alex.length > 0 && h('div', null,
          h('div', { className: 'section-header', onClick: () => handleResultClick('alex'), style: { cursor: 'pointer' } },
            h('span', null, '👦 Alex'), h('span', { className: 'count' }, `${results.alex.length} >`)
          ),
          results.alex.slice(0, 3).map(r =>
            h(Card, { key: r.id, onClick: () => handleResultClick('alex'), style: { marginBottom: 'var(--space-xs)' } },
              h('div', { style: { fontSize: '15px' } }, r.title),
              r.date && h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, DateUtils.friendlyDate(r.date))
            )
          )
        ),

        results.pets.length > 0 && h('div', null,
          h('div', { className: 'section-header', onClick: () => handleResultClick('pet'), style: { cursor: 'pointer' } },
            h('span', null, '🐾 宠物'), h('span', { className: 'count' }, `${results.pets.length} >`)
          ),
          results.pets.slice(0, 3).map(r =>
            h(Card, { key: r.id, onClick: () => handleResultClick('pet'), style: { marginBottom: 'var(--space-xs)' } },
              h('div', { style: { fontSize: '15px' } }, r.title),
              h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } },
                `${APP_CONFIG.pets.find(p => p.key === r.petName)?.label || r.petName} · ${DateUtils.friendlyDate(r.date)}`
              )
            )
          )
        ),

        results.txs.length > 0 && h('div', null,
          h('div', { className: 'section-header', onClick: () => handleResultClick('finance'), style: { cursor: 'pointer' } },
            h('span', null, '💰 记账'), h('span', { className: 'count' }, `${results.txs.length} >`)
          ),
          results.txs.slice(0, 3).map(t =>
            h(Card, { key: t.id, onClick: () => handleResultClick('finance'), style: { marginBottom: 'var(--space-xs)' } },
              h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
                h('span', { style: { fontSize: '15px' } },
                  (t.type === 'income'
                    ? (t.scope === 'puff' ? CATEGORIES.getPuffIncomeCategory(t.category) : CATEGORIES.getIncomeCategory(t.category)).label
                    : (t.scope === 'puff' ? CATEGORIES.getPuffExpenseCategory(t.category) : CATEGORIES.getExpenseCategory(t.category)).label)
                ),
                h('span', { style: { fontSize: '15px', fontWeight: 600 }, className: 'numeric' }, FormatUtils.moneyWithType(t.amount, t.type))
              ),
              h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, DateUtils.friendlyDate(t.date))
            )
          )
        ),

        results.notes && results.notes.length > 0 && h('div', null,
          h('div', { className: 'section-header', onClick: () => handleResultClick('note'), style: { cursor: 'pointer' } },
            h('span', null, '✏️ 灵感'), h('span', { className: 'count' }, `${results.notes.length} >`)
          ),
          results.notes.slice(0, 3).map(n =>
            h(Card, { key: n.id, onClick: () => handleResultClick('note'), style: { marginBottom: 'var(--space-xs)' } },
              h('div', { style: { fontSize: '15px' } }, n.title || '无标题'),
              n.content && h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, n.content)
            )
          )
        ),

        results.wishlist && results.wishlist.length > 0 && h('div', null,
          h('div', { className: 'section-header', onClick: () => handleResultClick('wishlist'), style: { cursor: 'pointer' } },
            h('span', null, '⭐ 心愿'), h('span', { className: 'count' }, `${results.wishlist.length} >`)
          ),
          results.wishlist.slice(0, 3).map(w =>
            h(Card, { key: w.id, onClick: () => handleResultClick('wishlist'), style: { marginBottom: 'var(--space-xs)' } },
              h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
                h('span', { style: { fontSize: '15px' } }, w.name),
                w.estimatedPrice && h('span', { style: { fontSize: '15px', fontWeight: 500 }, className: 'numeric' }, FormatUtils.money(w.estimatedPrice))
              )
            )
          )
        ),
      )
    )
  );
}

window.SearchPage = SearchPage;

})();
