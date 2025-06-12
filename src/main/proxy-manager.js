import { execSync } from 'child_process'
import os from 'os'

/**
 * 系统代理管理器
 * 用于设置和清除系统代理配置
 */
class ProxyManager {
  constructor() {
    this.platform = os.platform()
    this.proxyHost = '127.0.0.1'
    this.proxyPort = 57392
  }

  /**
   * 设置系统代理
   * @  static async getProxyStatus() {
    // 这里简化处理，实际可以查询具体的网络服务状态
    return { enabled: false, note: 'macOS 代理状态检查功能待完善' }
  }tring} host - 代理主机地址
   * @param {number} port - 代理端口
   * @returns {Promise<boolean>} - 设置成功返回 true
   */
  async setSystemProxy(host = this.proxyHost, port = this.proxyPort) {
    try {
      if (this.platform === 'win32') {
        return await this.setWindowsProxy(host, port)
      } else if (this.platform === 'darwin') {
        return await this.setMacProxy(host, port)
      } else {
        throw new Error(`不支持的平台: ${this.platform}`)
      }
    } catch (error) {
      console.error('设置系统代理失败:', error.message)
      return false
    }
  }

  /**
   * 清除系统代理
   * @returns {Promise<boolean>} - 清除成功返回 true
   */
  async clearSystemProxy() {
    try {
      if (this.platform === 'win32') {
        return await this.clearWindowsProxy()
      } else if (this.platform === 'darwin') {
        return await this.clearMacProxy()
      } else {
        throw new Error(`不支持的平台: ${this.platform}`)
      }
    } catch (error) {
      console.error('清除系统代理失败:', error.message)
      return false
    }
  }

  /**
   * 检查系统代理状态
   * @returns {Promise<object>} - 返回代理状态信息
   */
  async getProxyStatus() {
    try {
      if (this.platform === 'win32') {
        return await this.getWindowsProxyStatus()
      } else if (this.platform === 'darwin') {
        return await this.getMacProxyStatus()
      } else {
        return { enabled: false, error: `不支持的平台: ${this.platform}` }
      }
    } catch (error) {
      console.error('获取代理状态失败:', error.message)
      return { enabled: false, error: error.message }
    }
  }

  /**
   * Windows 系统代理设置
   */
  async setWindowsProxy(host, port) {
    try {
      const proxyServer = `${host}:${port}`

      // 设置代理服务器
      execSync(
        `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "${proxyServer}" /f`,
        {
          stdio: 'ignore'
        }
      )

      // 启用代理
      execSync(
        `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f`,
        {
          stdio: 'ignore'
        }
      )

      // 设置代理覆盖（绕过本地地址）
      execSync(
        `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyOverride /t REG_SZ /d "localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*;<local>" /f`,
        {
          stdio: 'ignore'
        }
      )

      console.log(`✅ Windows 系统代理已设置: ${proxyServer}`)
      return true
    } catch (error) {
      console.error('设置 Windows 代理失败:', error.message)
      return false
    }
  }

  /**
   * 清除 Windows 系统代理
   */
  async clearWindowsProxy() {
    try {
      // 禁用代理
      execSync(
        `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`,
        {
          stdio: 'ignore'
        }
      )

      console.log('✅ Windows 系统代理已清除')
      return true
    } catch (error) {
      console.error('清除 Windows 代理失败:', error.message)
      return false
    }
  }

  /**
   * 获取 Windows 代理状态
   */
  async getWindowsProxyStatus() {
    try {
      let enabled = false
      let server = ''

      try {
        const enableResult = execSync(
          'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable',
          {
            encoding: 'utf8',
            stdio: 'pipe'
          }
        )
        enabled = enableResult.includes('0x1')
      } catch {
        // 如果查询失败，默认为未启用
      }

      if (enabled) {
        try {
          const serverResult = execSync(
            'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer',
            {
              encoding: 'utf8',
              stdio: 'pipe'
            }
          )
          const match = serverResult.match(/ProxyServer\s+REG_SZ\s+(.+)/)
          if (match) {
            server = match[1].trim()
          }
        } catch {
          // 如果查询失败，server 保持空字符串
        }
      }

      return {
        enabled,
        server,
        isOurProxy: server === `${this.proxyHost}:${this.proxyPort}`
      }
    } catch (error) {
      return { enabled: false, error: error.message }
    }
  }

  /**
   * macOS 系统代理设置
   */
  async setMacProxy(host, port) {
    try {
      // 获取活动的网络服务
      const services = execSync('networksetup -listallnetworkservices', { encoding: 'utf8' })
      const serviceLines = services.split('\n').filter((line) => line.trim() && !line.includes('*'))

      for (const service of serviceLines) {
        const serviceName = service.trim()
        if (
          serviceName &&
          serviceName !== 'An asterisk (*) denotes that a network service is disabled.'
        ) {
          try {
            // 设置 HTTP 代理
            execSync(`networksetup -setwebproxy "${serviceName}" ${host} ${port}`, {
              stdio: 'ignore'
            })
            // 设置 HTTPS 代理
            execSync(`networksetup -setsecurewebproxy "${serviceName}" ${host} ${port}`, {
              stdio: 'ignore'
            })
          } catch {
            // 某些服务可能无法设置代理，继续处理其他服务
          }
        }
      }

      console.log(`✅ macOS 系统代理已设置: ${host}:${port}`)
      return true
    } catch (error) {
      console.error('设置 macOS 代理失败:', error.message)
      return false
    }
  }

  /**
   * 清除 macOS 系统代理
   */
  async clearMacProxy() {
    try {
      // 获取活动的网络服务
      const services = execSync('networksetup -listallnetworkservices', { encoding: 'utf8' })
      const serviceLines = services.split('\n').filter((line) => line.trim() && !line.includes('*'))

      for (const service of serviceLines) {
        const serviceName = service.trim()
        if (
          serviceName &&
          serviceName !== 'An asterisk (*) denotes that a network service is disabled.'
        ) {
          try {
            // 禁用 HTTP 代理
            execSync(`networksetup -setwebproxystate "${serviceName}" off`, { stdio: 'ignore' })
            // 禁用 HTTPS 代理
            execSync(`networksetup -setsecurewebproxystate "${serviceName}" off`, {
              stdio: 'ignore'
            })
          } catch {
            // 某些服务可能无法设置代理，继续处理其他服务
          }
        }
      }

      console.log('✅ macOS 系统代理已清除')
      return true
    } catch (error) {
      console.error('清除 macOS 代理失败:', error.message)
      return false
    }
  }

  /**
   * 获取 macOS 代理状态
   */
  async getMacProxyStatus() {
    // 这里简化处理，实际可以查询具体的网络服务状态
    return { enabled: false, note: 'macOS 代理状态检查功能待完善' }
  }
}

export default ProxyManager
