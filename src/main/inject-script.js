// 注入脚本内容 - 嵌入式版本，避免文件路径问题
const INJECT_SCRIPT = `
// 爱下注入脚本 - 微信内置浏览器优化版
;(function () {
  'use strict'

  console.log('🎬 爱下脚本开始执行')

  // 添加可视化状态指示器（针对微信内置浏览器）
  function createStatusIndicator() {
    try {
      // 创建状态指示器元素
      const indicator = document.createElement('div')
      indicator.id = 'wvds-status-indicator'
      indicator.innerHTML = '🎬 视频捕获器已启动'
      indicator.style.cssText = \`
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 120, 212, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        cursor: pointer;
      \`

      // 3秒后淡出
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.style.opacity = '0.3'
          indicator.innerHTML = '🎬 运行中'
        }
      }, 3000)

      document.body.appendChild(indicator)

      // 点击显示状态
      indicator.addEventListener('click', () => {
        const videoCount = window.wvds_videos ? window.wvds_videos.length : 0
        const localStorageCount = localStorage.getItem('wvds_videos')
          ? JSON.parse(localStorage.getItem('wvds_videos')).length
          : 0
        indicator.innerHTML = \`🎬 内存:\${videoCount} 存储:\${localStorageCount}\`
        indicator.style.opacity = '1'
        setTimeout(() => {
          indicator.style.opacity = '0.3'
          indicator.innerHTML = '🎬 运行中'
        }, 3000)
      })

      // 存储状态指示器引用
      window.wvds_indicator = indicator
    } catch (error) {
      console.error('创建状态指示器失败:', error)
    }
  }

  // 更新状态指示器
  function updateStatusIndicator(message, color = 'rgba(0, 120, 212, 0.9)') {
    try {
      const indicator = window.wvds_indicator || document.getElementById('wvds-status-indicator')
      if (indicator) {
        indicator.innerHTML = message
        indicator.style.background = color
        indicator.style.opacity = '1'

        // 2秒后恢复默认状态
        setTimeout(() => {
          const videoCount = window.wvds_videos ? window.wvds_videos.length : 0
          indicator.innerHTML = \`🎬 已捕获: \${videoCount}个\`
          indicator.style.background = 'rgba(0, 120, 212, 0.9)'
          indicator.style.opacity = '0.3'
        }, 2000)
      }
    } catch (error) {
      console.error('更新状态指示器失败:', error)
    }
  }

  // 发送页面信息到主进程
  function sendPageInfo() {
    try {
      const pageInfo = {
        url: window.location.href,
        title: document.title || '无标题',
        timestamp: new Date().toISOString()
      }

      console.log('📄 页面信息:', pageInfo.title, '|', pageInfo.url)

      // 尝试通过fetch发送到特殊端点
      fetch('/wvds-page-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WVDS-PageInfo': 'true',
          'X-Request-ID': Date.now().toString()
        },
        body: JSON.stringify(pageInfo)
      })
        .then((response) => {
          if (response.ok) {
            return response.json()
          } else {
            throw new Error(\`HTTP \${response.status}\`)
          }
        })
        .then(() => {
          // 无需输出响应详情
        })
        .catch(() => {
          // 页面信息发送失败通常是正常的，不需要输出
        })

      // 触发自定义事件，传递页面信息
      window.dispatchEvent(
        new CustomEvent('wvds_page_info', {
          detail: pageInfo
        })
      )

      // 存储到全局变量
      window.wvds_page_info = pageInfo
    } catch (error) {
      console.error('❌ 发送页面信息失败:', error)
    }
  }

  // 页面加载完成后发送页面信息
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendPageInfo)
  } else {
    // 立即发送一次
    sendPageInfo()
  }

  // 添加额外的延迟发送，确保页面标题完全加载
  setTimeout(() => {
    sendPageInfo()
  }, 1000) // 1秒后再发送一次

  setTimeout(() => {
    sendPageInfo()
  }, 3000) // 3秒后再发送一次，处理动态加载的标题

  // 监听标题变化
  const titleObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'childList' && mutation.target === document.querySelector('title')) {
        sendPageInfo()
      }
    })
  })

  // 开始监听标题变化
  const titleElement = document.querySelector('title')
  if (titleElement) {
    titleObserver.observe(titleElement, { childList: true })
  }

  // 将函数暴露到全局作用域，供测试使用
  window.sendPageInfo = sendPageInfo

  function send_response_if_is_video(response) {
    try {
      console.log('🔍 检查响应数据:', response)
      updateStatusIndicator('🔍 分析数据...', 'rgba(255, 165, 0, 0.9)')

      // 检查响应格式
      if (!response || !response['jsapi_resp'] || !response['jsapi_resp']['resp_json']) {
        console.log('⏭️ 跳过：响应格式不匹配')
        updateStatusIndicator('⏭️ 格式不匹配', 'rgba(128, 128, 128, 0.9)')
        return
      }

      let value = JSON.parse(response['jsapi_resp']['resp_json'])
      console.log('📝 解析的响应数据:', value)

      // 检查是否包含视频数据
      if (
        !value['object'] ||
        !value['object']['object_desc'] ||
        !value['object']['object_desc']['media'] ||
        value['object']['object_desc']['media'].length == 0
      ) {
        console.log('⏭️ 跳过：无视频媒体数据')
        updateStatusIndicator('⏭️ 无视频数据', 'rgba(128, 128, 128, 0.9)')
        return
      }

      let media = value['object']['object_desc']['media'][0]
      console.log('🎬 找到媒体数据:', media)

      let description = value['object']['object_desc']['description']
        ? value['object']['object_desc']['description'].trim()
        : '无描述'

      let video_data = {
        decode_key: media['decode_key'] || '',
        url: (media['url'] || '') + (media['url_token'] || ''),
        size: media['file_size'] || 0,
        description: description,
        uploader: value['object']['nickname'] || '未知用户',
        timestamp: new Date().toISOString(),
        media_type: media['type'] || 'unknown'
      }
      console.log('🎥 发现视频数据:', video_data)

      // 存储到全局变量供外部访问
      if (!window.wvds_videos) {
        window.wvds_videos = []
      }
      window.wvds_videos.push(video_data)

      // 更新状态指示器 - 成功捕获
      const videoCount = window.wvds_videos.length
      updateStatusIndicator(\`✅ 新增视频! 总计:\${videoCount}\`, 'rgba(0, 150, 0, 0.9)')

      // 触发自定义事件
      window.dispatchEvent(
        new CustomEvent('wvds_video_found', {
          detail: video_data
        })
      )

      // 尝试通过多种方式发送数据到主应用
      try {
        // 方式1: 通过fetch发送到代理服务器的特殊端点
        fetch('/wvds-video-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WVDS-Data': 'true',
            'X-Request-ID': Date.now().toString()
          },
          body: JSON.stringify(video_data)
        })
          .then((response) => {
            if (response.ok) {
              updateStatusIndicator('📤 数据已发送', 'rgba(0, 150, 0, 0.9)')
            } else {
              updateStatusIndicator('❌ 发送失败', 'rgba(220, 53, 69, 0.9)')
            }
          })
          .catch(() => {
            updateStatusIndicator('📤 本地备份', 'rgba(255, 193, 7, 0.9)')
          })

        // 方式2: 存储到localStorage（微信内置浏览器的重要备用方案）
        const storedVideos = JSON.parse(localStorage.getItem('wvds_videos') || '[]')
        storedVideos.push(video_data)
        localStorage.setItem('wvds_videos', JSON.stringify(storedVideos))

        // 同时存储最新的一个视频到单独的key，方便检查
        localStorage.setItem('wvds_latest_video', JSON.stringify(video_data))
        localStorage.setItem('wvds_video_count', videoCount.toString())

        // 方式3: 通过console.log特殊格式输出
        console.log('WVDS_VIDEO_DATA:', JSON.stringify(video_data))

        // 方式4: 通过页面标题传递信息（微信内置浏览器可见）
        const originalTitle = document.title
        document.title = \`📹 已捕获\${videoCount}个视频 - \${originalTitle}\`
        setTimeout(() => {
          document.title = originalTitle
        }, 3000)

        // 方式5: 创建隐藏元素存储数据（可通过DOM访问）
        const dataElement = document.createElement('div')
        dataElement.id = \`wvds-data-\${Date.now()}\`
        dataElement.style.display = 'none'
        dataElement.setAttribute('data-video-info', JSON.stringify(video_data))
        document.body.appendChild(dataElement)
      } catch (error) {
        console.error('❌ 发送视频数据失败:', error)
        updateStatusIndicator('❌ 数据处理失败', 'rgba(220, 53, 69, 0.9)')
      }
    } catch (error) {
      console.error('❌ 解析视频数据失败:', error)
      console.error('原始响应:', response)
      updateStatusIndicator('❌ 解析失败', 'rgba(220, 53, 69, 0.9)')
    }
  }

  function wrapper(name, origin) {
    return function () {
      let cmdName = arguments[0]
      console.log(\`🔧 Hook触发: \${name}, 命令: \${cmdName}, 参数数量: \${arguments.length}\`)

      if (arguments.length == 3) {
        let original_callback = arguments[2]
        arguments[2] = async function () {
          console.log(\`📞 回调函数被调用, 参数数量: \${arguments.length}\`)

          if (arguments.length == 1) {
            console.log('🎯 检测到单参数回调，尝试解析视频数据')
            send_response_if_is_video(arguments[0])
          }

          // 调用原始回调
          try {
            return await original_callback.apply(this, arguments)
          } catch (error) {
            console.error('❌ 原始回调执行失败:', error)
            throw error
          }
        }
      }

      // 调用原始函数
      try {
        let result = origin.apply(this, arguments)
        console.log(\`✅ \${name} 调用成功\`)
        return result
      } catch (error) {
        console.error(\`❌ \${name} 调用失败:\`, error)
        throw error
      }
    }
  }

  // 等待WeixinJSBridge加载 - 增强版本
  function initWeixinHook() {
    if (typeof window.WeixinJSBridge !== 'undefined') {
      console.log('✅ WeixinJSBridge已找到，开始Hook')
      updateStatusIndicator('✅ WeixinJSBridge已连接', 'rgba(0, 150, 0, 0.9)')

      console.log('🔍 WeixinJSBridge对象:', window.WeixinJSBridge)
      console.log('🔍 原始invoke方法:', window.WeixinJSBridge.invoke)

      // 保存原始方法的引用
      window.WeixinJSBridge._original_invoke = window.WeixinJSBridge.invoke

      // 替换为我们的Hook版本
      window.WeixinJSBridge.invoke = wrapper('WeixinJSBridge.invoke', window.WeixinJSBridge.invoke)

      // 设置全局标识
      window.wvds = true
      window.wvds_hook_time = new Date().toISOString()

      console.log('🔧 WeixinJSBridge.invoke已被Hook')
      console.log('🔧 Hook时间:', window.wvds_hook_time)

      // 验证Hook是否成功
      if (window.WeixinJSBridge.invoke !== window.WeixinJSBridge._original_invoke) {
        console.log('✅ Hook验证成功：方法已被替换')
        updateStatusIndicator('🔧 Hook已激活', 'rgba(0, 150, 0, 0.9)')
      } else {
        console.error('❌ Hook验证失败：方法未被替换')
        updateStatusIndicator('❌ Hook失败', 'rgba(220, 53, 69, 0.9)')
      }
    } else {
      console.log('⏳ 等待WeixinJSBridge加载...')
      updateStatusIndicator('⏳ 等待微信接口...', 'rgba(255, 193, 7, 0.9)')
      setTimeout(initWeixinHook, 500)
    }
  }

  // 如果WeixinJSBridge已经存在，直接初始化
  if (typeof window.WeixinJSBridge !== 'undefined') {
    initWeixinHook()
  } else {
    // 监听WeixinJSBridge Ready事件
    document.addEventListener('WeixinJSBridgeReady', initWeixinHook, false)
    // 备用方案：定时检查
    setTimeout(initWeixinHook, 1000)
  }

  console.log('📋 爱下脚本初始化完成')

  // 延迟创建状态指示器，确保页面加载完成
  setTimeout(createStatusIndicator, 1000)

  // 添加页面可见的调试信息（微信内置浏览器友好）
  setTimeout(() => {
    // 在页面上添加调试信息的访问方法
    if (typeof window.wvds_debug === 'undefined') {
      window.wvds_debug = function () {
        const info = {
          hook_status: !!window.wvds,
          hook_time: window.wvds_hook_time,
          weixinjs_available: typeof window.WeixinJSBridge !== 'undefined',
          videos_captured: window.wvds_videos ? window.wvds_videos.length : 0,
          localStorage_videos: localStorage.getItem('wvds_videos')
            ? JSON.parse(localStorage.getItem('wvds_videos')).length
            : 0
        }

        // 通过alert显示调试信息（微信内置浏览器可见）
        alert('WVDS调试信息:\\n' + JSON.stringify(info, null, 2))
        return info
      }
    }

    // 设置页面标题包含状态信息
    const originalTitle = document.title
    if (!originalTitle.includes('WVDS')) {
      document.title = \`\${originalTitle} - WVDS已加载\`
    }
  }, 2000)
})()
`

export { INJECT_SCRIPT }
