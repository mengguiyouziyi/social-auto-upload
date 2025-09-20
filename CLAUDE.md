# Claude Code Configuration

## Local Configuration

**核心判断**
✅ 值得做：实用主义解决方案 / ❌ 不值得做：过度设计

**关键洞察**
- 数据结构：简化是关键
- 复杂度：消除if/else分支
- 风险点：不破坏userspace

**Linus式方案**
1. 简化数据结构
2. 消除特殊情况
3. 最清晰实现
4. 零破坏性

**品味评分**
🟢 好品味 / 🟡 凑合 / 🔴 垃圾

"好代码没有特殊情况" - 永远寻找最简方案。

## Agents

### Memory Network Builder
Use memory-network-builder to create atomic memories with conclusion-focused titles and structured links in the memory/ directory.

### Library Usage Researcher
"library-usage-researcher" systematically gathers library info: docs, best practices, real-world examples. Strict workflow: identify library → get docs → search GitHub. Focus on functionality, advanced techniques, pitfalls. Output includes API specs, usage examples, warnings, and sources.

## Commands

### Commit as Prompt
```
<Context>
1. [WHAT] 重构认证中间件以支持 OAuth2 登录
   [WHY] 符合新的安全策略，允许第三方登录，对应需求 #2345
   [HOW] 引入 OAuth2 授权码流程替换 BasicAuth；向下兼容旧 Token；通过单元测试验证；需更新客户端配置
2. [WHAT] 移除废弃 API 端点
   [WHY] 为 v2.0 版本做清理，减少维护成本
   [HOW] 下线 v1 Legacy 端点并更新 API 文档；版本标识提升至 v2；通知客户端迁移
</Context>
```

## Agent Directory Info
Claude Code Agents directory contains specialized Agent config files. Memory Network Builder and Library Usage Researcher require MCP services like Context7 and Grep for optimal functionality.

## WSHobson Agents Configuration

### User-Level vs Project-Level Agents

**User-Level Agents (Global):**
- Location: `~/.config/claude/agents/` or similar user config directory
- Available across all projects
- Ideal for general-purpose agents like debugger, code-reviewer, security-auditor

**Project-Level Agents (Local):**
- Location: `.claude/agents/` in project root
- Available only for current project
- Ideal for project-specific agents and domain specialists

### Available Agents (Project-Level)

#### Core Development Agents
- **architect-review:** Master software architect for modern architecture patterns, clean architecture, microservices, event-driven systems, and DDD
- **backend-architect:** Backend architect for RESTful APIs, microservices, and scalable database design
- **frontend-developer:** Build React components, implement responsive layouts, and handle client-side state management
- **python-pro:** Master Python 3.12+ with uv, ruff, FastAPI, and async patterns

#### Quality Assurance Agents
- **debugger:** Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues
- **performance-engineer:** Modern observability, optimization, scalability. PROACTIVELY for performance challenges
- **security-auditor:** Security auditor for DevSecOps, compliance, and vulnerability assessment
- **tdd-orchestrator:** Master red-green-refactor, multi-agent workflows, AI-assisted testing. Use PROACTIVELY for TDD implementation

### Usage Examples

```bash
# Use debugger agent for troubleshooting
claude code --agent debugger

# Use TDD orchestrator for test-driven development
claude code --agent tdd-orchestrator

# Use backend architect for API design
claude code --agent backend-architect
```

### Agent Selection Guide

1. **遇到错误或问题** → `debugger`
2. **性能优化需求** → `performance-engineer`
3. **安全审查** → `security-auditor`
4. **TDD开发** → `tdd-orchestrator`
5. **架构设计** → `architect-review`
6. **后端开发** → `backend-architect`
7. **前端开发** → `frontend-developer`
8. **Python开发** → `python-pro`

## Visualization Agent

### Core Goal
为 **非程序员** 或需要快速概览的人员，清晰地展示软件中 **不同组件如何协作** 来完成一个特定功能。

### Key Principles (Must Follow)

1. **区分静态与动态:**
   - **静态 (模块定义区):** 系统有哪些主要部件 (类、场景、管理器)。
   - **动态 (功能流程区):** 特定功能是如何一步步通过这些部件实现的。

