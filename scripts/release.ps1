# 🚀 爱下 - 增强发布脚本 (PowerShell版)
# 为 WxDown Team 制作
# 版本: 1.0.0

param(
    [string]$Version = "",
    [switch]$Major,
    [switch]$Minor,
    [switch]$Patch,
    [switch]$PreRelease,
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [string]$Platform = "all"
)

# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 颜色输出函数
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")

    $colors = @{
        "Red" = "Red"
        "Green" = "Green"
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "Cyan" = "Cyan"
        "Magenta" = "Magenta"
        "White" = "White"
    }

    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "╔══════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║  $($Title.PadRight(46))  ║" "Cyan"
    Write-ColorOutput "╚══════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🔄 $Message" "Blue"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

# 检查必要工具
function Test-Dependencies {
    Write-Step "检查依赖工具..."

    $tools = @("git", "node", "npm")
    $missing = @()

    foreach ($tool in $tools) {
        if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
            $missing += $tool
        }
    }

    if ($missing.Count -gt 0) {
        Write-Error "缺少必要工具: $($missing -join ', ')"
        return $false
    }

    Write-Success "所有依赖工具已安装"
    return $true
}

# 检查Git状态
function Test-GitStatus {
    Write-Step "检查Git仓库状态..."

    $status = git status --porcelain
    if ($status) {
        Write-Warning "工作目录有未提交的更改:"
        Write-Host $status

        $continue = Read-Host "是否继续发布? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Error "发布已取消"
            return $false
        }
    }

    Write-Success "Git状态检查完成"
    return $true
}

# 运行测试
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "跳过测试"
        return $true
    }

    Write-Step "运行测试套件..."

    try {
        npm test
        if ($LASTEXITCODE -ne 0) {
            Write-Error "测试失败"
            return $false
        }
        Write-Success "所有测试通过"
        return $true
    }
    catch {
        Write-Error "测试执行异常: $($_.Exception.Message)"
        return $false
    }
}

# 更新版本号
function Update-Version {
    if ($Version) {
        Write-Step "设置版本号为: $Version"
        npm version $Version --no-git-tag-version
    }
    elseif ($Major) {
        Write-Step "升级主版本号..."
        npm version major --no-git-tag-version
    }
    elseif ($Minor) {
        Write-Step "升级次版本号..."
        npm version minor --no-git-tag-version
    }
    elseif ($Patch) {
        Write-Step "升级补丁版本号..."
        npm version patch --no-git-tag-version
    }
    else {
        Write-Warning "未指定版本更新，保持当前版本"
    }

    $currentVersion = (Get-Content package.json | ConvertFrom-Json).version
    Write-Success "当前版本: $currentVersion"
    return $currentVersion
}

