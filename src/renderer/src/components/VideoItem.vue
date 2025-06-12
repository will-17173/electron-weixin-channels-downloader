<template>
  <div class="video-item">
    <div class="video-content">
      <div class="video-main-info">
        <div class="video-title">
          <span class="title-text">
            {{ video.title || video.description || '未知标题' }}
          </span>
          <span class="video-index">#{{ index + 1 }}</span>
        </div>

        <div class="video-meta">
          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-icon">👤</span>
              <span class="meta-label">发布者:</span>
              <span class="meta-value">{{ video.uploader || '未知' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📏</span>
              <span class="meta-label">大小:</span>
              <span class="meta-value">{{ formatFileSize(video.size) }}</span>
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-icon">⏰</span>
              <span class="meta-label">访问时间:</span>
              <span class="meta-value">{{ formatTime(video.capturedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 下载区域 -->
      <div class="video-download">
        <!-- 下载按钮 -->
        <button
          v-if="!video.downloading && !video.downloaded"
          :disabled="!video.url"
          class="download-btn modern"
          @click="$emit('download', video)"
        >
          <svg
            class="download-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 12L12 16L16 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12 8V16"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M20 16V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V16"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="download-text">下载视频</span>
        </button>

        <!-- 下载进度 -->
        <div v-if="video.downloading" class="download-progress">
          <div class="progress-info">
            <span class="progress-text">下载中...</span>
            <span class="progress-percentage">{{ video.downloadProgress || 0 }}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: (video.downloadProgress || 0) + '%' }"
            ></div>
          </div>
          <button class="cancel-btn" @click="$emit('cancel-download', video)">
            <svg
              class="cancel-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span class="cancel-text">取消</span>
          </button>
        </div>

        <!-- 下载完成 -->
        <div v-if="video.downloaded" class="download-completed">
          <span class="completed-icon">✅</span>
          <span class="completed-text">已下载</span>
          <button class="open-btn" @click="$emit('open-folder', video)">📂</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
defineProps({
  video: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

// Emits
defineEmits(['download', 'cancel-download', 'open-folder'])

// 方法
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '未知'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
}

const formatTime = (timestamp) => {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.video-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.video-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.video-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.video-main-info {
  flex: 1;
  min-width: 0;
}

.video-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.title-text {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  word-break: break-word;
  line-height: 1.4;
}

.video-index {
  background: #3b82f6;
  color: white;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.video-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  min-width: 0;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.meta-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.meta-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.meta-label {
  color: #64748b;
  font-weight: 600;
  flex-shrink: 0;
}

.meta-value {
  color: #1e293b;
  font-weight: 500;
  word-break: break-all;
}

/* 下载相关样式 - 简洁设计 */
.video-download {
  flex-shrink: 0;
  width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 下载按钮 - 简洁设计 */
.download-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  background: #10b981;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  font-weight: 500;
  width: 100%;
  min-height: 50px;
}

.download-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.download-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.download-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.download-text {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

/* 下载进度 - 简洁设计 */
.download-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 12px;
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.progress-text {
  font-size: 11px;
  color: #1e40af;
  font-weight: 600;
}

.progress-percentage {
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: #ef4444;
  color: white;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.cancel-icon {
  flex-shrink: 0;
}

.cancel-text {
  font-size: 11px;
  font-weight: 600;
}

/* 下载完成 - 简洁设计 */
.download-completed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 12px;
  background: #ecfdf5;
  border: 1px solid #10b981;
  border-radius: 8px;
}

.completed-icon {
  font-size: 20px;
}

.completed-text {
  font-size: 11px;
  color: #065f46;
  font-weight: 600;
}

.open-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: #06b6d4;
  color: white;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.open-btn:hover {
  background: #0891b2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-content {
    flex-direction: column;
    gap: 12px;
  }

  .video-download {
    width: 100%;
    flex-direction: row;
    justify-content: center;
  }

  .download-btn {
    width: auto;
    min-width: 80px;
    padding: 8px 16px;
    flex-direction: row;
    gap: 6px;
    min-height: auto;
  }

  .download-progress {
    flex: 1;
    max-width: 200px;
  }
}
</style>
