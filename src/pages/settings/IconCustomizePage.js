(function() {
/**
 * Personal Hub — App 图标自定义页面
 * 提供多套预设图标，用户选择后动态更新主屏幕图标
 * 
 * 核心机制：Safari "添加到主屏幕" 时读取当前 DOM 中 <link rel="apple-touch-icon"> 的 href
 * 因此必须在用户点击"添加"之前用 canvas 生成 data URL 并设置好 href
 */

const { createElement: h, useState, useEffect } = React;

// 预设图标方案
const ICON_PRESETS = [
  { key: 'default',  name: '默认',       emoji: '🧁', bgColor: '#5B8A8E', fgColor: '#FAF8F5' },
  { key: 'pufflab',  name: 'Puff Lab',   emoji: '🧁', bgColor: '#FAF8F5', fgColor: '#5B8A8E', image: './assets/icons/icon-180.png' },
  { key: 'ribbon',   name: '🎀 蝴蝶结',  emoji: '🎀', bgColor: '#F4A6B8', fgColor: '#FFFFFF' },
  { key: 'cloud',    name: '☁️ 云朵',    emoji: '☁️', bgColor: '#E8EDF2', fgColor: '#5B7A8E' },
  { key: 'bubble',   name: '🫧 泡泡',    emoji: '🫧', bgColor: '#5B8A8E', fgColor: '#FFFFFF' },
  { key: 'bear',     name: '🧸 泰迪',    emoji: '🧸', bgColor: '#D4B58A', fgColor: '#FFFFFF' },
  { key: 'heart',    name: '💛 爱心',    emoji: '💛', bgColor: '#F5E6C8', fgColor: '#E8826B' },
];

/**
 * 动态生成 PNG 图标 data URL
 */
function generateIconDataURL(emoji, bgColor, fgColor, size = 180) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 背景圆角矩形
  ctx.fillStyle = bgColor;
  const radius = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // emoji 居中
  ctx.font = `${size * 0.5}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);

  return canvas.toDataURL('image/png');
}

/**
 * 应用选中的图标方案
 */
function applyIcon(preset) {
  // 默认预设使用用户上传图片
  const isImagePreset = !!preset.image;

  // 生成或获取图标 URL
  const icon180 = isImagePreset ? preset.image : generateIconDataURL(preset.emoji, preset.bgColor, preset.fgColor, 180);
  const icon192 = isImagePreset ? './assets/icons/icon-192.png' : generateIconDataURL(preset.emoji, preset.bgColor, preset.fgColor, 192);
  const icon512 = isImagePreset ? './assets/icons/icon-512.png' : generateIconDataURL(preset.emoji, preset.bgColor, preset.fgColor, 512);

  // 更新 link 标签
  const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (appleIcon) appleIcon.href = icon180;

  const icon192Link = document.querySelector('link[rel="icon"][sizes="192x192"]');
  if (icon192Link) icon192Link.href = icon192;

  // 保存选择
  localStorage.setItem('ph_app_icon', preset.key);

  // 更新 manifest icons（动态创建 manifest blob）
  const manifest = {
    name: 'Personal Hub',
    short_name: 'Hub',
    description: '个人生活管理工作台',
    start_url: './',
    scope: './',
    display: 'standalone',
    orientation: 'portrait',
    background_color: preset.bgColor,
    theme_color: preset.bgColor,
    lang: 'zh-CN',
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: icon180, sizes: '180x180', type: 'image/png', purpose: 'any' },
    ]
  };

  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestURL = URL.createObjectURL(blob);
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) manifestLink.href = manifestURL;

  // 更新 theme-color meta
  const themeMeta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (themeMeta) themeMeta.content = preset.bgColor;
  const themeMetaLight = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
  if (themeMetaLight) themeMetaLight.content = preset.bgColor;
}

function IconCustomizePage() {
  const { showToast } = useApp();
  const [selected, setSelected] = useState(localStorage.getItem('ph_app_icon') || 'default');

  const handleSelect = (preset) => {
    Haptics.selection();
    setSelected(preset.key);
    applyIcon(preset);
    showToast(`图标已切换为「${preset.name}」`, 'success');

    setTimeout(() => {
      showToast('请重新添加到主屏幕以更新图标', 'info');
    }, 1800);
  };

  // 预览图标样式
  const previewStyle = (preset, isSelected) => ({
    width: '64px',
    height: '64px',
    borderRadius: '14px',
    backgroundColor: preset.bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    margin: '0 auto var(--space-sm)',
    border: isSelected ? '3px solid var(--color-accent)' : '3px solid transparent',
    transition: 'border-color 0.2s, transform 0.1s',
    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
    overflow: 'hidden',
    backgroundImage: preset.image ? `url(${preset.image})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  });

  const renderPreviewContent = (preset) => {
    if (preset.image) return null;
    return preset.emoji;
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(NavBar, { title: '图标自定义', showBack: true }),

    h('div', { className: 'scroll-container page' },
      h('div', { style: { padding: 'var(--space-md) 0' } },

        // 当前图标大预览
        h('div', {
          style: {
            textAlign: 'center',
            padding: 'var(--space-xl) 0 var(--space-2xl)',
          }
        },
          (() => {
            const preset = ICON_PRESETS.find(p => p.key === selected) || ICON_PRESETS[0];
            const isImage = !!preset.image;
            return h('div', {
              style: {
                width: '100px',
                height: '100px',
                borderRadius: '22px',
                backgroundColor: preset.bgColor,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '52px',
                boxShadow: 'var(--shadow-3)',
                marginBottom: 'var(--space-md)',
                overflow: 'hidden',
                backgroundImage: isImage ? `url(${preset.image})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            }, isImage ? null : preset.emoji);
          })(),
          h('div', {
            style: { fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' }
          }, ICON_PRESETS.find(p => p.key === selected)?.name || '默认'),
          h('div', {
            style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }
          }, '当前图标'),
        ),

        // 预设方案网格
        h('div', { className: 'section-header' }, h('span', null, '选择图标')),
        h('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-md)',
            padding: '0 0 var(--space-lg)',
          }
        },
          ICON_PRESETS.map(preset =>
            h('div', {
              key: preset.key,
              onClick: () => handleSelect(preset),
              style: {
                textAlign: 'center',
                cursor: 'pointer',
                padding: 'var(--space-sm) 0',
                borderRadius: 'var(--radius-md)',
                transition: 'background-color 0.15s',
              },
              onTouchStart: (e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
              },
              onTouchEnd: (e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              },
            },
              h('div', { style: previewStyle(preset, selected === preset.key) },
                renderPreviewContent(preset)
              ),
              h('div', {
                style: {
                  fontSize: '12px',
                  color: selected === preset.key ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                  fontWeight: selected === preset.key ? 600 : 400,
                }
              }, preset.name)
            )
          )
        ),

        // 说明
        h(Card, { style: { marginTop: 'var(--space-md)' } },
          h('div', {
            style: { fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }
          },
            h('div', { style: { fontWeight: 600, marginBottom: 'var(--space-sm)' } }, 'ℹ️ 如何更新主屏幕图标'),
            '1. 在此页面选择喜欢的图标样式',
            h('br'),
            '2. 在 Safari 中点击分享按钮 → 添加到主屏幕',
            h('br'),
            '3. 新图标会立即生效',
            h('br'),
            '4. 如果已添加旧图标，需要先删除再重新添加',
            h('br'),
            h('br'),
            '图标选择会自动保存，下次打开时仍然生效。',
          )
        ),
      )
    )
  );
}

// 暴露组件和工具函数
window.IconCustomizePage = IconCustomizePage;
window.applyAppIcon = (key) => {
  const preset = ICON_PRESETS.find(p => p.key === key);
  if (preset) applyIcon(preset);
};
window.ICON_PRESETS = ICON_PRESETS;
window.generateIconDataURL = generateIconDataURL;

})();
