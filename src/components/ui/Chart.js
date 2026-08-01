(function() {
/**
 * Personal Hub — SVG 图表组件
 * DonutChart, LineChart, SummaryCard
 * 纯 SVG 实现，不依赖外部库
 */

const { createElement: h } = React;

// 图表调色板（使用项目现有颜色变量对应的 hex 值）
const CHART_COLORS = [
  '#5B8A8E', // accent (鸭青色)
  '#E8C547', // today (蜜蜡黄)
  '#7BAE8E', // complete (鼠尾草绿)
  '#E8826B', // deadline (珊瑚粉)
  '#8B7EC8', // evening (薰衣草)
  '#6B9EC4', // tag (天青蓝)
  '#C4A576', // accent-2 (暖沙金)
  '#9C968B', // tertiary (灰)
];

/**
 * DonutChart — 环形图
 * data: [{ label, value, color? }]
 */
function DonutChart({ data, size = 160, thickness = 24, centerValue, centerLabel }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (total === 0) return null;

  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const segments = data.map((d, i) => {
    const fraction = (d.value || 0) / total;
    const segLen = fraction * circumference;
    const seg = h('circle', {
      key: i,
      cx, cy, r,
      fill: 'none',
      stroke: d.color || CHART_COLORS[i % CHART_COLORS.length],
      strokeWidth: thickness,
      strokeDasharray: `${segLen} ${circumference - segLen}`,
      strokeDashoffset: -offset,
      transform: `rotate(-90 ${cx} ${cy})`,
      strokeLinecap: 'butt',
    });
    offset += segLen;
    return seg;
  });

  return h('div', {
    style: { display: 'flex', justifyContent: 'center', padding: 'var(--space-sm)' },
  },
    h('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}` },
      // 背景环
      h('circle', { cx, cy, r, fill: 'none', stroke: 'var(--color-bg-subtle)', strokeWidth: thickness }),
      segments,
      // 中心文字
      centerValue && h('text', {
        x: cx, y: cy - 4,
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize: '22px',
        fontWeight: 700,
        fill: 'var(--color-text-primary)',
        className: 'numeric',
      }, centerValue),
      centerLabel && h('text', {
        x: cx, y: cy + 16,
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize: '11px',
        fill: 'var(--color-text-tertiary)',
      }, centerLabel),
    ),
  );
}

/**
 * LineChart — 折线图
 * data: [number], labels: [string]
 */
function LineChart({ data, labels, color = 'var(--color-accent)', height = 130 }) {
  if (!data || data.length === 0) return null;

  const width = 320;
  const padding = { top: 12, right: 12, bottom: 24, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const values = data.filter(v => v != null && !isNaN(v));
  if (values.length === 0) return null;

  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 1);
  const range = maxVal - minVal || 1;

  const points = data.map((val, i) => {
    const x = padding.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padding.top + innerH - ((val - minVal) / range) * innerH;
    return { x, y, val };
  });

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const fillPoints = `${padding.left},${padding.top + innerH} ${polyPoints} ${padding.left + innerW},${padding.top + innerH}`;

  // X 轴标签间隔显示
  const labelInterval = Math.max(1, Math.ceil(labels.length / 6));
  const xLabels = labels.map((label, i) => {
    if (i % labelInterval !== 0 && i !== labels.length - 1) return null;
    return h('text', {
      key: i,
      x: points[i].x,
      y: height - 6,
      textAnchor: 'middle',
      fontSize: '9px',
      fill: 'var(--color-text-tertiary)',
    }, label);
  }).filter(Boolean);

  // Y 轴标签
  const yMaxLabel = h('text', {
    x: padding.left - 4, y: padding.top + 4,
    textAnchor: 'end',
    fontSize: '9px',
    fill: 'var(--color-text-tertiary)',
    className: 'numeric',
  }, FormatUtils.money(maxVal).replace('$', ''));

  const yMinLabel = h('text', {
    x: padding.left - 4, y: padding.top + innerH + 3,
    textAnchor: 'end',
    fontSize: '9px',
    fill: 'var(--color-text-tertiary)',
    className: 'numeric',
  }, FormatUtils.money(minVal).replace('$', ''));

  return h('div', { style: { width: '100%', overflow: 'hidden' } },
    h('svg', { width: '100%', height, viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'xMidYMid meet' },
      // 网格线
      h('line', { x1: padding.left, y1: padding.top, x2: padding.left, y2: padding.top + innerH, stroke: 'var(--color-border-light)', strokeWidth: 1 }),
      h('line', { x1: padding.left, y1: padding.top + innerH, x2: width - padding.right, y2: padding.top + innerH, stroke: 'var(--color-border-light)', strokeWidth: 1 }),
      // 填充区域
      h('polygon', { points: fillPoints, fill: color, opacity: 0.1 }),
      // 折线
      h('polyline', {
        points: polyPoints,
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
        strokeLinejoin: 'round',
        strokeLinecap: 'round',
      }),
      // 数据点
      points.map((p, i) => h('circle', {
        key: i,
        cx: p.x, cy: p.y, r: 2.5,
        fill: 'var(--color-bg-card)',
        stroke: color,
        strokeWidth: 1.5,
      })),
      // 标签
      xLabels,
      yMaxLabel,
      yMinLabel,
    ),
  );
}

/**
 * ReviewSummaryCard — Apple Health 风格轻盈卡片
 * props: { title, icon, decorIcon, accentColor, children }
 * children 为自定义内容布局
 */
function ReviewSummaryCard({ title, icon, decorIcon, accentColor, children, onClick }) {
  return h('div', {
    onClick: onClick,
    style: {
      position: 'relative',
      backgroundColor: 'var(--color-bg-card)',
      borderRadius: '20px',
      padding: 'var(--space-xl)',
      border: '1px solid var(--color-border-light)',
      boxShadow: '0 1px 3px rgba(45,42,38,0.03)',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
    },
  },
    // 右上装饰 Icon（极淡）
    decorIcon && h('div', {
      style: {
        position: 'absolute',
        top: '12px',
        right: '14px',
        fontSize: '32px',
        opacity: 0.12,
        pointerEvents: 'none',
      },
    }, decorIcon),
    // 标题行
    h('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
        marginBottom: 'var(--space-md)',
      },
    },
      h('span', { style: { fontSize: '16px' } }, icon),
      h('span', {
        style: { fontSize: '14px', fontWeight: 600, color: accentColor || 'var(--color-text-primary)' },
      }, title),
    ),
    // 内容
    children,
  );
}

