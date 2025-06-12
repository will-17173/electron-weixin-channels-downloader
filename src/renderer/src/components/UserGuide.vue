<template>
  <div v-if="visible" class="user-guide-overlay" @click="closeGuide">
    <div class="user-guide-modal" @click.stop>
      <!-- 标题栏 -->
      <div class="guide-header">
        <div class="guide-title">
          <div class="guide-icon">📖</div>
          <h2>使用指南</h2>
        </div>
        <button class="close-btn" @click="closeGuide">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M15 5L5 15M5 5l10 10"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="guide-content">
        <div v-for="(step, index) in guideSteps" :key="index" class="guide-step">
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-content">
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
            <div v-if="step.tips" class="step-tips">
              <div class="tip-icon">💡</div>
              <span>{{ step.tips }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <div class="guide-footer">
        <div class="guide-footer-left">
          <label class="checkbox-label">
            <input v-model="dontShowAgain" type="checkbox" class="checkbox-input" />
            <span class="checkbox-custom"></span>
            不再自动显示此指南
          </label>
        </div>
        <div class="guide-footer-right">
          <button class="btn-primary" @click="closeGuide">开始使用</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible', 'dont-show-again'])

// 响应式数据
const dontShowAgain = ref(false)

// 使用指南步骤
const guideSteps = ref([
  {
    title: '🚀 启动应用',
    description: '首次运行需要管理员权限，用于设置系统代理和安装SSL证书。',
    tips: '如果遇到权限问题，请右键选择"以管理员身份运行"'
  },
  {
    title: '🔒 安装证书',
    description:
      '应用会自动生成并尝试安装SSL证书到系统信任列表。如果自动安装失败，请按提示手动安装。',
    tips: '证书安装后，浏览器才能正常访问HTTPS网站'
  },
  {
    title: '🌐 启动代理',
    description: '点击"启动代理"按钮，应用将自动配置系统代理设置。代理地址为 127.0.0.1:57392。',
    tips: '代理启动后，所有网络流量将通过应用进行处理'
  },
  {
    title: '📱 访问微信视频号',
    description: '打开微信程序，访问微信视频号页面。应用会自动检测并注入脚本来捕获视频信息。',
    tips: '只有视频详情页才会显示在应用界面中'
  },
  {
    title: '🎥 下载视频',
    description: '当检测到视频时，应用界面会显示视频信息。点击"下载"按钮即可保存视频到本地。',
    tips: '下载的视频默认保存在"下载/WechatVideos"文件夹中'
  },
  {
    title: '⚠️ 安全退出',
    description: '使用完毕后，建议点击"停止代理"按钮。如果直接关闭应用，系统会自动清理代理设置。',
    tips: '正确停止代理可以确保网络连接正常'
  }
])

// 关闭指南
const closeGuide = () => {
  emit('update:visible', false)

  if (dontShowAgain.value) {
    emit('dont-show-again', true)
  }
}
</script>

<style scoped>
.user-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.user-guide-modal {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  max-height: 85vh;
  width: 90%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.guide-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.guide-icon {
  font-size: 28px;
}

.guide-title h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  padding: 8px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.guide-content {
  padding: 28px;
  overflow-y: auto;
  flex: 1;
}

.guide-step {
  display: flex;
  gap: 20px;
  margin-bottom: 32px;
}

.guide-step:last-child {
  margin-bottom: 0;
}

.step-number {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #1f2937;
}

.step-content p {
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 12px 0;
  color: #4b5563;
}

.step-tips {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #0369a1;
}

.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.guide-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.guide-footer-left {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  user-select: none;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox-input:checked + .checkbox-custom {
  background: #667eea;
  border-color: #667eea;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.guide-footer-right {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

/* 滚动条样式 */
.guide-content::-webkit-scrollbar {
  width: 6px;
}

.guide-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.guide-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.guide-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-guide-modal {
    width: 95%;
    max-height: 90vh;
  }

  .guide-header,
  .guide-content,
  .guide-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .guide-step {
    gap: 16px;
  }

  .step-number {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .guide-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .guide-footer-right {
    justify-content: center;
  }
}
</style>
