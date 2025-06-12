// 证书管理器基类 - 定义统一接口
import fs from 'fs'
import path from 'path'

class BaseCertificateManager {
  constructor(sslCaDir) {
    this.sslCaDir = sslCaDir
    this.caCertPath = path.join(sslCaDir, 'certs', 'ca.pem')
    this.platform = process.platform

    console.log(`🖥️ 检测到平台: ${this.platform}`)
  }

  /**
   * 检查证书文件是否存在
   */
  certificateExists() {
    return fs.existsSync(this.caCertPath)
  }

  /**
   * 获取证书路径
   */
  getCertificatePath() {
    return this.caCertPath
  }

  /**
   * 获取平台类型
   */
  getPlatform() {
    return this.platform
  }

  // ============ 抽象方法 - 子类必须实现 ============

  /**
   * 获取证书的通用名称（CN）
   * @abstract
   */
  async getCertificateCommonName() {
    throw new Error('getCertificateCommonName() 方法必须在子类中实现')
  }

  /**
   * 安装证书到系统存储
   * @abstract
   */
  async installCertificate() {
    throw new Error('installCertificate() 方法必须在子类中实现')
  }

  /**
   * 检查证书是否已安装
   * @abstract
   */
  async isCertificateInstalled() {
    throw new Error('isCertificateInstalled() 方法必须在子类中实现')
  }

  /**
   * 卸载证书
   * @abstract
   */
  async uninstallCertificate() {
    throw new Error('uninstallCertificate() 方法必须在子类中实现')
  }

  /**
   * 自动管理证书（安装或重新安装）
   * @abstract
   */
  async autoManageCertificate() {
    throw new Error('autoManageCertificate() 方法必须在子类中实现')
  }

  // ============ 通用工具方法 ============

  /**
   * 等待指定时间
   */
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 验证证书文件格式
   */
  validateCertificateFile() {
    if (!this.certificateExists()) {
      return { valid: false, error: '证书文件不存在' }
    }

    try {
      const content = fs.readFileSync(this.caCertPath, 'utf8')
      if (!content.includes('BEGIN CERTIFICATE') || !content.includes('END CERTIFICATE')) {
        return { valid: false, error: '证书文件格式不正确' }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: `读取证书文件失败: ${error.message}` }
    }
  }

  /**
   * 获取证书文件信息
   */
  getCertificateFileInfo() {
    if (!this.certificateExists()) {
      return null
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
      console.error('获取证书文件信息失败:', error.message)
      return null
    }
  }
}

export default BaseCertificateManager
