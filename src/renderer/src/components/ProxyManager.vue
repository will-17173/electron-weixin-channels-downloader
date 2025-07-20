<template>
  <div class="section">
    <h3>🌐 系统代理</h3>
    <div class="proxy-actions">
      <button
        class="btn-primary"
        :disabled="proxyStatus.enabled || proxyStatus.loading"
        @click="$emit('set-proxy', true)"
      >
        <span v-if="proxyStatus.loading && !proxyStatus.enabled">⌛</span>
        <span v-else>✅</span>
        设为系统代理
      </button>
      <button
        class="btn-danger"
        :disabled="!proxyStatus.enabled || proxyStatus.loading"
        @click="$emit('set-proxy', false)"
      >
        <span v-if="proxyStatus.loading && proxyStatus.enabled">⌛</span>
        <span v-else>⛔</span>
        取消系统代理
      </button>
    </div>
    <div class="proxy-status">
      <button class="status-button" @click="$emit('check-proxy')">
        当前状态:
        <span v-if="proxyStatus.loading">检查中...</span>
        <span v-else :class="proxyStatus.enabled ? 'status-enabled' : 'status-disabled'">
          {{ proxyStatus.enabled ? '已启用' : '已禁用' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  proxyStatus: {
    type: Object,
    default: () => ({ enabled: false, loading: false })
  }
})

defineEmits(['set-proxy', 'check-proxy'])
</script>

<style scoped>
.section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

.proxy-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.btn-primary,
.btn-danger {
  flex: 1;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}
.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-primary:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.proxy-status {
  text-align: center;
}

.status-button {
  background: none;
  border: 1px solid #d1d5db;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
  transition: background-color 0.2s;
}

.status-button:hover {
  background-color: #f3f4f6;
}

.status-enabled {
  color: #16a34a;
  font-weight: 600;
}

.status-disabled {
  color: #dc2626;
  font-weight: 600;
}
</style>
