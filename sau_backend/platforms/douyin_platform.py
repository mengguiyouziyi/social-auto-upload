"""
抖音平台集成模块
提供抖音账号登录、内容发布等功能
"""

import asyncio
import json
import os
import time
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path

from playwright.async_api import async_playwright, Browser, Page, BrowserContext
import sys

# 添加sau_backend到路径
sys.path.append("/Users/sunyouyou/Desktop/projects/bzhi/social-auto-upload/sau_backend")

from models import db_manager
from utils.base_social_media import set_init_script


class DouyinPlatform:
    """抖音平台集成类"""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None

    async def initialize(self):
        """初始化浏览器"""
        self.playwright = await async_playwright().start()

        # 启动浏览器
        self.browser = await self.playwright.chromium.launch(
            headless=True,  # 生产环境使用无头模式
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        )

        # 创建浏览器上下文
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        )

        # 创建新页面
        self.page = await self.context.new_page()

        # 注入反检测脚本
        await set_init_script(self.page)

    async def close(self):
        """关闭浏览器"""
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def login_with_qr(self, account_id: int, cookie_path: str) -> Dict[str, Any]:
        """使用二维码登录抖音"""
        try:
            await self.initialize()

            # 访问抖音创作者平台
            await self.page.goto('https://creator.douyin.com/')
            await self.page.wait_for_timeout(3000)

            # 检查是否已经登录
            if await self._check_logged_in():
                return {
                    "success": True,
                    "message": "已经登录",
                    "account_id": account_id
                }

            # 查找登录按钮
            login_button = None
            try:
                login_button = await self.page.wait_for_selector(
                    'text="登录"', timeout=5000
                )
            except:
                # 尝试其他登录按钮选择器
                selectors = [
                    '.login-btn',
                    '.header-login',
                    '[data-testid="login-btn"]',
                    'button:has-text("登录")'
                ]
                for selector in selectors:
                    try:
                        login_button = await self.page.wait_for_selector(selector, timeout=2000)
                        break
                    except:
                        continue

            if login_button:
                await login_button.click()
                await self.page.wait_for_timeout(2000)

            # 查找二维码登录选项
            qr_login_tab = None
            try:
                qr_login_tab = await self.page.wait_for_selector(
                    'text="二维码登录"', timeout=5000
                )
            except:
                # 尝试其他二维码登录选择器
                selectors = [
                    '.qr-login-tab',
                    '[data-testid="qr-login"]',
                    'div:has-text("二维码")'
                ]
                for selector in selectors:
                    try:
                        qr_login_tab = await self.page.wait_for_selector(selector, timeout=2000)
                        break
                    except:
                        continue

            if qr_login_tab:
                await qr_login_tab.click()
                await self.page.wait_for_timeout(2000)

            # 等待二维码加载
            qr_code = None
            try:
                qr_code = await self.page.wait_for_selector(
                    '.qr-code img, .qrcode img, [data-testid="qrcode"] img',
                    timeout=10000
                )
            except:
                # 尝试其他二维码选择器
                selectors = [
                    'img[src*="qrcode"]',
                    '.login-qr-code img',
                    '#qrcode img'
                ]
                for selector in selectors:
                    try:
                        qr_code = await self.page.wait_for_selector(selector, timeout=2000)
                        break
                    except:
                        continue

            if not qr_code:
                return {
                    "success": False,
                    "message": "无法找到二维码元素",
                    "account_id": account_id
                }

            # 获取二维码截图
            qr_code_bytes = await qr_code.screenshot()

            # 保存二维码截图
            qr_filename = f"qr_codes/douyin_qr_{account_id}_{int(time.time())}.png"
            os.makedirs("qr_codes", exist_ok=True)
            with open(qr_filename, "wb") as f:
                f.write(qr_code_bytes)

            # 转换为base64
            import base64
            qr_base64 = base64.b64encode(qr_code_bytes).decode('utf-8')

            # 更新账号状态为等待扫码
            db_manager.update_social_account_status(account_id, 0)

            return {
                "success": True,
                "message": "二维码已生成，请使用抖音App扫码登录",
                "qr_code": qr_base64,
                "qr_filename": qr_filename,
                "account_id": account_id,
                "next_action": "wait_for_scan"
            }

        except Exception as e:
            await self.close()
            return {
                "success": False,
                "message": f"登录过程出错: {str(e)}",
                "account_id": account_id
            }

    async def wait_for_login(self, account_id: int, cookie_path: str, max_wait: int = 300) -> Dict[str, Any]:
        """等待登录完成"""
        try:
            start_time = time.time()

            while time.time() - start_time < max_wait:
                try:
                    # 检查是否登录成功
                    if await self._check_logged_in():
                        # 保存cookies
                        cookies = await self.context.cookies()

                        # 保存cookies到文件
                        await self._save_cookies(cookies, cookie_path)

                        # 更新账号状态为已连接
                        db_manager.update_social_account_status(account_id, 1)

                        # 获取用户信息
                        user_info = await self._get_user_info()

                        await self.close()

                        return {
                            "success": True,
                            "message": "登录成功",
                            "account_id": account_id,
                            "user_info": user_info
                        }

                    # 检查是否二维码过期
                    if await self._check_qr_expired():
                        await self.close()
                        return {
                            "success": False,
                            "message": "二维码已过期，请重新获取",
                            "account_id": account_id,
                            "next_action": "refresh_qr"
                        }

                    await self.page.wait_for_timeout(2000)

                except Exception as e:
                    print(f"等待登录时出错: {e}")
                    await self.page.wait_for_timeout(2000)

            # 超时
            await self.close()
            return {
                "success": False,
                "message": "登录超时，请重新尝试",
                "account_id": account_id,
                "next_action": "refresh_qr"
            }

        except Exception as e:
            await self.close()
            return {
                "success": False,
                "message": f"等待登录时出错: {str(e)}",
                "account_id": account_id
            }

    async def _check_logged_in(self) -> bool:
        """检查是否已经登录"""
        try:
            # 检查是否包含用户名或头像等登录后的元素
            selectors = [
                '.user-avatar',
                '.user-name',
                '[data-testid="user-avatar"]',
                '.header-user-info'
            ]

            for selector in selectors:
                try:
                    element = await self.page.wait_for_selector(selector, timeout=2000)
                    if element:
                        return True
                except:
                    continue

            # 检查URL是否跳转到登录后的页面
            if 'dashboard' in self.page.url or 'creator' in self.page.url:
                return True

            return False

        except Exception as e:
            return False

    async def _check_qr_expired(self) -> bool:
        """检查二维码是否过期"""
        try:
            # 查找刷新二维码的按钮
            refresh_selectors = [
                'text="刷新"',
                'text="重新获取"',
                '.refresh-btn',
                '.qr-refresh'
            ]

            for selector in refresh_selectors:
                try:
                    element = await self.page.wait_for_selector(selector, timeout=1000)
                    if element and await element.is_visible():
                        return True
                except:
                    continue

            return False

        except Exception as e:
            return False

    async def _get_user_info(self) -> Dict[str, Any]:
        """获取用户信息"""
        try:
            # 尝试获取用户名
            user_name = None
            try:
                user_name_element = await self.page.wait_for_selector('.user-name, .nickname', timeout=5000)
                user_name = await user_name_element.text_content()
            except:
                pass

            return {
                "username": user_name or "未知用户",
                "platform": "douyin",
                "login_time": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {
                "username": "未知用户",
                "platform": "douyin",
                "login_time": datetime.utcnow().isoformat()
            }

    async def _save_cookies(self, cookies: List[Dict], cookie_path: str):
        """保存cookies到文件"""
        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(cookie_path), exist_ok=True)

            # 保存cookies
            with open(cookie_path, 'w', encoding='utf-8') as f:
                json.dump(cookies, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"保存cookies失败: {e}")

    async def load_cookies(self, cookie_path: str) -> bool:
        """加载cookies"""
        try:
            if not os.path.exists(cookie_path):
                return False

            with open(cookie_path, 'r', encoding='utf-8') as f:
                cookies = json.load(f)

            await self.context.add_cookies(cookies)
            return True

        except Exception as e:
            print(f"加载cookies失败: {e}")
            return False

    async def check_login_status(self, account_id: int, cookie_path: str) -> Dict[str, Any]:
        """检查登录状态"""
        try:
            await self.initialize()

            # 加载cookies
            if not await self.load_cookies(cookie_path):
                await self.close()
                return {
                    "success": False,
                    "message": "未找到登录信息",
                    "account_id": account_id,
                    "status": "not_logged_in"
                }

            # 访问抖音创作者平台
            await self.page.goto('https://creator.douyin.com/')
            await self.page.wait_for_timeout(3000)

            # 检查是否登录
            if await self._check_logged_in():
                await self.close()
                return {
                    "success": True,
                    "message": "登录状态正常",
                    "account_id": account_id,
                    "status": "logged_in"
                }
            else:
                await self.close()
                return {
                    "success": False,
                    "message": "登录已过期",
                    "account_id": account_id,
                    "status": "expired"
                }

        except Exception as e:
            await self.close()
            return {
                "success": False,
                "message": f"检查登录状态失败: {str(e)}",
                "account_id": account_id,
                "status": "error"
            }

    async def upload_video(self, account_id: int, video_path: str, title: str, description: str = "", tags: List[str] = None) -> Dict[str, Any]:
        """上传视频到抖音"""
        try:
            await self.initialize()

            # 加载cookies
            cookie_path = f"cookies/douyin_{account_id}.txt"
            if not await self.load_cookies(cookie_path):
                await self.close()
                return {
                    "success": False,
                    "message": "请先登录账号",
                    "account_id": account_id
                }

            # 访问创作者平台
            await self.page.goto('https://creator.douyin.com/creator-micro/content/upload')
            await self.page.wait_for_timeout(3000)

            # 检查是否登录
            if not await self._check_logged_in():
                await self.close()
                return {
                    "success": False,
                    "message": "登录已过期，请重新登录",
                    "account_id": account_id
                }

            # 查找上传按钮
            upload_button = None
            try:
                upload_button = await self.page.wait_for_selector(
                    'input[type="file"]', timeout=10000
                )
            except:
                # 尝试其他上传选择器
                selectors = [
                    '.upload-btn input[type="file"]',
                    '.video-upload input[type="file"]',
                    '[data-testid="upload-input"]'
                ]
                for selector in selectors:
                    try:
                        upload_button = await self.page.wait_for_selector(selector, timeout=2000)
                        break
                    except:
                        continue

            if not upload_button:
                await self.close()
                return {
                    "success": False,
                    "message": "无法找到上传按钮",
                    "account_id": account_id
                }

            # 上传视频文件
            await upload_button.set_input_files(video_path)

            # 等待上传完成
            await self.page.wait_for_timeout(5000)

            # 填写视频信息
            # 标题
            try:
                title_input = await self.page.wait_for_selector(
                    'input[placeholder*="标题"], .title-input, [data-testid="title-input"]',
                    timeout=5000
                )
                await title_input.fill(title)
            except Exception as e:
                print(f"填写标题失败: {e}")

            # 描述
            if description:
                try:
                    desc_input = await self.page.wait_for_selector(
                        'textarea[placeholder*="描述"], .description-input, [data-testid="description-input"]',
                        timeout=5000
                    )
                    await desc_input.fill(description)
                except Exception as e:
                    print(f"填写描述失败: {e}")

            # 标签
            if tags:
                try:
                    tags_input = await self.page.wait_for_selector(
                        'input[placeholder*="标签"], .tags-input, [data-testid="tags-input"]',
                        timeout=5000
                    )
                    tags_text = " ".join([f"#{tag}" for tag in tags])
                    await tags_input.fill(tags_text)
                except Exception as e:
                    print(f"填写标签失败: {e}")

            # 发布视频
            try:
                publish_button = await self.page.wait_for_selector(
                    'button:has-text("发布"), .publish-btn, [data-testid="publish-btn"]',
                    timeout=5000
                )
                await publish_button.click()

                # 等待发布完成
                await self.page.wait_for_timeout(5000)

                await self.close()

                return {
                    "success": True,
                    "message": "视频发布成功",
                    "account_id": account_id,
                    "video_path": video_path,
                    "title": title
                }

            except Exception as e:
                await self.close()
                return {
                    "success": False,
                    "message": f"发布视频失败: {str(e)}",
                    "account_id": account_id
                }

        except Exception as e:
            await self.close()
            return {
                "success": False,
                "message": f"上传视频失败: {str(e)}",
                "account_id": account_id
            }


# 创建全局抖音平台实例
douyin_platform = DouyinPlatform()