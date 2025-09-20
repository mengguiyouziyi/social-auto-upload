#!/usr/bin/env python3
"""
简单测试抖音登录接口
"""
import requests
import time

def test_login_interface():
    """简单测试登录接口是否可达"""
    print("🧪 测试抖音登录接口...")

    # 测试参数
    test_params = {
        'type': 3,  # 抖音
        'id': 'test_user_001'
    }

    try:
        # 发送请求到登录接口
        response = requests.get(
            'http://localhost:5409/login',
            params=test_params,
            timeout=5  # 设置5秒超时
        )

        print(f"📡 响应状态码: {response.status_code}")

        if response.status_code == 200:
            print("✅ 登录接口连接成功")
            print(f"📋 响应头 Content-Type: {response.headers.get('Content-Type', 'N/A')}")

            # 读取前几行数据
            content = response.text
            lines = content.split('\n')[:10]  # 只看前10行

            print("📨 收到消息预览:")
            for i, line in enumerate(lines[:5]):  # 只显示前5行
                if line.strip():
                    print(f"  {i+1}: {line}")

            return True
        else:
            print(f"❌ 登录接口失败: {response.status_code}")
            print(f"❌ 响应内容: {response.text[:200]}...")
            return False

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False

if __name__ == "__main__":
    success = test_login_interface()
    if success:
        print("\n🎉 抖音登录接口测试完成！")
    else:
        print("\n❌ 抖音登录接口测试失败！")