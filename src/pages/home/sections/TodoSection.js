(function() {
/**
 * Personal Hub — V3 首页区块组件
 * 保留：AlexCard, PetCard, ShoppingCard
 * 删除：TodoCard, SomedayCard, FinanceCard, OrderCard, CalendarCard（已独立文件）
 */

const { createElement: h, useState, useEffect } = React;

// ===== 共享 Tile 样式（导出给其他卡片文件使用）=====
const TILE_STYLE = {
  backgroundColor: 'var(--color-bg-card)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-lg)',
  boxShadow: 'var(--shadow-1)',
  cursor: 'pointer',
  transition: 'transform 0.1s, background-color 0.15s',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-sm)',
  minHeight: '140px',
  overflow: 'hidden',
};

const TILE_HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 'var(--space-xs)',
};

const TILE_TITLE_STYLE = {
  fontSize: '15px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
};

const TILE_COUNT_STYLE = {
  fontSize: '13px',
  color: 'var(--color-text-tertiary)',
  fontWeight: 400,
};

const TILE_LIST_STYLE = {
  overflow: 'hidden',
  flex: 1,
};

const TILE_ITEM_STYLE = {
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  lineHeight: '1.8',
};

const TILE_EMPTY_STYLE = {
  fontSize: '13px',
  color: 'var(--color-text-tertiary)',
  textAlign: 'center',
  padding: 'var(--space-md) 0',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const TILE_FOOTER_STYLE = {
  fontSize: '12px',
  color: 'var(--color-text-tertiary)',
  textAlign: 'right',
  marginTop: 'auto',
  paddingTop: 'var(--space-xs)',
};

// 导出共享样式
window.TILE_STYLES = {
  TILE_STYLE,
  TILE_HEADER_STYLE,
  TILE_TITLE_STYLE,
  TILE_COUNT_STYLE,
  TILE_LIST_STYLE,
  TILE_ITEM_STYLE,
  TILE_EMPTY_STYLE,
  TILE_FOOTER_STYLE,
};

// ===== AlexCard =====
function AlexCard() {
  const { dataVersion, navigate } = useApp();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    DAO.alex.getToday().then(setRecords);
  }, [dataVersion]);

  return h('div', {
    style: TILE_STYLE,
    onClick: () => { Haptics.light(); navigate('/alex'); },
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: TILE_HEADER_STYLE },
      h('span', { style: TILE_TITLE_STYLE }, '👦 Alex Today'),
      h('span', { style: TILE_COUNT_STYLE },
        records.length ? `${records.length}项` : ''
      )
    ),
    records.length === 0
      ? h('div', { style: TILE_EMPTY_STYLE }, '今天没有安排')
      : h('div', { style: TILE_LIST_STYLE },
          records.slice(0, 3).map(r => {
            const cat = APP_CONFIG.alexCategories.find(c => c.key === r.category);
            return h('div', {
              key: r.id,
              style: {
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                lineHeight: '1.8',
                overflow: 'hidden',
              }
            },
              h('span', { style: { flexShrink: 0 } }, cat?.icon || '👦'),
              h('span', {
                style: {
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--color-text-secondary)',
                }
              }, r.title),
              r.time && h('span', {
                style: {
                  fontSize: '12px',
                  color: 'var(--color-text-tertiary)',
                  flexShrink: 0,
                },
                className: 'numeric'
              }, FormatUtils.time(r.time))
            );
          })
        ),
    records.length > 0 && h('div', { style: TILE_FOOTER_STYLE }, '查看全部 >')
  );
}

// ===== PetCard =====
function PetCard() {
  const { dataVersion, navigate } = useApp();
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    DAO.pets.getUpcomingReminders(7).then(setReminders);
  }, [dataVersion]);

  const featured = reminders[0];
  const rest = reminders.slice(1, 3);

  return h('div', {
    style: TILE_STYLE,
    onClick: () => { Haptics.light(); navigate('/pets'); },
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: TILE_HEADER_STYLE },
      h('span', { style: TILE_TITLE_STYLE }, '🐾 宠物提醒'),
      h('span', { style: TILE_COUNT_STYLE },
        reminders.length ? `${reminders.length}项` : ''
      )
    ),
    reminders.length === 0
      ? h('div', { style: TILE_EMPTY_STYLE }, '暂无提醒')
      : h('div', { style: TILE_LIST_STYLE },
          // 突出最近提醒
          featured && h('div', {
            style: {
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-accent-light)',
              marginBottom: 'var(--space-xs)',
            }
          },
            h('div', {
              style: {
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
              }
            },
              h('span', null,
                APP_CONFIG.pets.find(p => p.key === featured.petName)?.icon || '🐾'
              ),
              h('span', {
                style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
              }, featured.title)
            ),
            h('div', {
              style: {
                fontSize: '12px',
                color: 'var(--color-accent)',
                marginTop: '2px',
                marginLeft: '22px',
              },
              className: 'numeric'
            },
              DateUtils.friendlyDate(featured.nextDate) +
              (featured.time ? ' ' + FormatUtils.time(featured.time) : '')
            )
          ),
          // 其余提醒
          rest.map(r =>
            h('div', {
              key: r.id,
              style: {
                fontSize: '13px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: '1.8',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
              }
            },
              h('span', null,
                APP_CONFIG.pets.find(p => p.key === r.petName)?.icon || '🐾'
              ),
              h('span', {
                style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
              }, r.title),
              h('span', {
                style: { fontSize: '12px', color: 'var(--color-text-tertiary)', flexShrink: 0 }
              }, DateUtils.friendlyDate(r.nextDate))
            )
          )
        ),
    reminders.length > 0 && h('div', { style: TILE_FOOTER_STYLE }, '查看全部 >')
  );
}

// ===== ShoppingCard =====
function ShoppingCard() {
  const { dataVersion, navigate } = useApp();
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    DAO.shopping.getUnpurchased().then(data => {
      setItems(data.slice(0, 3));
      setTotalCount(data.length);
    });
  }, [dataVersion]);

  return h('div', {
    style: TILE_STYLE,
    onClick: () => { Haptics.light(); navigate('/shopping'); },
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
    onTouchEnd: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
  },
    h('div', { style: TILE_HEADER_STYLE },
      h('span', { style: TILE_TITLE_STYLE }, '🛒 购物清单'),
      h('span', { style: TILE_COUNT_STYLE },
        totalCount > 0 ? `${totalCount}项` : ''
      )
    ),
    items.length === 0
      ? h('div', { style: TILE_EMPTY_STYLE }, '购物清单是空的')
      : h('div', { style: TILE_LIST_STYLE },
          items.map(item =>
            h('div', {
              key: item.id,
              style: {
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: '1.8',
                color: 'var(--color-text-secondary)',
              }
            }, item.name)
          )
        ),
    items.length > 0 && h('div', { style: TILE_FOOTER_STYLE }, '查看全部 >')
  );
}

window.AlexCard = AlexCard;
window.PetCard = PetCard;
window.ShoppingCard = ShoppingCard;

// 兼容别名
window.AlexSection = AlexCard;
window.PetSection = PetCard;
window.ShoppingSection = ShoppingCard;
window.ReminderSection = PetCard;

})();
