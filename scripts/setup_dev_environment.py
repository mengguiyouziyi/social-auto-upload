#!/usr/bin/env python3
"""
开发环境设置脚本
"""

import os
import sys
import subprocess
import venv
import shutil
from pathlib import Path

def run_command(cmd, description=""):
    """运行命令并处理错误"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} 完成")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} 失败: {e}")
        if e.stderr:
            print(f"错误输出: {e.stderr}")
        sys.exit(1)

def create_virtual_environment():
    """创建虚拟环境"""
    print("🐍 创建Python虚拟环境...")
    venv_path = Path("venv")

    if venv_path.exists():
        print("⚠️  虚拟环境已存在，删除后重建...")
        shutil.rmtree(venv_path)

    venv.create(venv_path, with_pip=True)
    print("✅ 虚拟环境创建完成")

def install_dependencies():
    """安装依赖"""
    print("📦 安装Python依赖...")

    # 升级pip
    run_command("venv/bin/pip install --upgrade pip", "升级pip")

    # 安装基础依赖
    if Path("requirements.txt").exists():
        run_command("venv/bin/pip install -r requirements.txt", "安装基础依赖")

    # 安装开发依赖
    if Path("requirements-dev.txt").exists():
        run_command("venv/bin/pip install -r requirements-dev.txt", "安装开发依赖")

def setup_frontend():
    """设置前端环境"""
    frontend_dir = Path("sau_frontend")
    if not frontend_dir.exists():
        print("⚠️  前端目录不存在，跳过前端设置")
        return

    print("🎨 设置前端环境...")

    # 检查Node.js
    try:
        node_version = subprocess.run(["node", "--version"], capture_output=True, text=True)
        print(f"✅ Node.js版本: {node_version.stdout.strip()}")
    except FileNotFoundError:
        print("❌ Node.js未安装，请先安装Node.js")
        return

    # 安装前端依赖
    os.chdir(frontend_dir)
    run_command("npm ci", "安装前端依赖")
    os.chdir("..")

def setup_database():
    """设置数据库"""
    print("🗄️ 设置数据库...")

    # 创建数据库目录
    Path("db").mkdir(exist_ok=True)

    # 运行数据库迁移
    if Path("create_monitoring_tables.py").exists():
        run_command("venv/bin/python create_monitoring_tables.py", "创建监控表")

    print("✅ 数据库设置完成")

def setup_project_agents():
    """设置项目代理"""
    print("🤖 设置项目代理...")

    # 创建代理目录
    agents_dir = Path(".claude/agents")
    agents_dir.mkdir(parents=True, exist_ok=True)

    # 从用户级代理复制核心代理
    user_agents_dir = Path.home() / ".config" / "claude" / "agents"
    if user_agents_dir.exists():
        core_agents = [
            "debugger.md",
            "performance-engineer.md",
            "security-auditor.md",
            "tdd-orchestrator.md"
        ]

        for agent in core_agents:
            source = user_agents_dir / agent
            if source.exists():
                shutil.copy2(source, agents_dir / agent)
                print(f"✅ 复制代理: {agent}")

    print("✅ 项目代理设置完成")

def create_environment_file():
    """创建环境文件"""
    print("🔧 创建环境配置文件...")

    env_example = Path(".env.example")
    env_file = Path(".env")

    if env_example.exists() and not env_file.exists():
        shutil.copy2(env_example, env_file)
        print("✅ 从.env.example创建.env文件")
    elif not env_file.exists():
        # 创建默认.env文件
        with open(env_file, 'w') as f:
            f.write("""# 开发环境配置
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_URL=sqlite:///social_upload.db
REDIS_URL=redis://localhost:6379/0
LOG_LEVEL=DEBUG
""")
        print("✅ 创建默认.env文件")

def setup_git_hooks():
    """设置Git钩子"""
    print("🪝 设置Git钩子...")

    # 创建pre-commit配置
    pre_commit_config = Path(".pre-commit-config.yaml")
    if not pre_commit_config.exists():
        config_content = """repos:
  - repo: https://github.com/psf/black
    rev: 22.3.0
    hooks:
      - id: black
        language_version: python3.8

  - repo: https://github.com/pycqa/isort
    rev: 5.10.1
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 4.0.1
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v0.950
    hooks:
      - id: mypy
        additional_dependencies: [types-requests]
"""
        with open(pre_commit_config, 'w') as f:
            f.write(config_content)
        print("✅ 创建pre-commit配置")

    # 安装pre-commit钩子
    run_command("venv/bin/pip install pre-commit", "安装pre-commit")
    run_command("venv/bin/pre-commit install", "安装Git钩子")

def create_directories():
    """创建必要的目录"""
    print("📁 创建项目目录...")

    directories = [
        "logs",
        "uploads",
        "temp",
        "db",
        "reports",
        "screenshots"
    ]

    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ 创建目录: {directory}")

def verify_setup():
    """验证设置"""
    print("🔍 验证开发环境设置...")

    checks = [
        ("虚拟环境", Path("venv").exists()),
        ("requirements.txt", Path("requirements.txt").exists()),
        ("requirements-dev.txt", Path("requirements-dev.txt").exists()),
        (".env文件", Path(".env").exists()),
        ("日志目录", Path("logs").exists()),
        ("上传目录", Path("uploads").exists()),
        ("临时目录", Path("temp").exists()),
        ("项目代理", Path(".claude/agents").exists()),
    ]

    all_good = True
    for name, check in checks:
        status = "✅" if check else "❌"
        print(f"{status} {name}")
        if not check:
            all_good = False

    if all_good:
        print("\n🎉 开发环境设置完成！")
        print("\n📋 下一步操作：")
        print("1. 激活虚拟环境: source venv/bin/activate")
        print("2. 安装项目代理: ~/.config/claude/setup-project-agents.sh fullstack .")
        print("3. 启动开发服务器: python native_douyin_backend.py")
        print("4. 运行测试: pytest")
    else:
        print("\n⚠️  某些检查失败，请手动修复问题")
        sys.exit(1)

def main():
    """主函数"""
    print("🚀 开始设置开发环境...")
    print("=" * 50)

    try:
        create_virtual_environment()
        install_dependencies()
        setup_frontend()
        setup_database()
        setup_project_agents()
        create_environment_file()
        setup_git_hooks()
        create_directories()
        verify_setup()

    except KeyboardInterrupt:
        print("\n⚠️  设置被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 设置过程中出现错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()