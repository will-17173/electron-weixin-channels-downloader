// Windows 平台证书管理器
import { exec } from 'child_process'
import { promisify } from 'util'
import { dialog } from 'electron'
import BaseCertificateManager from './base-cert-manager.js'

const execAsync = promisify(exec)

class WindowsCertificateManager extends BaseCertificateManager {
  constructor(sslCaDir) {
    super(sslCaDir)
    this.certStore = 'Root' // Windows 根证书存储
  }

  /**
   * 获取证书的通用名称（CN）
   */
  async getCertificateCommonName() {
    try {
      const { stdout } = await execAsync(`certutil -dump "${this.caCertPath}"`)
      const cnMatch = stdout.match(/CN=([^,\r\n]+)/)
      return cnMatch ? cnMatch[1].trim() : null
    } catch (error) {
      console.error('获取证书CN失败:', error.message)
      return null
    }
  }

  /**
   * 安装证书到 Windows 系统存储
   */
  async installCertificate() {
    try {
      if (!this.certificateExists()) {
        throw new Error('证书文件不存在')
      }

      console.log('🔧 正在安装CA证书到Windows证书存储...')

      // 方法1: 尝试直接安装（如果已有管理员权限）
      if (await this._tryDirectInstall()) {
        return true
      }

      // 方法2: 以管理员权限运行安装
      return await this._installWithAdminPrivileges()
    } catch (error) {
      console.error('❌ Windows证书安装失败:', error.message)
      throw error
    }
  }

  /**
   * 尝试直接安装证书
   * @private
   */
  async _tryDirectInstall() {
    try {
      const command = `certutil -addstore "${this.certStore}" "${this.caCertPath}"`
      const { stdout, stderr } = await execAsync(command)

      if (stdout.includes('添加证书') || stdout.includes('Certificate') || !stderr) {
        console.log('✅ 证书已成功安装到Windows证书存储')
        return true
      }
      return false
    } catch (error) {
      console.log('直接安装失败，需要管理员权限:', error.message)
      return false
    }
  }

  /**
   * 以管理员权限安装证书
   * @private
   */
  async _installWithAdminPrivileges() {
    try {
      console.log('🔐 请求管理员权限安装证书...')

      // 使用PowerShell以管理员权限运行certutil
      const escapedPath = this.caCertPath.replace(/\\/g, '\\\\')
      const command = `Start-Process certutil -ArgumentList '-addstore', '${this.certStore}', '${escapedPath}' -Verb RunAs -Wait -WindowStyle Hidden`

      await execAsync(`powershell.exe -Command "${command}"`)

      // 等待安装完成
      await this.sleep(2000)

      // 验证安装是否成功
      const isInstalled = await this.isCertificateInstalled()
      if (isInstalled) {
        console.log('✅ 使用管理员权限成功安装证书')
        return true
      } else {
        throw new Error('证书安装后验证失败')
      }
    } catch (error) {
      console.log('管理员权限安装失败:', error.message)
      throw new Error('需要管理员权限安装证书。请以管理员身份运行应用程序或手动安装证书。')
    }
  }

  /**
   * 检查证书是否已安装到 Windows 系统
   */
  async isCertificateInstalled() {
    try {
      // 方法1: 通过PowerShell检查
      if (await this._checkCertificateByPowerShell()) {
        return true
      }

      // 方法2: 通过certutil检查（备用方法）
      return await this._checkCertificateByCertutil()
    } catch (error) {
      console.log('检查证书安装状态失败:', error.message)
      return false
    }
  }

  /**
   * 通过PowerShell检查证书
   * @private
   */
  async _checkCertificateByPowerShell() {
    try {
      const psCommand = `Get-ChildItem -Path 'Cert:\\LocalMachine\\${this.certStore}' | Where-Object { $_.Subject -like '*NodeMITMProxyCA*' -or $_.Subject -like '*MITM*' } | Measure-Object | Select-Object -ExpandProperty Count`
      const { stdout } = await execAsync(`powershell.exe -Command "${psCommand}"`)
      const count = parseInt(stdout.trim())

      if (count > 0) {
        console.log(`✅ 通过PowerShell找到 ${count} 个MITM相关证书`)
        return true
      }
      return false
    } catch {
      console.log('PowerShell方法失败，尝试certutil方法...')
      return false
    }
  }

  /**
   * 通过certutil检查证书
   * @private
   */
  async _checkCertificateByCertutil() {
    try {
      const { stdout } = await execAsync(
        `certutil -store "${this.certStore}" | findstr /i "NodeMITMProxyCA"`
      )
      if (stdout.trim()) {
        console.log('✅ 通过certutil找到MITM证书')
        return true
      }
      return false
    } catch {
      console.log('certutil方法也失败了')
      return false
    }
  }

