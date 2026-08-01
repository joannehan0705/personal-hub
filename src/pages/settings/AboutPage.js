(function() {
/**
 * Personal Hub — 关于页面
 */

const { createElement: h } = React;

function AboutPage() {
  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, { title: '关于', showBack: true,}),

    h('div', { className: 'scroll-container page' },
      h('div', { style: { textAlign: 'center', padding: 'var(--space-4xl) 0 var(--space-3xl)' } },
        h('div', { style: { fontSize: '72px', marginBottom: 'var(--space-md)' } }, '🧁'),
        h('div', { style: { fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' } }, 'Personal Hub'),
        h('div', { style: { fontSize: '15px', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-xs)' }, className: 'numeric' },
          `Version ${APP_CONFIG.version}`
        ),
      ),

      h(Card, { style: { marginBottom: 'var(--space-md)' } },
        h('div', { style: { fontSize: '15px', lineHeight: 1.7, color: 'var(--color-text-secondary)' } },
          'Personal Hub 是一个完全本地化、永久免费、离线可用的个人生活管理工作台。',
          h('br'),
          h('br'),
          '管理你的待办、购物、记账、Alex、宠物 Cookie & Puff、以及 anan puff lab 泡芙品牌。',
          h('br'),
          h('br'),
          '所有数据仅保存在你的设备本地，不上传、不统计、不追踪。',
        )
      ),

      h('div', { className: 'section-header' }, h('span', null, '特性')),
      h(Card, { padding: false },
        [
          { icon: '🔒', title: '完全私密', desc: '数据仅存于本地 IndexedDB' },
          { icon: ' offline', title: '离线可用', desc: 'Service Worker 全缓存' },
          { icon: ' free', title: '永久免费', desc: '无广告、无订阅、无第三方' },
          { icon: ' backup', title: '数据自主', desc: 'JSON 导入导出，换机不丢' },
        ].map((f, i) =>
          h('div', {
            key: i,
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              padding: 'var(--space-lg) var(--space-xl)',
              borderBottom: i < 3 ? '1px solid var(--color-border-light)' : 'none',
            }
          },
            h('div', { style: { fontSize: '24px', width: '32px', textAlign: 'center' } }, f.icon.trim()),
            h('div', null,
              h('div', { style: { fontSize: '17px', color: 'var(--color-text-primary)' } }, f.title),
              h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, f.desc)
            )
          )
        )
      ),

      h('div', { style: { textAlign: 'center', padding: 'var(--space-3xl) 0', fontSize: '13px', color: 'var(--color-text-tertiary)' } },
        'Made with care',
        h('br'),
        '© 2026 Personal Hub'
      )
    )
  );
}

window.AboutPage = AboutPage;

})();
