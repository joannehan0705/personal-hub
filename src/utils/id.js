(function() {
/**
 * Personal Hub — ID 生成工具
 */

/**
 * 生成唯一 ID
 * 格式: 时间戳-随机字符串
 * @returns {string}
 */
function generateId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${random}`;
}

window.generateId = generateId;

})();
