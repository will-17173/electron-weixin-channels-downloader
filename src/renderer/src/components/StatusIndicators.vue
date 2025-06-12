<template>
  <div class="status-indicators">
    <div class="status-item">
      <span>证书状态:</span>
      <span v-if="certificateStatus.loading" class="status-warning">检查中...</span>
      <span v-else-if="certificateStatus.exists" class="status-success">✅ 已生成</span>
      <span v-else class="status-error">❌ 未生成</span>
    </div>

    <div class="status-item">
      <span>安装状态:</span>
      <span v-if="certificateStatus.loading" class="status-warning">检查中...</span>
      <span v-else-if="certificateStatus.installed" class="status-success">✅ 已安装</span>
      <span v-else class="status-error">❌ 未安装</span>
    </div>
  </div>
</template>

<script setup>
// Props
defineProps({
  certificateStatus: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
/* 状态指示器 - 简洁设计 */
.status-indicators {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
}

.status-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.status-success {
  color: #10b981;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-success::before {
  content: '●';
  font-size: 12px;
  animation: pulse 2s infinite;
}

.status-warning {
  color: #f59e0b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-warning::before {
  content: '●';
  font-size: 12px;
  animation: pulse 2s infinite;
}

.status-error {
  color: #ef4444;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-error::before {
  content: '●';
  font-size: 12px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
