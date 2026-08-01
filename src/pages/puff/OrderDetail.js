(function() {
/**
 * Personal Hub — 订单详情（Sheet）
 */

const { createElement: h } = React;

function OrderDetail({ order, onClose, onRefresh, onEdit }) {
  const { showToast } = useApp();

  if (!order) return null;

  const status = APP_CONFIG.orderStatus[order.status] || APP_CONFIG.orderStatus.new;
  const flow = APP_CONFIG.orderFlow[order.status] || [];

  const handleStatusChange = async (newStatus) => {
    await DAO.orders.updateStatus(order.id, newStatus);
    Haptics.success();
    showToast('状态已更新', 'success');
    onClose();
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm('确定删除此订单？')) return;
    await DAO.orders.delete(order.id);
    Haptics.warning();
    showToast('订单已删除', 'success');
    onClose();
    onRefresh();
  };

  const handleEdit = () => {
    Haptics.light();
    onClose();
    if (onEdit) onEdit(order);
  };

  // 取货点名称
  const pickupPointName = order.pickupPointName || '';

  return h(Sheet, { open: !!order, onClose, title: '订单详情' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' } },

      // 状态标签
      h('div', { style: { textAlign: 'center' } },
        h(Tag, { color: status.color, style: { fontSize: '15px', padding: '6px 16px' } }, status.label)
      ),

      // 顾客信息
      h('div', null,
        h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '4px' } }, '顾客'),
        h('div', { style: { fontSize: '20px', fontWeight: 600 } }, order.customer),
      ),

      // 产品列表
      h('div', null,
        h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-xs)' } }, '产品'),
        order.items?.map((item, i) =>
          h('div', {
            key: i,
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              padding: 'var(--space-sm) 0',
              borderBottom: i < order.items.length - 1 ? '1px solid var(--color-border-light)' : 'none',
            }
          },
            h('span', { style: { fontSize: '15px' } }, `${item.productName} ×${item.quantity}`),
            h('span', {
              style: { fontSize: '15px', color: 'var(--color-text-secondary)' },
              className: 'numeric'
            }, FormatUtils.money(item.unitPrice * item.quantity))
          )
        ),
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 'var(--space-sm)',
            borderTop: '2px solid var(--color-border)',
            marginTop: 'var(--space-sm)',
          }
        },
          h('span', { style: { fontSize: '17px', fontWeight: 600 } }, '合计'),
          h('span', {
            style: { fontSize: '22px', fontWeight: 700, color: 'var(--color-accent)' },
            className: 'numeric'
          }, FormatUtils.money(order.totalAmount))
        )
      ),

      // 取货信息
      h('div', null,
        h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '4px' } }, '取货'),
        h('div', { style: { fontSize: '17px' } },
          DateUtils.friendlyDate(order.pickupDate),
          order.pickupTime && ` ${FormatUtils.time(order.pickupTime)}`
        ),
        pickupPointName && h('div', {
          style: { fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }
        }, '📍 ', pickupPointName),
      ),

      // 备注
      order.notes && h('div', null,
        h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '4px' } }, '备注'),
        h('div', { style: { fontSize: '15px', color: 'var(--color-text-secondary)' } }, order.notes)
      ),

      // 状态流转按钮
      flow.length > 0 && h('div', null,
        h('div', { style: { fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-xs)' } }, '更新状态'),
        h('div', { style: { display: 'flex', gap: 'var(--space-sm)' } },
          flow.map(s => {
            const nextStatus = APP_CONFIG.orderStatus[s];
            return h(Button, {
              key: s,
              variant: 'secondary',
              fullWidth: true,
              onClick: () => handleStatusChange(s),
            }, nextStatus.label);
          })
        )
      ),

      // 编辑按钮
      h(Button, { variant: 'secondary', fullWidth: true, onClick: handleEdit }, '编辑订单'),

      // 删除按钮
      h(Button, { variant: 'danger', fullWidth: true, onClick: handleDelete }, '删除订单'),
    )
  );
}

window.OrderDetail = OrderDetail;

})();