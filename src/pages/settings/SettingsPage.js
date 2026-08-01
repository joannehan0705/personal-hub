(function() {
/**
 * Personal Hub — 设置页面
 */

const { createElement: h } = React;

function SettingsPage() {
  const { theme, dispatch, ACTIONS, haptics, navigate } = useApp();

  const themeOptions = [
    { key: 'light', label: '浅色' },
    { key: 'dark', label: '深色' },
    { key: 'auto', label: '跟随系统' },
  ];

  const menuItem = (icon, title, subtitle, onClick, rightElement) =>
    h('div', {
      onClick: onClick ? () => { Haptics.light(); onClick(); } : undefined,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-lg) var(--space-xl)',
        cursor: onClick ? 'pointer' : 'default',
        borderBottom: '1px solid var(--color-border-light)',
      }
    },
      h('div', {
        style: {
          width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }
      }, h(Icon, { name: icon, size: 20, color: 'var(--color-text-secondary)' })),
      h('div', { style: { flex: 1 } },
        h('div', { style: { fontSize: '17px', color: 'var(--color-text-primary)' } }, title),
        subtitle && h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, subtitle)
      ),
      rightElement
    );

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, { title: '我的', showBack: false }),

    h('div', { className: 'scroll-container' },
      h('div', { style: { padding: '0 0 var(--space-md)' } },

        // 搜索入口
        h('div', { style: { padding: '0 var(--space-lg) var(--space-md)' } },
          h(Card, {
            onClick: () => navigate('/settings/search'),
            style: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }
          },
            h(Icon, { name: 'search', size: 22, color: 'var(--color-accent)' }),
            h('span', { style: { fontSize: '17px', color: 'var(--color-text-primary)', flex: 1 } }, '搜索'),
            h(Icon, { name: 'chevronRight', size: 18, color: 'var(--color-text-tertiary)' })
          )
        ),

        // 数据管理
        h('div', { className: 'section-header', style: { paddingLeft: 'var(--space-lg)' } }, h('span', null, '个性化')),
        h(Card, { padding: false },
          menuItem('home', '图标自定义', '选择 App 主屏幕图标样式', () => navigate('/settings/icon')),
        ),

        h('div', { className: 'section-header', style: { paddingLeft: 'var(--space-lg)' } }, h('span', null, '数据管理')),
        h(Card, { padding: false },
          menuItem('export', '数据管理', '导入 / 导出 / 清空 / 恢复', () => navigate('/settings/data')),
        ),

        // 偏好设置
        h('div', { className: 'section-header', style: { paddingLeft: 'var(--space-lg)' } }, h('span', null, '偏好设置')),
        h(Card, { padding: false },
          // 主题
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              padding: 'var(--space-lg) var(--space-xl)',
              borderBottom: '1px solid var(--color-border-light)',
            }
          },
            h('div', {
              style: {
                width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }
            }, h(Icon, { name: 'info', size: 20, color: 'var(--color-text-secondary)' })),
            h('div', { style: { flex: 1 } },
              h('div', { style: { fontSize: '17px', color: 'var(--color-text-primary)' } }, '外观'),
            ),
            h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } },
              themeOptions.map(opt =>
                h('button', {
                  key: opt.key,
                  onClick: () => { Haptics.selection(); dispatch({ type: ACTIONS.SET_THEME, payload: opt.key }); },
                  style: {
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '13px',
                    fontWeight: 500,
                    backgroundColor: theme === opt.key ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                    color: theme === opt.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                  }
                }, opt.label)
              )
            )
          ),

          // 触觉反馈
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              padding: 'var(--space-lg) var(--space-xl)',
            }
          },
            h('div', {
              style: {
                width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }
            }, h(Icon, { name: 'bell', size: 20, color: 'var(--color-text-secondary)' })),
            h('div', { style: { flex: 1 } },
              h('div', { style: { fontSize: '17px', color: 'var(--color-text-primary)' } }, '触觉反馈'),
              h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)' } }, '操作时振动'),
            ),
            // Toggle
            h('div', {
              onClick: () => { Haptics.medium(); dispatch({ type: ACTIONS.SET_HAPTICS, payload: !haptics }); },
              style: {
                width: '51px', height: '31px', borderRadius: '16px',
                backgroundColor: haptics ? 'var(--color-accent)' : 'var(--color-border)',
                display: 'flex', alignItems: 'center',
                padding: '2px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                justifyContent: haptics ? 'flex-end' : 'flex-start',
              }
            },
              h('div', {
                style: {
                  width: '27px', height: '27px', borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: 'var(--shadow-1)',
                  transition: 'transform 0.2s',
                }
              })
            )
          ),
        ),

        // 其他
        h('div', { className: 'section-header', style: { paddingLeft: 'var(--space-lg)' } }, h('span', null, '其他')),
        h(Card, { padding: false },
          menuItem('info', '关于', `Personal Hub v${APP_CONFIG.version}`, () => navigate('/settings/about')),
        ),

        // 底部信息
        h('div', {
          style: {
            textAlign: 'center',
            padding: 'var(--space-3xl) var(--space-xl)',
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
            lineHeight: 1.6,
          }
        },
          'Personal Hub',
          h('br'),
          '100% 本地 · 永久免费 · 离线可用',
          h('br'),
          '你的数据只属于你',
        )
      )
    )
  );
}

window.SettingsPage = SettingsPage;

})();
