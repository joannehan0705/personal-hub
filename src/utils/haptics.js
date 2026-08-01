(function() {
/**
 * Personal Hub — 触觉反馈工具
 */

const Haptics = {
  _enabled: true,

  setEnabled(enabled) {
    this._enabled = enabled;
  },

  /**
   * 轻触反馈
   */
  light() {
    if (!this._enabled) return;
    if (navigator.vibrate) navigator.vibrate(10);
  },

  /**
   * 中等反馈
   */
  medium() {
    if (!this._enabled) return;
    if (navigator.vibrate) navigator.vibrate(20);
  },

  /**
   * 成功反馈（双振动）
   */
  success() {
    if (!this._enabled) return;
    if (navigator.vibrate) navigator.vibrate([10, 30, 20]);
  },

  /**
   * 警告反馈
   */
  warning() {
    if (!this._enabled) return;
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
  },

  /**
   * 错误反馈
   */
  error() {
    if (!this._enabled) return;
    if (navigator.vibrate) navigator.vibrate([30, 60, 30, 60, 30]);
  },

  /**
   * 选择反馈
   */
  selection() {
    if (!this._enabled) return;
    if (navigator.vibrate) navigator.vibrate(5);
  },
};

window.Haptics = Haptics;

})();
