#!/bin/bash

# 爱下 - 微信视频下载器
# GitHub发布脚本

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_dependencies() {
    print_message "检查依赖工具..."

    if ! command -v git &> /dev/null; then
        print_error "Git未安装或不在PATH中"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        print_error "Node.js未安装或不在PATH中"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm未安装或不在PATH中"
        exit 1
    fi

    print_success "所有依赖工具检查通过"
}

# 检查Git状态
check_git_status() {
    print_message "检查Git状态..."

    if [[ -n $(git status --porcelain) ]]; then
        print_warning "工作目录有未提交的更改"
        git status --short
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "发布已取消"
            exit 1
        fi
    fi

    print_success "Git状态检查通过"
}

# 运行测试
run_tests() {
    print_message "运行项目测试..."

    # 安装依赖
    npm ci

    # 代码检查
    if npm run lint; then
        print_success "代码检查通过"
    else
        print_error "代码检查失败"
        exit 1
    fi

    # 构建测试
    if npm run build; then
        print_success "构建测试通过"
    else
        print_error "构建测试失败"
        exit 1
    fi
}

# 更新版本号
update_version() {
    local version_type=${1:-patch}

    print_message "更新版本号 ($version_type)..."

    # 更新package.json版本
    npm version $version_type --no-git-tag-version

    local new_version=$(node -p "require('./package.json').version")
    print_success "版本号已更新为: v$new_version"

    echo $new_version
}

# 构建所有平台
build_all_platforms() {
    print_message "构建所有平台版本..."

    # 清理旧的构建产物
    rm -rf dist/ out/ out-obfuscated/

    # 构建基础版本
    npm run build

    # 代码混淆（生产版本）
    if [[ -f scripts/obfuscate.js ]]; then
        print_message "执行代码混淆..."
        node scripts/obfuscate.js
    fi

    print_success "所有平台构建完成"
}

# 创建Git标签和提交
create_git_release() {
    local version=$1

    print_message "创建Git发布标签..."

    # 提交版本更新
    git add package.json CHANGELOG.md
    git commit -m "chore: release v$version"

    # 创建标签
    git tag "v$version" -m "Release v$version"

    # 推送到远程
    git push origin main
    git push origin "v$version"

    print_success "Git标签 v$version 已创建并推送"
}

# 生成发布说明
generate_release_notes() {
    local version=$1

    print_message "生成发布说明..."

    # 从CHANGELOG.md提取当前版本的更新说明
    if [[ -f CHANGELOG.md ]]; then
        # 提取最新版本的更新内容
        awk '/^## \[/{if(NR>1)exit} NR>1' CHANGELOG.md > release_notes.tmp

        if [[ -s release_notes.tmp ]]; then
            print_success "发布说明已生成"
        else
            echo "Release v$version" > release_notes.tmp
            print_warning "使用默认发布说明"
        fi
    else
        echo "Release v$version" > release_notes.tmp
        print_warning "CHANGELOG.md不存在，使用默认发布说明"
    fi
}

# 主函数
main() {
    print_message "🚀 开始GitHub发布流程..."
    echo

    # 解析命令行参数
    local version_type="patch"
    local skip_tests=false
    local dry_run=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --major)
                version_type="major"
                shift
                ;;
            --minor)
                version_type="minor"
                shift
                ;;
            --patch)
                version_type="patch"
                shift
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            -h|--help)
                echo "使用方法: $0 [选项]"
                echo "选项:"
                echo "  --major      主版本号递增"
                echo "  --minor      次版本号递增"
                echo "  --patch      修订版本号递增 (默认)"
                echo "  --skip-tests 跳过测试"
                echo "  --dry-run    预演模式，不实际发布"
                echo "  -h, --help   显示帮助"
                exit 0
                ;;
            *)
                print_error "未知参数: $1"
                exit 1
                ;;
        esac
    done

    print_message "发布参数: 版本类型=$version_type, 跳过测试=$skip_tests, 预演模式=$dry_run"
    echo

    # 执行发布流程
    check_dependencies
    check_git_status

    if [[ $skip_tests == false ]]; then
        run_tests
    else
        print_warning "跳过测试阶段"
    fi

    local new_version=$(update_version $version_type)

    build_all_platforms

    generate_release_notes $new_version

    if [[ $dry_run == true ]]; then
        print_warning "预演模式：跳过Git操作"
        print_message "预计发布版本: v$new_version"
        print_message "发布说明:"
        cat release_notes.tmp
    else
        create_git_release $new_version

        print_success "🎉 发布完成！"
        echo
        print_message "下一步："
        print_message "1. 访问 GitHub 仓库的 Releases 页面"
        print_message "2. 查看自动创建的 Release（如果配置了 GitHub Actions）"
        print_message "3. 或手动创建 Release 并上传构建产物"
        print_message "4. 发布说明文件: release_notes.tmp"
    fi

    # 清理临时文件
    # rm -f release_notes.tmp

    print_success "发布脚本执行完成！"
}

# 捕获中断信号
trap 'print_error "发布流程被中断"; exit 130' INT

# 执行主函数
main "$@"
