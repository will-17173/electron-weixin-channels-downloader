<template>
  <div class="section">
    <h3>🔐 证书管理 <span class="platform-badge">HTTPS</span></h3>

    <StatusIndicators :certificate-status="certificateStatus" />

    <div class="cert-actions">
      <button
        class="btn-primary"
        :disabled="certificateStatus.loading"
        @click="$emit('check-certificate')"
      >
        🔍 检查证书
      </button>

      <button
        class="btn-primary"
        :disabled="certificateStatus.loading || !certificateStatus.exists"
        @click="$emit('install-certificate')"
      >
        📥 安装证书
      </button>

      <button
        class="btn-secondary"
        :disabled="certificateStatus.loading || !certificateStatus.installed"
        @click="$emit('uninstall-certificate')"
      >
        🗑️ 卸载证书
      </button>
    </div>

    <div v-if="certificateStatus.path" class="cert-path">
      <strong>证书路径:</strong> {{ certificateStatus.path }}
    </div>

    <div class="platform-guide">
      <h4 v-if="isWindows">Windows 安装指南:</h4>
      <h4 v-else-if="isMacOS">macOS 安装指南:</h4>
      <h4 v-else>安装指南:</h4>

      <!-- Windows 安装指南 -->
      <ol v-if="isWindows">
        <li>点击"安装证书"按钮</li>
        <li>在弹出的对话框中选择"当前用户"</li>
        <li>选择"将所有的证书都放入下列存储"</li>
        <li>点击"浏览"选择"受信任的根证书颁发机构"</li>
        <li>点击"确定"完成安装</li>
      </ol>

      <!-- macOS 安装指南 -->
      <ol v-else-if="isMacOS">
        <li>点击"安装证书"按钮</li>
        <li>双击生成的证书文件</li>
        <li>在钥匙串访问中找到证书</li>
        <li>双击证书，展开"信任"部分</li>
        <li>将"使用此证书时"设置为"始终信任"</li>
      </ol>

      <!-- Linux 安装指南 -->
      <ol v-else>
        <li>点击"安装证书"按钮</li>
        <li>根据发行版不同，可能需要手动添加到系统信任列表</li>
        <li>Ubuntu/Debian: 复制到 /usr/local/share/ca-certificates/</li>
        <li>运行 sudo update-ca-certificates</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import StatusIndicators from './StatusIndicators.vue'

// Props
defineProps({
  certificateStatus: {
    type: Object,
    required: true
  },
  isWindows: {
    type: Boolean,
    default: false
  },
  isMacOS: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits(['check-certificate', 'install-certificate', 'uninstall-certificate'])
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

/* 证书管理特定样式 - 简洁设计 */
.platform-guide {
  margin: 12px 0;
  padding: 12px 16px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  position: relative;
}

.platform-guide h4 {
  margin: 0 0 8px 0;
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.platform-guide ol {
  margin: 0;
  padding-left: 16px;
  color: #92400e;
}

.platform-guide li {
  margin-bottom: 4px;
  line-height: 1.4;
  font-size: 11px;
  font-weight: 400;
}

.cert-actions {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cert-path {
  margin: 10px 0;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 11px;
  color: #64748b;
  word-break: break-all;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>