/**
 * SummaryCard — 兼容旧调用（保留）
 * items: [{ label, value, sub?, trendDir?, trendText?, trendGood? }]
 */
function SummaryCard({ title, icon, items, accentColor }) {
  return h('div', {
    style: {
      backgroundColor: 'var(--color-bg-card)',
      borderRadius: '20px',
      padding: 'var(--space-xl)',
      border: '1px solid var(--color-border-light)',
      boxShadow: '0 1px 3px rgba(45,42,38,0.03)',
      marginBottom: 'var(--space-md)',
    },
  },
    h('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
        marginBottom: 'var(--space-lg)',
      },
    },
      h('span', { style: { fontSize: '18px' } }, icon),
      h('span', {
        style: { fontSize: '14px', fontWeight: 600, color: accentColor || 'var(--color-text-primary)' },
      }, title),
    ),
    h('div', {
      style: { display: 'flex', justifyContent: 'space-around', textAlign: 'center', gap: 'var(--space-xs)' },
    },
      items.map((item, i) => h('div', { key: i, style: { flex: 1, minWidth: 0 } },
        h('div', {
          style: { fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '4px' },
        }, item.label),
        h('div', {
          style: {
            fontSize: '22px', fontWeight: 600, color: item.color || '#2F2F2F',
            lineHeight: 1.1,
          },
          className: 'numeric',
        }, item.value),
        item.sub && h('div', {
          style: { fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' },
          className: 'numeric',
        }, item.sub),
        item.trendDir && h('div', {
          style: {
            fontSize: '11px', fontWeight: 500, marginTop: '2px',
            color: item.trendGood ? 'var(--color-complete)' : 'var(--color-deadline)',
          },
          className: 'numeric',
        }, `${item.trendDir === 'up' ? '↑' : '↓'} ${item.trendText || ''}`),
      )),
    ),
  );
}

/**
 * TrendChart — 标题 + 折线图组合
 */
function TrendChart({ title, data, labels, color }) {
  if (!data || data.filter(v => v != null).length === 0) return null;

  return h('div', {
    style: {
      backgroundColor: 'var(--color-bg-card)',
      borderRadius: '16px',
      padding: 'var(--space-lg) var(--space-xl)',
      border: '1px solid var(--color-border-light)',
      boxShadow: '0 1px 3px rgba(45,42,38,0.03)',
      marginBottom: 'var(--space-sm)',
    },
  },
    h('div', {
      style: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' },
    }, title),
    h(LineChart, { data, labels, color }),
  );
}

/**
 * DonutCard — 标题 + 环形图 + 图例
 */
function DonutCard({ title, data, centerValue, centerLabel }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (total === 0) return null;

  return h('div', {
    style: {
      backgroundColor: 'var(--color-bg-card)',
      borderRadius: '16px',
      padding: 'var(--space-lg) var(--space-xl)',
      border: '1px solid var(--color-border-light)',
      boxShadow: '0 1px 3px rgba(45,42,38,0.03)',
      marginBottom: 'var(--space-sm)',
    },
  },
    h('div', {
      style: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' },
    }, title),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' } },
      h(DonutChart, { data, centerValue, centerLabel, size: 140, thickness: 20 }),
      h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' } },
        data.map((d, i) => h('div', {
          key: i,
          style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', fontSize: '12px' },
        },
          h('div', {
            style: {
              width: '8px', height: '8px', borderRadius: '2px',
              backgroundColor: d.color || CHART_COLORS[i % CHART_COLORS.length],
              flexShrink: 0,
            },
          }),
          h('span', { style: { flex: 1, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, d.label),
          h('span', { style: { color: 'var(--color-text-tertiary)', className: 'numeric' }, className: 'numeric' }, FormatUtils.money(d.value).replace('$', '$')),
        )),
      ),
    ),
  );
}

// 暴露到全局
window.DonutChart = DonutChart;
window.LineChart = LineChart;
window.SummaryCard = SummaryCard;
window.ReviewSummaryCard = ReviewSummaryCard;
window.TrendChart = TrendChart;
window.DonutCard = DonutCard;
window.CHART_COLORS = CHART_COLORS;

})();
