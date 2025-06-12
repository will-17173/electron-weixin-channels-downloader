// macOS 平台证书管理器
import { exec } from 'child_process'
import { promisify } from 'util'
import { dialog, shell } from 'electron'
import BaseCertificateManager from './base-cert-manager.js'

const execAsync = promisify(exec)

class MacOSCertificateManager extends BaseCertificateManager {
  constructor(sslCaDir) {
    super(sslCaDir)
    this.keychain = '/Library/Keychains/System.keychain' // 系统钥匙串
  }

  /**
   * 获取证书的通用名称（CN）
   */
  async getCertificateCommonName() {
    try {
      const { stdout } = await execAsync(`openssl x509 -in "${this.caCertPath}" -noout -subject`)
      const cnMatch = stdout.match(/CN=([^,\r\n]+)/)
      return cnMatch ? cnMatch[1].trim() : null
    } catch (error) {
      console.error('获取证书CN失败:', error.message)
      return null
    }
  }

  /**
   * 安装证书到 macOS 系统钥匙串
   */
  async installCertificate() {
    try {
      if (!this.certificateExists()) {
        throw new Error('证书文件不存在')
      }

      console.log('🔧 正在安装CA证书到macOS系统钥匙串...')

      // 方法1: 尝试使用 security 命令自动安装
      if (await this._trySecurityInstall()) {
        return true
      }

      // 方法2: 打开证书文件让用户手动安装
      return await this._openCertificateForManualInstall()
    } catch (error) {
      console.error('❌ macOS证书安装失败:', error.message)
      throw error
    }
  }

  /**
   * 尝试使用 security 命令安装证书
   * @private
   */
  async _trySecurityInstall() {
    try {
      // 使用 security 命令添加到系统钥匙串
      const command = `security add-trusted-cert -d -r trustRoot -k "${this.keychain}" "${this.caCertPath}"`
      await execAsync(command)

      console.log('✅ 使用 security 命令成功安装证书')
      return true
    } catch (error) {
      console.log('security命令安装失败（可能需要管理员权限）:', error.message)
      return false
    }
  }

  /**
   * 打开证书文件供用户手动安装
   * @private
   */
  async _openCertificateForManualInstall() {
    try {
      console.log('🔐 打开证书文件供手动安装...')

      // 显示安装指导对话框
      await this._showInstallationGuide()

      // 打开证书文件
      await shell.openPath(this.caCertPath)

      console.log('✅ 证书文件已打开，请按照指导完成安装')
      return true
    } catch (error) {
      console.error('打开证书文件失败:', error.message)
      return false
    }
  }

  /**
   * 显示安装指导对话框
   * @private
   */
  async _showInstallationGuide() {
    try {
      if (dialog && dialog.showMessageBox) {
        await dialog.showMessageBox(null, {
          type: 'info',
          title: 'macOS 证书安装指导',
          message: '即将打开证书文件，请按照以下步骤完成安装：',
          detail: `1. 双击打开的证书文件
2. 在"钥匙串访问"中选择"系统"钥匙串
3. 点击"添加"按钮
4. 输入管理员密码确认
5. 找到添加的证书，双击打开
6. 展开"信任"部分
7. 将"使用此证书时"设置为"始终信任"
8. 关闭证书详情窗口并输入密码确认`,
          buttons: ['确定']
        })
      }
    } catch (error) {
      console.log('显示安装指导失败:', error.message)
    }
  }

  /**
   * 检查证书是否已安装到 macOS 系统
   */
  async isCertificateInstalled() {
    try {
      // 方法1: 通过 security 命令检查
      if (await this._checkCertificateBySecurity()) {
        return true
      }

      // 方法2: 通过证书 CN 检查
      return await this._checkCertificateByCommonName()
    } catch (error) {
      console.log('检查证书安装状态失败:', error.message)
      return false
    }
  }

  /**
   * 通过 security 命令检查证书
   * @private
   */
  async _checkCertificateBySecurity() {
    try {
      // 查找包含特定内容的证书
      const { stdout } = await execAsync(
        `security find-certificate -c "NodeMITMProxyCA" "${this.keychain}"`
      )
      if (stdout.includes('NodeMITMProxyCA')) {
        console.log('✅ 通过security命令找到MITM证书')
        return true
      }
      return false
    } catch (error) {
      console.log('security命令检查失败:', error.message)
      return false
    }
  }

  /**
   * 通过证书CN检查
   * @private
   */
  async _checkCertificateByCommonName() {
    try {
      const cn = await this.getCertificateCommonName()
      if (!cn) return false

      // 搜索系统钥匙串中的证书
      const { stdout } = await execAsync(`security find-certificate -c "${cn}" "${this.keychain}"`)
      if (stdout.includes(cn)) {
        console.log(`✅ 通过CN找到证书: ${cn}`)
        return true
      }
      return false
    } catch (error) {
      console.log('CN检查方法失败:', error.message)
      return false
    }
  }

