<template>
  <div v-if="visible" class="donation-overlay" @click="closeDonation">
    <div class="donation-modal" @click.stop>
      <!-- 标题栏 -->
      <div class="donation-header">
        <div class="donation-title">
          <div class="donation-icon">💖</div>
          <h2>支持开发者</h2>
        </div>
        <button class="close-btn" @click="closeDonation">
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
      <div class="donation-content">
        <!-- 感谢文字 -->
        <div class="thank-you-section">
          <div class="thank-you-icon">🙏</div>
          <h3>感谢您的支持</h3>
          <p>
            如果这个应用对您有帮助，欢迎通过赞赏支持开发者继续改进和维护这个项目。
            您的支持是我们前进的动力！
          </p>
        </div>

        <!-- 收款码区域 -->
        <div class="payment-section">
          <div class="payment-methods">
            <!-- 微信支付 -->
            <div class="payment-item">
              <div class="qr-code-container">
                <img
                  :src="wechatQrCode"
                  alt="微信收款码"
                  class="qr-code"
                  @error="handleImageError"
                />
                <div class="qr-code-label">扫码支付</div>
              </div>
            </div>

            <!-- 支付宝 -->
            <div class="payment-item">
              <div class="qr-code-container">
                <img
                  :src="alipayQrCode"
                  alt="支付宝收款码"
                  class="qr-code"
                  @error="handleImageError"
                />
                <div class="qr-code-label">扫码支付</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="donation-footer">
        <div class="footer-text">💝 每一份支持都是对开发者最大的鼓励</div>
        <button class="btn-primary" @click="closeDonation">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import wechatImg from '../assets/wechat.jpg'
import alipayImg from '../assets/alipay.jpg'

// Props
defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible'])

// 图片路径
const wechatQrCode = wechatImg
const alipayQrCode = alipayImg

// 关闭赞赏弹窗
const closeDonation = () => {
  emit('update:visible', false)
}

// 处理图片加载错误
const handleImageError = (event) => {
  console.warn('收款码图片加载失败:', event.target.src)
  event.target.style.display = 'none'

  // 显示错误提示
  const container = event.target.parentElement
  if (container && !container.querySelector('.image-error')) {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'image-error'
    errorDiv.textContent = '收款码暂时无法显示'
    container.appendChild(errorDiv)
  }
}
</script>

<style scoped>
.donation-overlay {
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

.donation-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.donation-header {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  padding: 24px 32px;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.donation-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.donation-icon {
  font-size: 24px;
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.donation-title h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.donation-content {
  padding: 32px;
}

.thank-you-section {
  text-align: center;
  margin-bottom: 32px;
}

.thank-you-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.thank-you-section h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #374151;
}

.thank-you-section p {
  font-size: 16px;
  line-height: 1.6;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.features-list {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.feature-icon {
  font-size: 16px;
}

.payment-section {
  margin-bottom: 32px;
}

.payment-section h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #374151;
  text-align: center;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.payment-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.payment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.payment-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.payment-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.payment-logo.wechat {
  background: #07c160;
  color: white;
}

.payment-logo.alipay {
  background: #1677ff;
  color: white;
}

.payment-name {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.qr-code-container {
  position: relative;
}

.qr-code {
  width: 220px;
  height: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  object-fit: cover;
}

.qr-code-label {
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
}

.image-error {
  width: 180px;
  height: 180px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
  margin: 0 auto;
}

.other-support {
  margin-bottom: 16px;
}

.other-support h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #374151;
  text-align: center;
}

.support-options {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.support-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.support-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.support-icon {
  font-size: 16px;
}

.donation-footer {
  background: #f9fafb;
  padding: 20px 32px;
  border-radius: 0 0 16px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e5e7eb;
}

.footer-text {
  font-size: 14px;
  color: #6b7280;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .donation-modal {
    width: 95%;
    margin: 20px;
  }

  .donation-content {
    padding: 24px 20px;
  }

  .donation-header {
    padding: 20px 24px;
  }

  .payment-methods {
    grid-template-columns: 1fr;
  }

  .support-options {
    flex-direction: column;
    align-items: center;
  }

  .support-btn {
    min-width: 120px;
    justify-content: center;
  }

  .donation-footer {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>
