# AI增强版社交媒体自动发布系统 - 部署指南

## 🚀 新功能概览

本次更新为原有的社交媒体自动发布系统增加了强大的AI功能，专为县乡小店主设计，提供"一键出片、快速分发、快速看数"的完整解决方案。

### 核心新增功能

1. **🤖 AI文案工坊** - 智能生成营销文案
2. **🎙️ TTS语音合成** - 文字转语音，多种音色选择
3. **🎬 媒体合成** - 图片转视频、视频拼接、水印字幕
4. **🎯 镜头脚本生成** - AI生成专业拍摄脚本
5. **📊 多模型支持** - 智谱GLM、阿里通义千问等

## 📦 安装与配置

### 1. 环境要求

- Python 3.10+
- FFmpeg (系统要求)
- 现有项目依赖已安装

### 2. 安装新依赖

```bash
pip install edge-tts
```

### 3. 配置API密钥

复制环境配置文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，添加你的AI模型API密钥：

```bash
# 智谱GLM配置 (前往 https://open.bigmodel.cn/ 获取)
ZHIPU_API_KEY=your_zhipu_api_key_here

# 阿里通义千问配置 (前往 https://dashscope.aliyun.com/ 获取)
DASHSCOPE_API_KEY=your_dashscope_api_key_here
```

### 4. 启动服务

```bash
# 启动后端
python sau_backend.py

# 启动前端 (在另一个终端)
cd sau_frontend
npm run dev
```

## 🎯 使用指南

### 1. AI文案生成

#### 获取可用模型
```bash
curl http://localhost:5409/ai/providers
```

#### 生成营销文案
```bash
curl -X POST http://localhost:5409/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "为乡镇小餐馆写一条午餐优惠活动文案",
    "industry": "餐饮",
    "scene": "团购",
    "platform": "douyin",
    "provider": "qwen"
  }'
```

#### 生成镜头脚本
```bash
curl -X POST http://localhost:5409/ai/generate_shotlist \
  -H "Content-Type: application/json" \
  -d '{
    "script": "今天本店推出特色菜麻辣香锅，原价68元，现价只需39.9元",
    "duration": 30,
    "style": "快节奏"
  }'
```

### 2. 语音合成 (TTS)

#### 获取可用语音
```bash
curl http://localhost:5409/tts/voices
```

#### 文字转语音
```bash
curl -X POST http://localhost:5409/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "欢迎光临本店，今天有特价优惠活动",
    "voice": "zh-CN-XiaoxiaoNeural",
    "rate": "+0%",
    "volume": "+0%"
  }'
```

#### 批量语音合成
```bash
curl -X POST http://localhost:5409/tts/batch_synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["欢迎光临", "今天特价", "快来选购"],
    "voice": "zh-CN-XiaoxiaoNeural"
  }'
```

### 3. 媒体合成

#### 图片转视频 (带Ken Burns效果)
```bash
curl -X POST http://localhost:5409/media/img2video \
  -H "Content-Type: application/json" \
  -d '{
    "images": ["/path/to/image1.jpg", "/path/to/image2.jpg"],
    "duration_per_img": 3,
    "size": "1080x1920",
    "kenburns": true
  }'
```

#### 视频拼接
```bash
curl -X POST http://localhost:5409/media/concat \
  -H "Content-Type: application/json" \
  -d '{
    "videos": ["/path/to/video1.mp4", "/path/to/video2.mp4"],
    "output_size": "1080x1920"
  }'
```

#### 添加水印
```bash
curl -X POST http://localhost:5409/media/watermark \
  -H "Content-Type: application/json" \
  -d '{
    "video": "/path/to/video.mp4",
    "text": "本店原创",
    "position": "bottom-right",
    "font_size": 36
  }'
```

#### 添加字幕
```bash
curl -X POST http://localhost:5409/media/subtitle \
  -H "Content-Type: application/json" \
  -d '{
    "video": "/path/to/video.mp4",
    "text": "特价优惠 限时抢购",
    "position": "bottom",
    "font_size": 28
  }'
```