  /**
   * 卸载 macOS 证书
   */
  async uninstallCertificate() {
    try {
      console.log('🗑️ 正在从macOS系统钥匙串卸载CA证书...')

      // 方法1: 通过 security 命令删除
      if (await this._uninstallBySecurity()) {
        return true
      }

      // 方法2: 显示手动删除指导
      return await this._showUninstallGuide()
    } catch (error) {
      console.error('❌ macOS证书卸载失败:', error.message)
      throw error
    }
  }

  /**
   * 通过 security 命令删除证书
   * @private
   */
  async _uninstallBySecurity() {
    try {
      const cn = await this.getCertificateCommonName()
      if (!cn) {
        console.log('无法获取证书CN，跳过security删除')
        return false
      }

      console.log(`使用security命令删除证书: ${cn}`)
      const command = `security delete-certificate -c "${cn}" "${this.keychain}"`
      await execAsync(command)

      // 验证删除是否成功
      await this.sleep(1000)
      const stillInstalled = await this.isCertificateInstalled()
      if (!stillInstalled) {
        console.log('✅ 证书已成功卸载')
        return true
      }
      return false
    } catch (error) {
      console.log('security命令删除失败:', error.message)
      return false
    }
  }

  /**
   * 显示手动卸载指导
   * @private
   */
  async _showUninstallGuide() {
    try {
      if (dialog && dialog.showMessageBox) {
        const result = await dialog.showMessageBox(null, {
          type: 'info',
          title: 'macOS 证书卸载指导',
          message: '自动卸载失败，请手动删除证书：',
          detail: `1. 打开"钥匙串访问"应用
2. 选择"系统"钥匙串
3. 在搜索框中输入"NodeMITMProxyCA"或"MITM"
4. 找到相关证书，右键选择"删除"
5. 输入管理员密码确认删除`,
          buttons: ['打开钥匙串访问', '稍后手动操作']
        })

        if (result.response === 0) {
          // 打开钥匙串访问应用
          await execAsync('open -a "Keychain Access"')
          console.log('✅ 已打开钥匙串访问应用')
        }
      }
      return true
    } catch (error) {
      console.log('显示卸载指导失败:', error.message)
      return false
    }
  }

  /**
   * 自动管理证书（安装或重新安装）
   */
  async autoManageCertificate() {
    try {
      console.log('🔄 开始自动管理证书...')

      if (!this.certificateExists()) {
        throw new Error('证书文件不存在，请先启动代理生成证书')
      }

      // 验证证书文件格式
      const validation = this.validateCertificateFile()
      if (!validation.valid) {
        throw new Error(`证书文件验证失败: ${validation.error}`)
      }

      // 检查是否已安装
      const installed = await this.isCertificateInstalled()
      if (installed) {
        console.log('📋 证书已安装')
        return true
      }

      // 尝试安装
      console.log('📦 开始安装证书...')
      await this.installCertificate()

      console.log('✅ 证书安装流程已启动（可能需要手动完成）')
      return true
    } catch (error) {
      console.error('❌ 自动证书管理失败:', error.message)
      return false
    }
  }

  /**
   * 获取证书详细信息
   */
  async getCertificateDetails() {
    try {
      const { stdout } = await execAsync(`openssl x509 -in "${this.caCertPath}" -noout -text`)
      return stdout
    } catch (error) {
      console.error('获取证书详细信息失败:', error.message)
      return null
    }
  }

  /**
   * 检查证书有效期
   */
  async getCertificateValidity() {
    try {
      const { stdout: notBefore } = await execAsync(
        `openssl x509 -in "${this.caCertPath}" -noout -startdate`
      )
      const { stdout: notAfter } = await execAsync(
        `openssl x509 -in "${this.caCertPath}" -noout -enddate`
      )

      return {
        notBefore: notBefore.replace('notBefore=', '').trim(),
        notAfter: notAfter.replace('notAfter=', '').trim()
      }
    } catch (error) {
      console.error('获取证书有效期失败:', error.message)
      return null
    }
  }

  /**
   * 验证证书是否受信任
   */
  async isCertificateTrusted() {
    try {
      const cn = await this.getCertificateCommonName()
      if (!cn) return false

      // 检查证书信任设置
      const { stdout } = await execAsync(`security dump-trust-settings -d | grep -A 10 "${cn}"`)
      return stdout.includes('trustRoot') || stdout.includes('trustAsRoot')
    } catch (error) {
      console.log('检查证书信任状态失败:', error.message)
      return false
    }
  }
}

export default MacOSCertificateManager