# 构建项目
function Invoke-Build {
    if ($SkipBuild) {
        Write-Warning "跳过构建"
        return $true
    }

    Write-Step "清理旧构建文件..."
    if (Test-Path "dist") {
        Remove-Item -Path "dist/*" -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Step "开始构建项目..."

    try {
        switch ($Platform.ToLower()) {
            "win" {
                Write-Step "构建 Windows 版本..."
                npm run build:win
            }
            "mac" {
                Write-Step "构建 macOS 版本..."
                npm run build:mac
            }
            "linux" {
                Write-Step "构建 Linux 版本..."
                npm run build:linux
            }
            "all" {
                Write-Step "构建所有平台版本..."
                npm run build:all
            }
            default {
                Write-Error "不支持的平台: $Platform"
                return $false
            }
        }

        if ($LASTEXITCODE -ne 0) {
            Write-Error "构建失败"
            return $false
        }

        Write-Success "构建完成"
        return $true
    }
    catch {
        Write-Error "构建异常: $($_.Exception.Message)"
        return $false
    }
}

# 显示构建结果
function Show-BuildResults {
    Write-Step "检查构建产物..."

    if (!(Test-Path "dist")) {
        Write-Warning "未找到构建目录"
        return
    }

    $files = Get-ChildItem -Path "dist" -File | Where-Object { $_.Extension -in @(".exe", ".dmg", ".AppImage", ".deb", ".rpm") }

    if ($files.Count -eq 0) {
        Write-Warning "未找到构建产物"
        return
    }

    Write-Success "构建产物列表:"
    foreach ($file in $files) {
        $size = [math]::Round($file.Length / 1MB, 2)
        Write-Host "  📦 $($file.Name) ($size MB)" -ForegroundColor Gray
    }
}

# 创建Git标签
function New-GitTag {
    param([string]$Version)

    Write-Step "创建Git标签: v$Version"

    try {
        git add package.json
        git commit -m "chore: bump version to $Version"
        git tag -a "v$Version" -m "Release version $Version"

        Write-Success "Git标签创建完成"
        return $true
    }
    catch {
        Write-Error "Git标签创建失败: $($_.Exception.Message)"
        return $false
    }
}

# 推送到远程仓库
function Push-ToRemote {
    Write-Step "推送到远程仓库..."

    try {
        git push origin main
        git push origin --tags

        Write-Success "推送完成"
        return $true
    }
    catch {
        Write-Error "推送失败: $($_.Exception.Message)"
        return $false
    }
}

# 生成发布说明
function New-ReleaseNotes {
    param([string]$Version)

    $releaseNotes = @"
# 🎉 爱下 v$Version 发布

## 📥 下载链接

### Windows
- **安装版**: ``wxdown-$Version-setup.exe`` (推荐)
- **便携版**: ``爱下 $Version.exe``

### macOS
- **通用版**: ``wxdown-$Version.dmg``
- **Apple Silicon**: ``wxdown-$Version-arm64.dmg``

### Linux
- **AppImage**: ``wxdown-$Version.AppImage``
- **Debian/Ubuntu**: ``wxdown_$Version_amd64.deb``
- **Red Hat/CentOS**: ``wxdown-$Version.x86_64.rpm``

## ✨ 主要功能

- 🎬 智能监控微信视频号，自动捕获视频信息
- 📥 批量下载，支持多任务并发处理
- 🔒 本地处理，保护用户隐私
- 🌐 跨平台支持，Windows/macOS/Linux通用
- 🛡️ 内置代理服务，透明流量拦截
- 📱 现代化界面，操作简单直观

## 🔧 系统要求

- **Windows**: Windows 10 或更高版本
- **macOS**: macOS 10.15 或更高版本
- **Linux**: Ubuntu 18.04 或更高版本
- **内存**: 最少 4GB RAM
- **存储**: 最少 500MB 可用空间

## 📞 技术支持

- 🌐 **官方网站**: https://www.wxdown.xyz
- 🐛 **问题反馈**: [GitHub Issues](https://github.com/will-17173/electron-weixin-channels-downloader/issues)
- 💬 **社区讨论**: [GitHub Discussions](https://github.com/will-17173/electron-weixin-channels-downloader/discussions)
- 📧 **邮件支持**: support@wxdown.xyz

---
<div align="center">
  <p><sub>由 WxDown Team 用 ❤️ 制作</sub></p>
</div>
"@

    $releaseNotesFile = "RELEASE_NOTES_v$Version.md"
    Set-Content -Path $releaseNotesFile -Value $releaseNotes -Encoding UTF8

    Write-Success "发布说明已生成: $releaseNotesFile"
    return $releaseNotesFile
}

# 主函数
function Main {
    Write-Header "爱下 - GitHub 发布工具"

    Write-Host "🎯 开始发布流程..." -ForegroundColor Magenta
    Write-Host "📅 发布时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""

    # 检查依赖
    if (!(Test-Dependencies)) {
        exit 1
    }

    # 检查Git状态
    if (!(Test-GitStatus)) {
        exit 1
    }

    # 运行测试
    if (!(Invoke-Tests)) {
        exit 1
    }

    # 更新版本
    $currentVersion = Update-Version

    # 构建项目
    if (!(Invoke-Build)) {
        exit 1
    }

    # 显示构建结果
    Show-BuildResults

    # 创建Git标签
    if ($currentVersion -and !(New-GitTag -Version $currentVersion)) {
        exit 1
    }

    # 生成发布说明
    if ($currentVersion) {
        $releaseNotesFile = New-ReleaseNotes -Version $currentVersion
    }

    Write-Header "发布完成"
    Write-Success "🎉 发布流程执行成功!"

    if ($currentVersion) {
        Write-Host ""
        Write-ColorOutput "📋 下一步操作:" "Yellow"
        Write-Host "  1. 检查构建产物: Get-ChildItem -Path dist -File"
        Write-Host "  2. 推送到远程仓库: git push origin main && git push origin --tags"
        Write-Host "  3. 在GitHub上创建Release并上传构建产物"
        Write-Host "  4. 使用生成的发布说明: $releaseNotesFile"
        Write-Host ""
        Write-ColorOutput "🌐 项目主页: https://github.com/will-17173/electron-weixin-channels-downloader" "Cyan"
    }
}

# 脚本入口
if ($MyInvocation.InvocationName -ne '.') {
    Main
}
