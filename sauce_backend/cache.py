"""
缓存模块 - 提供多层缓存功能
"""

import json
import time
import threading
from typing import Any, Optional, Dict, Callable
from functools import wraps
from collections import defaultdict
import hashlib

class MemoryCache:
    """内存缓存"""

    def __init__(self, max_size: int = 1000, default_ttl: int = 3600):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache = {}
        self.access_times = {}
        self.lock = threading.RLock()

    def _get_key(self, key: str) -> str:
        """生成缓存键"""
        return hashlib.md5(key.encode('utf-8')).hexdigest()

    def _evict_if_needed(self):
        """如果需要，清理最久未使用的缓存"""
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.access_times.keys(), key=lambda k: self.access_times[k])
            del self.cache[oldest_key]
            del self.access_times[oldest_key]

    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        cache_key = self._get_key(key)
        with self.lock:
            if cache_key in self.cache:
                data, expiry = self.cache[cache_key]
                if time.time() < expiry:
                    self.access_times[cache_key] = time.time()
                    return data
                else:
                    # 过期清理
                    del self.cache[cache_key]
                    del self.access_times[cache_key]
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """设置缓存值"""
        cache_key = self._get_key(key)
        expiry = time.time() + (ttl or self.default_ttl)
        with self.lock:
            self._evict_if_needed()
            self.cache[cache_key] = (value, expiry)
            self.access_times[cache_key] = time.time()
            return True

    def delete(self, key: str) -> bool:
        """删除缓存值"""
        cache_key = self._get_key(key)
        with self.lock:
            if cache_key in self.cache:
                del self.cache[cache_key]
                del self.access_times[cache_key]
                return True
            return False

    def clear(self):
        """清空缓存"""
        with self.lock:
            self.cache.clear()
            self.access_times.clear()

    def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        with self.lock:
            return {
                'size': len(self.cache),
                'max_size': self.max_size,
                'hit_rate': getattr(self, '_hit_rate', 0.0)
            }

class CacheManager:
    """缓存管理器"""

    def __init__(self):
        self.memory_cache = MemoryCache()
        self.cache_stats = defaultdict(int)

    def cache_result(self, ttl: int = 3600, key_prefix: str = ''):
        """缓存装饰器"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                # 生成缓存键
                cache_key = f"{key_prefix}{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"

                # 尝试从缓存获取
                result = self.memory_cache.get(cache_key)
                if result is not None:
                    self.cache_stats['hits'] += 1
                    return result

                # 执行函数并缓存结果
                self.cache_stats['misses'] += 1
                result = func(*args, **kwargs)
                self.memory_cache.set(cache_key, result, ttl)
                return result
            return wrapper
        return decorator

    def get_ai_response_cache(self, model: str, prompt: str) -> Optional[str]:
        """获取AI响应缓存"""
        cache_key = f"ai_response:{model}:{hashlib.md5(prompt.encode('utf-8')).hexdigest()}"
        return self.memory_cache.get(cache_key)

    def set_ai_response_cache(self, model: str, prompt: str, response: str, ttl: int = 1800):
        """设置AI响应缓存"""
        cache_key = f"ai_response:{model}:{hashlib.md5(prompt.encode('utf-8')).hexdigest()}"
        self.memory_cache.set(cache_key, response, ttl)

    def get_media_info_cache(self, file_path: str) -> Optional[Dict]:
        """获取媒体信息缓存"""
        cache_key = f"media_info:{hashlib.md5(file_path.encode('utf-8')).hexdigest()}"
        return self.memory_cache.get(cache_key)

    def set_media_info_cache(self, file_path: str, info: Dict, ttl: int = 3600):
        """设置媒体信息缓存"""
        cache_key = f"media_info:{hashlib.md5(file_path.encode('utf-8')).hexdigest()}"
        self.memory_cache.set(cache_key, info, ttl)

    def get_user_session_cache(self, user_id: str) -> Optional[Dict]:
        """获取用户会话缓存"""
        cache_key = f"user_session:{user_id}"
        return self.memory_cache.get(cache_key)

    def set_user_session_cache(self, user_id: str, session_data: Dict, ttl: int = 3600):
        """设置用户会话缓存"""
        cache_key = f"user_session:{user_id}"
        self.memory_cache.set(cache_key, session_data, ttl)

    def invalidate_user_cache(self, user_id: str):
        """清除用户相关缓存"""
        patterns = [
            f"user_session:{user_id}",
            f"user_data:{user_id}",
            f"user_permissions:{user_id}"
        ]
        for pattern in patterns:
            # 简单的键匹配清理
            keys_to_delete = [key for key in self.memory_cache.cache.keys() if pattern in key]
            for key in keys_to_delete:
                self.memory_cache.delete(key)

    def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        total_requests = self.cache_stats['hits'] + self.cache_stats['misses']
        hit_rate = self.cache_stats['hits'] / total_requests if total_requests > 0 else 0.0

        return {
            'memory_cache': self.memory_cache.get_stats(),
            'hit_rate': hit_rate,
            'total_requests': total_requests,
            'hits': self.cache_stats['hits'],
            'misses': self.cache_stats['misses']
        }

    def clear_all(self):
        """清空所有缓存"""
        self.memory_cache.clear()
        self.cache_stats.clear()

# 全局缓存管理器实例
cache_manager = CacheManager()

# 便捷函数
def cache_ai_response(ttl: int = 1800):
    """AI响应缓存装饰器"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            model = kwargs.get('model', 'default')
            prompt = kwargs.get('prompt', '')

            # 尝试从缓存获取
            cached_result = cache_manager.get_ai_response_cache(model, prompt)
            if cached_result is not None:
                return cached_result

            # 执行函数并缓存结果
            result = func(*args, **kwargs)
            cache_manager.set_ai_response_cache(model, prompt, result, ttl)
            return result
        return wrapper
    return decorator

def cache_media_info(ttl: int = 3600):
    """媒体信息缓存装饰器"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            file_path = args[0] if args else kwargs.get('file_path', '')

            # 尝试从缓存获取
            cached_result = cache_manager.get_media_info_cache(file_path)
            if cached_result is not None:
                return cached_result

            # 执行函数并缓存结果
            result = func(*args, **kwargs)
            cache_manager.set_media_info_cache(file_path, result, ttl)
            return result
        return wrapper
    return decorator