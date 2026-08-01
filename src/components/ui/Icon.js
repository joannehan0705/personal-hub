(function() {
/**
 * Personal Hub — SVG 图标集
 * 线条风格，2px 描边，参考 SF Symbols
 */

const { createElement: h } = React;

const ICON_PATHS = {
  // 导航
  home: 'M3 12L12 4l9 8M5 10v10h14V10',
  puff: 'M12 3C9 3 7 5 7 7.5c0 .5.1 1 .3 1.4-1.8.5-3.3 2-3.3 4.1 0 2.3 1.9 4 4 4h8c2.1 0 4-1.7 4-4 0-2.1-1.5-3.6-3.3-4.1.2-.4.3-.9.3-1.4C17 5 15 3 12 3z',
  alex: 'M12 12a4 4 0 100-8 4 4 0 000 8zM6 20v-1a6 6 0 0112 0v1',
  finance: 'M12 3v18M16 7H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 010 5H8',
  settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41',

  // 操作
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5L20 7',
  checkCircle: 'M12 3a9 9 0 100 18 9 9 0 000-18zM8 12l3 3 5-5',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  edit: 'M4 20h4L18 6l-4-4L4 16v4zM14 6l4 4',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronDown: 'M6 9l6 6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3',

  // 分类
  cart: 'M3 4h2l2.4 12.4a2 2 0 002 1.6h7.7a2 2 0 002-1.6L21 8H6M9 21a1 1 0 100-2 1 1 0 000 2zM18 21a1 1 0 100-2 1 1 0 000 2z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  bell: 'M12 3a6 6 0 016 6v4l2 3H4l2-3V9a6 6 0 016-6zM10 19a2 2 0 004 0',
  calendar: 'M4 5h16v16H4zM4 9h16M8 3v4M16 3v4',
  tag: 'M3 3h7l11 11-7 7L3 10z',

  // 功能
  export: 'M12 3v12M8 7l4-4 4 4M4 17v3h16v-3',
  import: 'M12 15V3M8 11l4 4 4-4M4 17v3h16v-3',
  download: 'M12 3v12M8 11l4 4 4-4M4 17v3h16v-3',
  refresh: 'M4 12a8 8 0 0114-5.3L20 8M20 8V3M20 8h-5M20 12a8 8 0 01-14 5.3L4 16M4 16v5M4 16h5',
  filter: 'M3 5h18l-7 8v5l-4 2v-7z',

  // 宠物
  paw: 'M11 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM7 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM15 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM5 10a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM17 10a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM9 13c2 0 4 1.5 4 3.5S11 20 9 20s-4-1.5-4-3.5S7 13 9 13z',

  // 状态
  warning: 'M12 3L2 21h20L12 3zM12 9v5M12 18v.1',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 7v.1',
};

function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 2, fill = 'none', className = '' }) {
  const path = ICON_PATHS[name];
  if (!path) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: `icon icon-${name} ${className}`,
  }, h('path', { d: path }));
}

window.Icon = Icon;

})();
