# 贡献指南

感谢您对爱下项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 🐛 报告错误
- 💡 提出功能建议
- 📝 改进文档
- 💻 提交代码
- 🧪 编写测试
- 🎨 UI/UX改进

## 🚀 快速开始

### 开发环境准备

1. **安装 Node.js** (>= 16.0.0)
2. **安装 Git**
3. **选择代码编辑器** (推荐 VS Code)

### 获取代码

```bash
# Fork项目到您的GitHub账户
# 然后克隆您的fork

git clone https://github.com/YOUR_USERNAME/wxdown-wechat-video-downloader.git
cd wxdown-wechat-video-downloader

# 添加上游仓库
git remote add upstream https://github.com/wxdown-team/wxdown-wechat-video-downloader.git
```

### 安装依赖

```bash
# 推荐使用pnpm
pnpm install

# 或使用npm
npm install
```

### 运行开发环境

```bash
pnpm dev
```

## 📋 贡献类型

### 🐛 报告错误

在提交错误报告前，请确保：

1. **搜索现有issue**，避免重复提交
2. **使用最新版本**测试问题是否仍然存在
3. **提供详细信息**，包括：
   - 操作系统和版本
   - Node.js版本
   - 应用版本
   - 错误的具体步骤
   - 预期行为和实际行为
   - 错误截图或日志

**错误报告模板**：

```markdown
## 🐛 错误描述
简要描述遇到的问题

## 🔄 复现步骤
1. 执行...
2. 点击...
3. 查看错误...

## 🎯 预期行为
描述您期望发生的情况

## 💻 环境信息
- OS: [e.g. Windows 11]
- Node.js: [e.g. v18.17.0]
- 应用版本: [e.g. v1.0.0]

## 📸 截图
如果适用，添加截图来帮助解释问题

## 📋 附加信息
添加任何其他有助于解决问题的信息
```

### 💡 功能建议

提交功能建议时，请：

1. **描述问题**：解释现有功能的不足
2. **提出解决方案**：详细描述您的建议
3. **考虑替代方案**：是否有其他实现方式
4. **说明动机**：为什么这个功能很重要

**功能建议模板**：

```markdown
## 🚀 功能概述
简要描述您建议的功能

## 🤔 问题描述
这个功能解决了什么问题？

## 💡 建议的解决方案
详细描述您希望的功能实现

## 🔄 替代方案
是否考虑过其他实现方式？

## 📝 附加信息
添加任何其他相关信息或截图
```

## 💻 代码贡献

### 开发流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或者对于错误修复
   git checkout -b fix/your-fix-name
   ```

2. **进行开发**
   - 遵循现有代码风格
   - 添加必要的注释
   - 编写或更新测试

3. **代码检查**
   ```bash
   # 代码风格检查
   pnpm lint

   # 自动修复格式问题
   pnpm format

   # 运行测试
   pnpm test
   ```

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**

### 代码风格

我们使用以下工具确保代码一致性：

- **ESLint**: JavaScript/Vue代码检查
- **Prettier**: 代码格式化
- **Conventional Commits**: 提交信息规范

#### 提交信息格式

我们使用 [Conventional Commits](https://conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型 (type)**：
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码逻辑）
- `refactor`: 重构（既不修复错误也不添加功能）
- `perf`: 性能优化
- `test`: 测试相关
- `build`: 构建系统或外部依赖的更改
- `ci`: CI配置文件和脚本的更改
- `chore`: 其他不修改src或test文件的更改

**示例**：
```
feat(auth): add OAuth2 login support
fix(proxy): resolve certificate installation issue
docs(readme): update installation instructions
style(app): format Vue components with prettier
```

### Pull Request 指南

在提交PR前，请确保：

1. **从最新的main分支创建分支**
2. **遵循代码风格指南**
3. **添加必要的测试**
4. **更新相关文档**
5. **填写PR模板**

**PR模板**：

```markdown
## 📝 更改描述
简要描述此PR的更改内容

## 🎯 更改类型
- [ ] 错误修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 性能优化
- [ ] 重构
- [ ] 其他

## 🧪 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过

## 📋 检查清单
- [ ] 代码遵循项目风格指南
- [ ] 自我审查了代码
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 没有引入新的警告
- [ ] 添加了测试覆盖新功能
- [ ] 所有测试都通过
```

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行集成测试
pnpm test:integration

# 生成测试覆盖率报告
pnpm test:coverage
```

### 编写测试

我们使用以下测试框架：

- **Vitest**: 单元测试框架
- **Playwright**: E2E测试框架

**测试文件命名**：
- 单元测试: `*.test.js` 或 `*.spec.js`
- E2E测试: `*.e2e.js`

**示例单元测试**：

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders properly', () => {
    const wrapper = mount(MyComponent, {
      props: { msg: 'Hello World' }
    })
    expect(wrapper.text()).toContain('Hello World')
  })
})
```

## 📚 文档贡献

文档是项目的重要组成部分。我们欢迎以下文档贡献：

- 修复文档中的错误
- 改进现有文档的清晰度
- 添加缺失的文档
- 翻译文档到其他语言

### 文档规范

- 使用 Markdown 格式
- 遵循现有的文档结构
- 提供清晰的示例
- 使用适当的标题层级

## 🎨 设计贡献

我们也欢迎UI/UX相关的贡献：

- 界面改进建议
- 图标和插图
- 用户体验优化
- 可访问性改进

## 🌍 本地化

帮助我们将应用翻译成更多语言：

1. **检查现有翻译**
2. **添加缺失的翻译**
3. **改进现有翻译**
4. **添加新语言支持**

## 📞 获取帮助

如果您在贡献过程中遇到问题：

- 📧 发送邮件到：dev@wxdown.xyz
- 💬 在 [GitHub Discussions](https://github.com/wxdown-team/wxdown-wechat-video-downloader/discussions) 中提问
- 🐛 在 [GitHub Issues](https://github.com/wxdown-team/wxdown-wechat-video-downloader/issues) 中报告问题

## 🙏 致谢

感谢所有贡献者的努力！您的贡献使这个项目变得更好。

---

<div align="center">
  <sub>Built with ❤️ by the WxDown community</sub>
</div>