#### 视频截取
```bash
curl -X POST http://localhost:5409/media/trim \
  -H "Content-Type: application/json" \
  -d '{
    "video": "/path/to/video.mp4",
    "start_time": "00:00:10",
    "duration": 30
  }'
```

## 🏪 县乡小店主使用场景

### 场景1：餐饮店促销视频制作

1. **AI生成文案**：选择"餐饮"行业，"团购"场景，"抖音"平台
2. **生成镜头脚本**：AI自动拆分镜头，确定时长和转场
3. **TTS语音合成**：选择亲切的女声，调整语速
4. **图片转视频**：上传菜品图片，自动添加Ken Burns效果
5. **添加字幕水印**：加上促销文字和店名水印
6. **一键发布**：选择抖音账号，定时发布

### 场景2：农特产推广

1. **AI生成文案**：选择"农特产"行业，强调产地新鲜
2. **批量TTS**：将长文案分段生成多个语音文件
3. **视频拼接**：将产品拍摄视频拼接成完整推广片
4. **添加字幕**：突出产品特点和生产工艺
5. **多平台发布**：同时发布到抖音、快手、小红书

### 场景3：母婴店新品上市

1. **AI生成文案**：选择"母婴"行业，"上新"场景
2. **生成镜头脚本**：AI设计产品展示和使用场景
3. **TTS语音合成**：选择温柔的女声，营造温馨感
4. **媒体合成**：合成产品图片和使用场景视频
5. **添加水印**：加上品牌标识和购买链接

## 🔧 故障排除

### 1. AI模型API配置问题

**症状**：`/ai/providers` 返回空列表
**解决**：
- 检查 `.env` 文件中的API密钥是否正确
- 确认API密钥有效且有余额
- 查看后端日志了解具体错误

### 2. FFmpeg未安装

**症状**：媒体合成API返回错误
**解决**：
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
下载FFmpeg静态包并添加到PATH
```

### 3. TTS合成失败

**症状**：TTS API返回错误
**解决**：
- 检查网络连接（edge-tts需要联网）
- 确认文本内容不包含特殊字符
- 尝试更换不同的语音

## 📚 API文档

### AI相关接口

- `GET /ai/providers` - 获取可用AI模型提供商
- `POST /ai/generate` - AI文案生成
- `POST /ai/generate_shotlist` - 生成镜头脚本

### TTS相关接口

- `GET /tts/voices` - 获取可用语音列表
- `POST /tts/synthesize` - 单条文字转语音
- `POST /tts/batch_synthesize` - 批量文字转语音

### 媒体处理接口

- `POST /media/img2video` - 图片转视频
- `POST /media/concat` - 视频拼接
- `POST /media/watermark` - 添加水印
- `POST /media/subtitle` - 添加字幕
- `POST /media/trim` - 视频截取
- `POST /media/resize` - 调整视频尺寸
- `GET /media/info` - 获取视频信息

## 🎯 下一步开发计划

### Phase 1 (已完成)
- ✅ 多模型AI支持
- ✅ TTS语音合成
- ✅ 基础媒体处理

### Phase 2 (开发中)
- 🔄 前端页面组件 (AI工坊、TTS工作室、媒体工坊)
- 🔄 数据分析看板
- 🔄 任务队列系统

### Phase 3 (计划中)
- 📋 模板市场
- 📋 A/B测试功能
- 📋 更多AI Agent

## 💡 使用技巧

1. **文案优化**：结合行业和场景参数，生成更精准的营销文案
2. **语音选择**：根据产品类型选择合适的语音（温馨/活泼/专业）
3. **视频尺寸**：根据平台选择合适的尺寸（抖音9:16，小红书1:1）
4. **批量处理**：使用批量接口提高效率
5. **定时发布**：结合发布中心的定时功能，选择最佳发布时间

---

**注意**：本系统设计遵循合规原则，所有功能仅限本人授权账户使用，请遵守各平台服务条款。