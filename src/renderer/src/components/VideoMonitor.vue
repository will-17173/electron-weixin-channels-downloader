<template>
  <div class="video-monitor-section">
    <h2>🎥 爱下 - 视频号下载器</h2>

    <!-- 视频列表 -->
    <div class="video-list-container">
      <!-- 视频列表标题和操作按钮 -->
      <div class="video-list-header">
        <h3>📋 视频列表 ({{ videoMonitorStatus.totalCapturedCount }} 个)</h3>
        <div class="video-list-actions">
          <button class="action-btn refresh-btn" @click="refreshVideoMonitorStatus">
            🔄 刷新状态
          </button>
          <button class="action-btn clear-btn" @click="clearVideoData">🗑️ 清空数据</button>
        </div>
      </div>

      <div v-if="videoMonitorStatus.videos.length === 0" class="no-videos">
        <div class="no-videos-content">
          <div class="no-videos-icon">📱</div>
          <h4>暂无捕获的视频</h4>
          <p>请按照以下步骤开始捕获视频：</p>
          <div class="no-videos-steps">
            <p>操作步骤：</p>
            <ol>
              <li>确保证书已安装并信任</li>
              <li>启动代理服务器</li>
              <li>在微信中访问视频号页面</li>
              <li>开始浏览视频，系统会自动捕获</li>
            </ol>
          </div>
        </div>
      </div>

      <div v-else class="video-list">
        <VideoItem
          v-for="(video, index) in displayedVideos"
          :key="video.id || index"
          :video="video"
          :index="index"
          @download="downloadVideo"
          @cancel-download="cancelDownload"
          @open-folder="openDownloadFolder"
        />

        <!-- 显示更多视频的提示 -->
        <div v-if="videoMonitorStatus.videos.length > displayLimit" class="more-videos-notice">
          <p>📋 还有 {{ videoMonitorStatus.videos.length - displayLimit }} 个视频未显示</p>
          <p class="tip">💡 点击"导出JSON"查看完整列表</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VideoItem from './VideoItem.vue'

// Props
const props = defineProps({
  videoMonitorStatus: {
    type: Object,
    required: true
  },
  displayLimit: {
    type: Number,
    default: 20
  }
})

// Emits
const emit = defineEmits([
  'refresh-status',
  'clear-data',
  'download-video',
  'cancel-download',
  'open-folder'
])

// 计算属性
const displayedVideos = computed(() => {
  return props.videoMonitorStatus.videos.slice(0, props.displayLimit)
})

// 方法
const refreshVideoMonitorStatus = () => {
  emit('refresh-status')
}

const clearVideoData = () => {
  emit('clear-data')
}

const downloadVideo = (video) => {
  emit('download-video', video)
}

const cancelDownload = (video) => {
  emit('cancel-download', video)
}

const openDownloadFolder = (video) => {
  emit('open-folder', video)
}
</script>

<style scoped>
/* 视频监控中心 - 现代简洁设计 */
.video-monitor-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.video-monitor-section h2 {
  margin: 0 0 24px 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
}

/* 视频列表 - 简洁设计 */
.video-list-container {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  overflow: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 视频列表标题和操作按钮布局 */
.video-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.video-list-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  text-align: left;
  flex-shrink: 0;
}

.video-list-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.video-list-actions .action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.video-list-actions .refresh-btn {
  background: #06b6d4;
  color: white;
}

.video-list-actions .refresh-btn:hover {
  background: #0891b2;
}

.video-list-actions .clear-btn {
  background: #ef4444;
  color: white;
}

.video-list-actions .clear-btn:hover {
  background: #dc2626;
}

.video-list-actions .action-btn:active {
  transform: scale(0.98);
  transition: transform 0.1s;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 无视频状态 - 简洁设计 */
.no-videos {
  text-align: center;
  padding: 40px 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  margin: 20px 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.no-videos:hover {
  border-color: #94a3b8;
}

.no-videos-content {
  max-width: 400px;
  margin: 0 auto;
}

.no-videos-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.no-videos h4 {
  color: #374151;
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
}

.no-videos p {
  color: #6b7280;
  margin: 0 0 20px 0;
  line-height: 1.5;
  font-size: 14px;
}

.no-videos-steps {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.no-videos-steps p {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #374151;
  font-size: 16px;
  text-align: center;
}

.no-videos-steps ol {
  margin: 0;
  padding-left: 20px;
  color: #374151;
}

.no-videos-steps li {
  margin-bottom: 8px;
  line-height: 1.5;
  font-size: 13px;
  font-weight: 400;
}

/* 更多视频提示样式 */
.more-videos-notice {
  text-align: center;
  margin-top: 20px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
}

.more-videos-notice p {
  margin: 0 0 4px 0;
  color: #0c4a6e;
  font-size: 14px;
  font-weight: 500;
}

.more-videos-notice .tip {
  font-size: 12px;
  color: #0369a1;
  font-style: italic;
}
</style>
