const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const { dialog } = require('electron')

class BaseCertificateManager {
  constructor(sslCaDir) {
    this.sslCaDir = sslCaDir
    this.caCertPath = path.join(sslCaDir, 'certs', 'ca.pem')
    this.platform = process.platform

    console.log(`🖥️ 检测到平台: ${this.platform}`)
  }

  /**
   * 检查证书文件是否存在
   * @returns {boolean}
   */
  certificateExists() {
    return fs.existsSync(this.caCertPath)
  }

  /**
   * 获取证书文件路径
   * @returns {string}
   */
  getCertificatePath() {
    return this.caCertPath
  }

  /**
   * 获取当前平台
   * @returns {string}
   */
  getPlatform() {
    return this.platform
  }

  /**
   * 验证证书内容和元数据
   * @returns {{valid: boolean, error?: string, details?: object}}
   */
  validateCertificate() {
    if (!this.certificateExists()) {
      return { valid: false, error: '证书文件不存在' }
    }

    try {
      const content = fs.readFileSync(this.caCertPath, 'utf8')
      if (!content.includes('BEGIN CERTIFICATE') || !content.includes('END CERTIFICATE')) {
        return { valid: false, error: '证书文件格式不正确' }
      }
    } catch (error) {
      return { valid: false, error: `读取证书文件失败: ${error.message}` }
    }

    return { valid: true }
  }

  /**
   * 获取证书文件详细信息
   * @returns {{size: number, created: Date, modified: Date, path: string} | {error: string}}
   */
  getCertificateDetails() {
    if (!this.certificateExists()) {
      return { error: '证书文件不存在' }
    }

    try {
      const stats = fs.statSync(this.caCertPath)
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        path: this.caCertPath
      }
    } catch (error) {
      return { error: `获取证书详情失败: ${error.message}` }
    }
  }

  async exportCertificate() {
    if (!this.certificateExists()) {
      return { success: false, error: '证书文件不存在，无法导出' }
    }

    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: '导出证书',
        defaultPath: path.join(os.homedir(), 'wechat-video-downloader-cert.crt'),
        filters: [{ name: 'Certificates', extensions: ['crt'] }]
      })

      if (canceled || !filePath) {
        console.log('用户取消了导出操作')
        return { success: false, error: '用户取消了导出操作' }
      }

      await fs.copy(this.caCertPath, filePath)
      console.log(`证书已成功导出到: ${filePath}`)
      return { success: true, path: filePath }
    } catch (error) {
      console.error(`导出证书时出错: ${error.message}`)
      return { success: false, error: error.message }
    }
  }
}

export default BaseCertificateManager