2. **聚焦交互，忽略细节:**
   - **只关心:** "谁调用了谁？"、"传递了什么关键信息？"、"信号/事件是什么？"
   - **不关心:** 组件内部的具体实现逻辑。

3. **视觉清晰与一致:**
   - **颜色编码:** 不同类型的模块使用固定颜色，全局统一。
   - **布局:** 模块区和流程区分开，流程内部整洁。
   - **标签:** 连线标签必须清晰、一致。

### Drawing Steps (How-To)

#### 1. Define Core Modules (Static Area)
- **位置:** 在 Canvas 顶部或侧边单独划定区域。
- **节点:** 每个主要模块创建一个节点。
- **标题:** 模块名 (例如: `地块放置管理器`)。
- **文件链接 (必填):** 使用 `file:` 链接到代码文件。
- **核心职责 (1-2句):** 最关键的功能 (例如: "处理地块放置/移除规则")。
- **(可选) 关键点:** 重要的依赖或信号。
- **颜色:** **必须** 为不同类型的模块指定颜色并全局统一 (例如: 管理器用绿色, UI用黄色, 场景/数据用青色, 核心逻辑用红色, IO用橙色)。

#### 2. Draw Function Flow (Dynamic Area)
- **位置:** 为每个功能创建独立的区域。
- **流程标题:** 使用大号文字节点标明功能 (例如: `**功能1: 选择地块**`)。
- **流程节点:** 放置此流程涉及的模块的 **简化版** 节点。
  - 只保留与当前流程相关的简要说明。
  - 可添加代表 "触发器" (如UI按钮、输入事件) 或 "结果" (如实例化场景) 的节点。
  - 颜色 **必须** 与静态区的模块定义保持一致。
- **交互连线 (Edges):** **这是关键！**
  - 用 **箭头** 表示交互方向。
  - **标签 (Label): 必须清晰说明交互内容！**
  - **调用:** `动词: 方法名(关键参数)` (例如: `调用: place_tile(tile_data)`)。
  - **信号:** `Signal: 信号名(参数)` (例如: `Signal: pressed` 或 `Signal: save_requested(path)`)。
  - **动作/结果:** `Action: 描述` (例如: `Action: Instantiate TileScene`, `Action: Load/Ref TileScene`)。

#### 3. Layout & Style (Polish)
- **分离:** 使用分组框 (Group) 或留白明确区分模块区和流程区。
- **整洁:** 减少连线交叉，节点排列有序。
- **一致:** 严格遵守颜色、标签格式。

### AI Prompts (Core Points)
1. **明确目标:** 要画哪个功能？
2. **找相关组件:** 涉及哪些代码文件？
3. **分析交互:** 它们之间如何调用、发信号？
4. **按步骤画:** 先画静态模块，再画动态流程。
5. **保持简洁:** 用词精练，标签清晰。

### Example Template
```json
{
    "nodes":[
        {"id":"group_f1","type":"group","x":-980,"y":-270,"width":2220,"height":240},
        {"id":"flow1_title","type":"text","text":"**功能1: 选择地块**","x":-950,"y":-250,"width":200,"height":40},
        {"id":"f1_ui","type":"text","text":"UI 控件\n(地块按钮)","x":-950,"y":-180,"width":200,"height":100,"color":"#ffeb3b"},
        {"id":"module_ui","type":"text","text":"**UI 控制器\n(LevelEditor/level_editor_ui.gd)**\n\n- 提供用户交互界面\n- **发出** 用户操作的信号","file":"LevelEditor/level_editor_ui.gd","x":-1480,"y":-1360,"width":340,"height":320,"color":"#ffeb3b"},
        {"id":"f1_le","type":"text","text":"关卡编辑器\n(处理信号, 更新选择, 创建预览)","x":-350,"y":-180,"width":270,"height":100,"color":"#ff6b6b"},
        {"id":"f1_ts","type":"text","text":"地块场景\n(加载预览)","x":980,"y":-180,"width":200,"height":100,"color":"#4db6ac"}
    ],
    "edges":[
        {"id":"edge_f1_ui_le","fromNode":"f1_ui","fromSide":"right","toNode":"f1_le","toSide":"left","label":"Signal: pressed"},
        {"id":"edge_f1_le_ts","fromNode":"f1_le","fromSide":"right","toNode":"f1_ts","toSide":"left","label":"Action: Load/Ref TileScene"}
    ]
}
```