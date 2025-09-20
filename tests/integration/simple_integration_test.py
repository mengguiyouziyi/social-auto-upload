"""
简化版集成测试
只测试最核心的认证和API功能
"""

import requests
import uuid
import json

def test_authentication_flow():
    """测试完整的认证流程"""
    BASE_URL = "http://localhost:5409"

    # 创建session
    session = requests.Session()
    session.headers.update({'Content-Type': 'application/json'})

    # 生成唯一用户数据
    unique_id = str(uuid.uuid4())[:8]
    user_data = {
        'username': f'test_user_{unique_id}',
        'password': 'TestPassword123!',
        'email': f'test_{unique_id}@example.com'
    }

    print(f"🔍 测试用户: {user_data['username']}")

    # 1. 测试用户注册
    print("📝 步骤1: 用户注册...")
    response = session.post(f"{BASE_URL}/api/auth/register", json=user_data)

    if response.status_code != 201:
        print(f"❌ 注册失败: {response.status_code} - {response.text}")
        return False

    register_result = response.json()
    print(f"✅ 注册成功: {register_result['message']}")

    # 2. 测试用户登录
    print("🔐 步骤2: 用户登录...")
    login_data = {
        'username': user_data['username'],
        'password': user_data['password']
    }

    response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)

    if response.status_code != 200:
        print(f"❌ 登录失败: {response.status_code} - {response.text}")
        return False

    login_result = response.json()
    token = login_result['token']
    user_id = login_result['user']['id']

    print(f"✅ 登录成功: 用户ID {user_id}")

    # 3. 设置认证header
    session.headers.update({'Authorization': f'Bearer {token}'})

    # 4. 测试访问受保护的资源
    print("🔒 步骤3: 访问受保护资源...")

    protected_endpoints = [
        ('GET', '/api/auth/profile', '用户信息'),
        ('GET', '/api/social/platforms', '社交媒体平台'),
        ('GET', '/api/file/quota', '文件配额'),
        ('GET', '/api/content/templates', '内容模板'),
        ('GET', '/api/content/analytics', '内容分析')
    ]

    success_count = 0
    total_count = len(protected_endpoints)

    for method, endpoint, description in protected_endpoints:
        print(f"   📍 测试 {description}...")
        response = session.request(method, f"{BASE_URL}{endpoint}")

        if response.status_code == 200:
            success_count += 1
            print(f"   ✅ {description} 访问成功")
        else:
            print(f"   ❌ {description} 访问失败: {response.status_code}")

    # 5. 测试添加社交媒体账号
    print("📱 步骤4: 添加社交媒体账号...")
    account_data = {
        'platform': 'douyin',
        'account_name': f'测试抖音账号_{unique_id}',
        'auth_data': {}
    }

    response = session.post(f"{BASE_URL}/api/social/accounts", json=account_data)

    if response.status_code == 201:
        success_count += 1
        total_count += 1
        account_result = response.json()
        account_id = account_result.get('account', {}).get('id')
        print(f"✅ 账号添加成功: {account_result['message']}")

        if account_id:
            # 6. 测试获取账号列表
            print("📋 步骤5: 获取账号列表...")
            response = session.get(f"{BASE_URL}/api/social/accounts")

            if response.status_code == 200:
                success_count += 1
                total_count += 1
                accounts = response.json()
                print(f"✅ 账号列表获取成功: 共 {len(accounts.get('accounts', []))} 个账号")
            else:
                print(f"❌ 账号列表获取失败: {response.status_code}")
    else:
        print(f"❌ 账号添加失败: {response.status_code} - {response.text}")

    # 清理
    session.close()

    # 计算成功率
    success_rate = (success_count / total_count) * 100

    print(f"\n📊 测试结果统计:")
    print(f"   总测试项: {total_count}")
    print(f"   成功项: {success_count}")
    print(f"   失败项: {total_count - success_count}")
    print(f"   成功率: {success_rate:.1f}%")

    if success_rate >= 80:
        print(f"🎉 集成测试通过！成功率 {success_rate:.1f}%")
        return True
    else:
        print(f"⚠️ 集成测试未通过，成功率过低: {success_rate:.1f}%")
        return False

if __name__ == "__main__":
    print("🚀 开始简化版集成测试...")

    # 检查服务状态
    try:
        response = requests.get("http://localhost:5409/health", timeout=5)
        if response.status_code == 200:
            print("✅ 后端服务正常运行")
        else:
            print("❌ 后端服务状态异常")
            exit(1)
    except Exception as e:
        print(f"❌ 无法连接到后端服务: {e}")
        exit(1)

    # 运行测试
    success = test_authentication_flow()

    if success:
        print("\n🎊 所有核心功能测试通过！")
        exit(0)
    else:
        print("\n❌ 部分测试失败，请检查系统")
        exit(1)