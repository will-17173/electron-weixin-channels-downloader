import fs from 'fs'
import { Transform } from 'stream'
import https from 'https'
import http from 'http'
import { URL } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// 导入解密模块
let getDecryptionArray
try {
  const decryptModule = require('./decrypt.js')
  getDecryptionArray = decryptModule.getDecryptionArray
} catch (error) {
  console.error('❌ decrypt.js 导入失败:', error)
  throw error
}

// 取消令牌类
class CancelToken {
  constructor() {
    this.isCancelled = false
    this.cancelCallbacks = []
  }

  cancel() {
    if (this.isCancelled) return
    this.isCancelled = true
    this.cancelCallbacks.forEach((callback) => {
      try {
        callback()
      } catch (error) {
        console.error('取消回调错误:', error)
      }
    })
    this.cancelCallbacks = []
  }

  onCancel(callback) {
    if (this.isCancelled) {
      callback()
      return
    }
    this.cancelCallbacks.push(callback)
  }

  static create() {
    return new CancelToken()
  }
}

function xorTransform(decryptionArray) {
  let processedBytes = 0

  return new Transform({
    transform(chunk, encoding, callback) {
      try {
        if (processedBytes < decryptionArray.length) {
          const remaining = Math.min(decryptionArray.length - processedBytes, chunk.length)

          for (let i = 0; i < remaining; i++) {
            chunk[i] = chunk[i] ^ decryptionArray[processedBytes + i]
          }
          processedBytes += remaining
        }

        this.push(chunk)
        callback()
      } catch (error) {
        callback(error)
      }
    }
  })
}

function downloadFile(url, decodeKey, fullFileName, progressCallback, cancelToken = null) {
  return new Promise((resolve, reject) => {
    try {
      // 获取解密数组并确保是普通数组
      const rawDecryptionArray = getDecryptionArray(decodeKey)
      const decryptionArray =
        rawDecryptionArray instanceof Uint8Array
          ? Array.from(rawDecryptionArray)
          : rawDecryptionArray

      // 创建 XOR 流
      const xorStream = xorTransform(decryptionArray)

      // 解析 URL
      const parsedUrl = new URL(url)
      const isHttps = parsedUrl.protocol === 'https:'
      const httpModule = isHttps ? https : http

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }

      let req = null
      let writeStream = null

      // 检查是否已取消
      if (cancelToken && cancelToken.isCancelled) {
        reject(new Error('下载已被取消'))
        return
      }

      // 设置取消监听器
      if (cancelToken) {
        cancelToken.onCancel(() => {
          console.log('🚫 收到取消下载请求')
          // 清理资源
          if (req) {
            req.destroy()
          }
          if (writeStream) {
            writeStream.destroy()
            // 删除未完成的文件
            try {
              if (fs.existsSync(fullFileName)) {
                fs.unlinkSync(fullFileName)
                console.log('🗑️ 已删除未完成的下载文件')
              }
            } catch (error) {
              console.warn('删除未完成文件失败:', error.message)
            }
          }
          reject(new Error('下载已被取消'))
        })
      }

      req = httpModule.request(options, (res) => {
        // 再次检查是否已取消
        if (cancelToken && cancelToken.isCancelled) {
          req.destroy()
          reject(new Error('下载已被取消'))
          return
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
          return
        }

        let currentLen = 0
        const totalLen = parseInt(res.headers['content-length']) || 0

        // 监听数据流
        res.on('data', (chunk) => {
          // 检查是否已取消
          if (cancelToken && cancelToken.isCancelled) {
            res.destroy()
            return
          }

          currentLen += chunk.length
          if (totalLen > 0 && typeof progressCallback === 'function') {
            const progress = Math.min(currentLen / totalLen, 1)
            try {
              progressCallback(progress)
            } catch (err) {
              console.warn('进度回调错误:', err)
            }
          }
        })

        res.on('error', (err) => {
          console.error('❌ 响应流错误:', err)
          reject(err)
        })

        // 创建写入流
        writeStream = fs.createWriteStream(fullFileName)

        writeStream.on('finish', () => {
          // 最后检查是否已取消
          if (cancelToken && cancelToken.isCancelled) {
            // 如果已取消，删除文件
            try {
              if (fs.existsSync(fullFileName)) {
                fs.unlinkSync(fullFileName)
              }
            } catch (error) {
              console.warn('删除已取消文件失败:', error.message)
            }
            reject(new Error('下载已被取消'))
            return
          }

          resolve({
            fullFileName,
            totalLen
          })
        })

        writeStream.on('error', (err) => {
          console.error('❌ 文件写入错误:', err)
          reject(err)
        })

        // 开始管道传输
        res.pipe(xorStream).pipe(writeStream)
      })

      req.on('error', (err) => {
        console.error('❌ 请求错误:', err)
        reject(err)
      })

      req.setTimeout(30000, () => {
        req.destroy()
        reject(new Error('请求超时'))
      })

      req.end()
    } catch (error) {
      console.error('❌ downloadFile 初始化错误:', error)
      reject(error)
    }
  })
}

export { downloadFile, CancelToken }
