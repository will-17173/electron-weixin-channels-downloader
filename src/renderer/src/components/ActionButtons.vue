<template>
  <div class="action-buttons-container">
    <button class="guide-button" title="查看使用指南" @click="$emit('show-guide')">
      📖 使用指南
    </button>
    <button class="donation-button" title="支持开发者" @click="$emit('show-donation')">
      💖 赞赏支持
    </button>
  </div>
</template>

<script setup>
// Emits
defineEmits(['show-guide', 'show-donation'])
</script>

<style scoped>
/* 按钮组样式 */
.action-buttons-container {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.guide-button,
.donation-button {
  flex: 1;
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.guide-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.guide-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.donation-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
}

.donation-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
}

.guide-button:active,
.donation-button:active {
  transform: translateY(0);
}
</style>
