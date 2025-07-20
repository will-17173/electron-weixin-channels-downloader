// 主证书管理器 - 工厂模式，根据平台自动选择合适的管理器
import WindowsCertificateManager from './windows-cert-manager.js'
import MacOSCertificateManager from './macos-cert-manager.js'

class CertificateManagerFactory {
  /**
   * 根据平台创建合适的证书管理器
   * @param {string} sslCaDir SSL CA目录路径
   * @returns {BaseCertificateManager} 证书管理器实例
   */
  static create(sslCaDir) {
    const platform = process.platform

    switch (platform) {
      case 'win32':
        console.log('🏗️ 创建Windows证书管理器')
        return new WindowsCertificateManager(sslCaDir)

      case 'darwin':
        console.log('🏗️ 创建macOS证书管理器')
        return new MacOSCertificateManager(sslCaDir)

      case 'linux':
        console.log('⚠️ Linux平台暂不支持自动证书管理')
        throw new Error('Linux平台暂不支持自动证书管理，请手动安装证书')

      default:
        console.log(`⚠️ 不支持的平台: ${platform}`)
        throw new Error(`不支持的平台: ${platform}，请手动安装证书`)
    }
  }

  /**
   * 获取支持的平台列表
   * @returns {Array<string>} 支持的平台列表
   */
  static getSupportedPlatforms() {
    return ['win32', 'darwin']
  }

  /**
   * 检查当前平台是否支持
   * @returns {boolean} 是否支持当前平台
   */
  static isPlatformSupported() {
    return this.getSupportedPlatforms().includes(process.platform)
  }

  /**
   * 获取当前平台的显示名称
   * @returns {string} 平台显示名称
   */
  static getPlatformDisplayName() {
    const platform = process.platform
    const platformNames = {
      win32: 'Windows',
      darwin: 'macOS',
      linux: 'Linux',
      freebsd: 'FreeBSD',
      openbsd: 'OpenBSD',
      sunos: 'SunOS',
      aix: 'AIX'
    }

    return platformNames[platform] || platform
  }
}

// 为了保持向后兼容，导出一个默认的证书管理器类
class CertificateManager {
  constructor(sslCaDir) {
    // 使用工厂模式创建实际的管理器实例
    this._manager = CertificateManagerFactory.create(sslCaDir)
  }

  // 代理所有方法到实际的管理器实例
  certificateExists() {
    return this._manager.certificateExists()
  }

  getCertificatePath() {
    return this._manager.getCertificatePath()
  }

  getPlatform() {
    return this._manager.getPlatform()
  }

  async getCertificateCommonName() {
    return await this._manager.getCertificateCommonName()
  }

  async installCertificate() {
    return await this._manager.installCertificate()
  }

  async isCertificateInstalled() {
    return await this._manager.isCertificateInstalled()
  }

  async uninstallCertificate() {
    return await this._manager.uninstallCertificate()
  }

  async exportCertificate() {
    return await this._manager.exportCertificate()
  }

  async autoManageCertificate() {
    return await this._manager.autoManageCertificate()
  }

  validateCertificateFile() {
    return this._manager.validateCertificateFile()
  }

  getCertificateFileInfo() {
    return this._manager.getCertificateFileInfo()
  }

  async sleep(ms) {
    return await this._manager.sleep(ms)
  }

  // Windows特有方法（仅在Windows平台可用）
  async getCertificateThumbprint() {
    if (this._manager.getCertificateThumbprint) {
      return await this._manager.getCertificateThumbprint()
    }
    throw new Error('getCertificateThumbprint() 仅在Windows平台可用')
  }

  async checkAdminPermissions() {
    if (this._manager.checkAdminPermissions) {
      return await this._manager.checkAdminPermissions()
    }
    throw new Error('checkAdminPermissions() 仅在Windows平台可用')
  }

  // macOS特有方法（仅在macOS平台可用）
  async getCertificateDetails() {
    if (this._manager.getCertificateDetails) {
      return await this._manager.getCertificateDetails()
    }
    throw new Error('getCertificateDetails() 仅在macOS平台可用')
  }

  async getCertificateValidity() {
    if (this._manager.getCertificateValidity) {
      return await this._manager.getCertificateValidity()
    }
    throw new Error('getCertificateValidity() 仅在macOS平台可用')
  }

  async isCertificateTrusted() {
    if (this._manager.isCertificateTrusted) {
      return await this._manager.isCertificateTrusted()
    }
    throw new Error('isCertificateTrusted() 仅在macOS平台可用')
  }

  // 获取平台特定的管理器实例（用于高级操作）
  getPlatformManager() {
    return this._manager
  }

  // 静态方法，直接从工厂类暴露
  static create(sslCaDir) {
    return CertificateManagerFactory.create(sslCaDir)
  }

  static getSupportedPlatforms() {
    return CertificateManagerFactory.getSupportedPlatforms()
  }

  static isPlatformSupported() {
    return CertificateManagerFactory.isPlatformSupported()
  }

  static getPlatformDisplayName() {
    return CertificateManagerFactory.getPlatformDisplayName()
  }
}

export default CertificateManager
export { CertificateManagerFactory, WindowsCertificateManager, MacOSCertificateManager }
