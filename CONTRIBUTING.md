# 贡献指南

感谢您对社交媒体自动上传系统的关注！我们欢迎任何形式的贡献。

## 🤝 如何贡献

### 1. 报告问题

如果您发现了bug或有功能建议，请：

1. 首先检查 [Issues](https://github.com/mengguiyouziyi/social-auto-upload/issues) 页面确认问题是否已被报告
2. 如果是新问题，请创建一个新的Issue，使用合适的模板：
   - 🐛 **Bug报告**: 详细描述复现步骤、预期行为和实际行为
   - ✨ **功能请求**: 详细描述新功能的用途和预期效果
   - 📚 **文档改进**: 指出需要改进的文档部分

### 2. 提交代码

#### 开发环境设置

1. **Fork 仓库**
   ```bash
   # Fork 本仓库到您的 GitHub 账户
   ```

2. **克隆仓库**
   ```bash
   git clone https://github.com/YOUR_USERNAME/social-auto-upload.git
   cd social-auto-upload
   ```

3. **设置上游仓库**
   ```bash
   git remote add upstream https://github.com/mengguiyouziyi/social-auto-upload.git
   ```

4. **创建开发环境**
   ```bash
   # 创建虚拟环境
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # 或 venv\Scripts\activate  # Windows

   # 安装依赖
   pip install -r requirements.txt
   pip install -r requirements-dev.txt

   # 安装前端依赖
   cd sau_frontend
   npm install
   ```

#### 开发工作流

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **进行开发**
   - 遵循项目代码规范
   - 编写测试代码
   - 更新相关文档

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 填写 PR 模板
   - 等待代码审查

## 📝 代码规范

### Python 代码规范

- 遵循 [PEP 8](https://www.python.org/dev/peps/pep-0008/) 规范
- 使用类型提示 (Type Hints)
- 函数和变量使用 `snake_case`
- 类名使用 `PascalCase`
- 常量使用 `UPPER_SNAKE_CASE`

### JavaScript/Vue 代码规范

- 使用 [ESLint](https://eslint.org/) 和 [Prettier](https://prettier.io/)
- 使用 Vue 3 Composition API
- 组件名使用 `PascalCase`
- 文件名使用 `kebab-case`

### Git 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式化
refactor: 重构
test: 测试相关
chore: 构建或工具变动
```

示例：
```bash
git commit -m "feat: add douyin platform support"
git commit -m "fix: resolve login authentication issue"
git commit -m "docs: update deployment guide"
```

## 🧪 测试要求

### 后端测试

```bash
# 运行所有测试
pytest

# 运行特定测试
pytest tests/test_auth.py

# 生成覆盖率报告
pytest --cov=sau_backend --cov-report=html
```

### 前端测试

```bash
cd sau_frontend
npm test

# 运行端到端测试
npm run test:e2e
```

### 测试覆盖率要求

- 新功能的测试覆盖率不得低于 80%
- 关键业务逻辑必须有测试覆盖
- 所有测试必须通过

## 🔍 代码审查

### 审查清单

在提交 PR 之前，请确保：

- [ ] 代码符合项目规范
- [ ] 所有测试通过
- [ ] 新功能有相应的测试
- [ ] 文档已更新
- [ ] 代码没有明显的安全漏洞
- [ ] 性能影响已考虑

### 审查流程

1. **自动化检查**：CI/CD 会自动运行测试和代码检查
2. **人工审查**：至少需要一位维护者审查通过
3. **合并**：审查通过后，由维护者合并代码

## 🏷️ Issue 标签

我们使用以下标签来分类 Issue：

- `bug`: 错误报告
- `enhancement`: 功能增强
- `question`: 询问
- `documentation`: 文档问题
- `good first issue`: 适合新手
- `help wanted`: 需要帮助

## 📊 项目路线图

查看我们的 [项目看板](https://github.com/mengguiyouziyi/social-auto-upload/projects) 了解当前的开发进度和计划。

## 🎯 优先级

- 🔴 **高优先级**: 安全漏洞、生产环境bug
- 🟡 **中优先级**: 新功能、用户体验改进
- 🟢 **低优先级**: 文档改进、代码重构

## 📞 联系方式

- **GitHub Issues**: 主要的问题反馈渠道
- **讨论区**: [GitHub Discussions](https://github.com/mengguiyouziyi/social-auto-upload/discussions)
- **邮件**: your-email@example.com

## 🙏 致谢

感谢所有贡献者的努力！您的贡献让这个项目变得更好。

---

## 📄 许可证

通过贡献代码，您同意您的贡献将在 [MIT License](LICENSE) 下发布。