  /**
   * 卸载 Windows 证书
   */
  async uninstallCertificate() {
    try {
      console.log('🗑️ 正在从Windows证书存储卸载CA证书...')

      // 方法1: 通过PowerShell强制删除
      if (await this._uninstallByPowerShell()) {
        return true
      }

      // 方法2: 通过certutil删除
      return await this._uninstallByCertutil()
    } catch (error) {
      console.error('❌ Windows证书卸载失败:', error.message)
      throw error
    }
  }

  /**
   * 通过PowerShell删除证书
   * @private
   */
  async _uninstallByPowerShell() {
    try {
      console.log('使用PowerShell删除证书...')
      const psDeleteScript = `
        $certsToRemove = Get-ChildItem -Path 'Cert:\\LocalMachine\\${this.certStore}' | Where-Object { $_.Subject -like '*NodeMITMProxyCA*' -or $_.Subject -like '*MITM*' }
        $removed = 0
        foreach ($cert in $certsToRemove) {
          try {
            Remove-Item -Path $cert.PSPath -Force
            Write-Host "已删除证书: $($cert.Subject)"
            $removed++
          } catch {
            Write-Host "删除证书失败: $($cert.Subject)"
          }
        }
        Write-Host "共删除 $removed 个证书"
      `

      // 以管理员权限运行PowerShell删除脚本
      const command = `Start-Process powershell.exe -ArgumentList '-ExecutionPolicy', 'Bypass', '-Command', '${psDeleteScript}' -Verb RunAs -Wait`
      await execAsync(`powershell.exe -Command "${command}"`)

      // 验证删除是否成功
      await this.sleep(1000)
      const stillInstalled = await this.isCertificateInstalled()
      if (!stillInstalled) {
        console.log('✅ 证书已成功卸载')
        return true
      }
      return false
    } catch (error) {
      console.log('PowerShell删除失败:', error.message)
      return false
    }
  }

  /**
   * 通过certutil删除证书
   * @private
   */
  async _uninstallByCertutil() {
    try {
      const cn = await this.getCertificateCommonName()
      if (cn) {
        console.log(`尝试通过CN删除证书: ${cn}`)
        const command = `Start-Process certutil -ArgumentList '-delstore', '${this.certStore}', '${cn}' -Verb RunAs -Wait`
        await execAsync(`powershell.exe -Command "${command}"`)

        // 验证删除是否成功
        await this.sleep(1000)
        const stillInstalled = await this.isCertificateInstalled()
        if (!stillInstalled) {
          console.log('✅ 通过certutil成功删除证书')
          return true
        }
      }
      return false
    } catch (error) {
      console.log('certutil删除失败:', error.message)
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

      // 验证安装
      const verifyInstalled = await this.isCertificateInstalled()
      if (verifyInstalled) {
        console.log('✅ 证书安装并验证成功')
        return true
      } else {
        throw new Error('证书安装后验证失败')
      }
    } catch (error) {
      console.error('❌ 自动证书管理失败:', error.message)

      if (error.message.includes('管理员权限')) {
        await this._showAdminPermissionDialog()
      }

      return false
    }
  }

  /**
   * 显示管理员权限对话框
   * @private
   */
  async _showAdminPermissionDialog() {
    try {
      console.log('⚠️ 需要管理员权限才能安装证书')

      if (dialog && dialog.showMessageBox) {
        const result = await dialog.showMessageBox(null, {
          type: 'warning',
          title: '需要管理员权限',
          message: '安装HTTPS证书需要管理员权限',
          detail: '点击"重试"将请求管理员权限，或选择"稍后"手动以管理员身份运行程序。',
          buttons: ['重试', '稍后', '取消'],
          defaultId: 0,
          cancelId: 2
        })

        if (result.response === 0) {
          // 用户选择重试，再次尝试安装
          console.log('🔄 用户选择重试，再次尝试安装证书...')
          return await this.autoManageCertificate()
        }
      }
    } catch (dialogError) {
      console.log('显示对话框失败:', dialogError.message)
    }
  }

  /**
   * 获取证书指纹
   */
  async getCertificateThumbprint() {
    try {
      const psCommand = `Get-ChildItem -Path 'Cert:\\LocalMachine\\${this.certStore}' | Where-Object { $_.Subject -like '*NodeMITMProxyCA*' -or $_.Subject -like '*MITM*' } | Select-Object -First 1 -ExpandProperty Thumbprint`
      const { stdout } = await execAsync(`powershell.exe -Command "${psCommand}"`)
      return stdout.trim() || null
    } catch (error) {
      console.error('获取证书指纹失败:', error.message)
      return null
    }
  }

  /**
   * 检查是否具有管理员权限
   */
  async checkAdminPermissions() {
    try {
      // 尝试执行需要管理员权限的命令
      await execAsync('net session', { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }
}

export default WindowsCertificateManager
