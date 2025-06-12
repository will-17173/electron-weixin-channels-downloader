<template>
  <div class="section">
    <h3>🌐 代理服务器 <span class="platform-badge">HTTP/HTTPS</span></h3>

    <!-- 状态概览 -->
    <div class="status-overview">
      <div class="status-row">
        <div class="proxy-actions" style="width: 100%">
          <button
            class="btn-primary"
            style="width: 100%"
            :disabled="systemProxyStatus.enabled || systemProxyStatus.loading"
            @click="$emit('start-proxy')"
          >
            ▶️ 启动代理
          </button>

          <button
            class="btn-danger"
            style="width: 100%"
            :disabled="!systemProxyStatus.enabled || systemProxyStatus.loading"
            @click="$emit('stop-proxy')"
          >
            ⏹️ 停止代理
          </button>
        </div>
      </div>
    </div>

    <div class="admin-actions">
      <div class="tip">
        💡 如果自动设置代理失败，可以手动设置系统代理到:
        <code>{{ proxyAddress || '127.0.0.1:57392' }}</code>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
defineProps({
  systemProxyStatus: {
    type: Object,
    required: true
  },
  videoMonitorStatus: {
    type: Object,
    required: true
  },
  proxyAddress: {
    type: String,
    default: '127.0.0.1:57392'
  }
})

// Emits
defineEmits(['start-proxy', 'stop-proxy'])
</script>

<style scoped>
/* 右列中的section样式 - 简洁设计 */
.section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.section:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.platform-badge {
  background: #3b82f6;
  color: white;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 状态概览 - 简洁设计 */
.status-overview {
  margin-bottom: 20px;
}

.status-row {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px 20px;
  gap: 20px;
  position: relative;
  transition: all 0.2s ease;
}

.status-row:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
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

/* 现代简洁按钮样式 */
.btn-primary,
.btn-secondary,
.btn-danger {
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  margin: 4px 0;
  transition: all 0.2s ease;
  width: 100%;
  position: relative;
  overflow: hidden;
  text-transform: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 代理操作按钮样式 */
.proxy-actions {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin-actions {
  margin-top: 15px;
}

.admin-actions .tip {
  margin-top: 8px;
  font-style: italic;
  font-size: 11px;
  color: #64748b;
  padding: 6px 8px;
  background: #f1f5f9;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.admin-actions code {
  background: #1f2937;
  color: #10b981;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 10px;
}

.target-page {
  margin-top: 12px;
  padding: 12px 16px;
  background: #ecfdf5;
  border-radius: 8px;
  border: 1px solid #10b981;
  position: relative;
}

.target-page h4 {
  margin: 0 0 8px 0;
  color: #065f46;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.target-page p {
  margin: 0 0 6px 0;
  font-size: 11px;
  color: #065f46;
  font-weight: 400;
  line-height: 1.4;
}

.target-page a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.target-page a:hover {
  color: #2563eb;
}
</style>
