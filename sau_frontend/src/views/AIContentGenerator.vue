<template>
  <div class="ai-content-generator">
    <!-- 头部 -->
    <div class="generator-header">
      <div class="header-left">
        <h2>AI智能内容生成器</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">工作台</el-breadcrumb-item>
          <el-breadcrumb-item>AI功能</el-breadcrumb-item>
          <el-breadcrumb-item>内容生成器</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showTemplates = true">
          <el-icon><Collection /></el-icon>使用模板
        </el-button>
        <el-button @click="exportContent">
          <el-icon><Download /></el-icon>导出内容
        </el-button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="generator-content">
      <el-row :gutter="20">
        <!-- 左侧输入区 -->
        <el-col :span="8">
          <el-card class="input-card">
            <template #header>
              <div class="card-header">
                <h3>内容配置</h3>
              </div>
            </template>

            <!-- 平台选择 -->
            <div class="form-section">
              <label class="section-label">目标平台</label>
              <el-select v-model="selectedPlatform" placeholder="选择发布平台" class="full-width">
                <el-option label="抖音" value="douyin">
                  <el-icon><VideoPlay /></el-icon>
                  <span>抖音 - 短视频平台</span>
                </el-option>
                <el-option label="小红书" value="xiaohongshu">
                  <el-icon><Picture /></el-icon>
                  <span>小红书 - 生活方式分享</span>
                </el-option>
                <el-option label="微信视频号" value="wechat">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>微信视频号 - 社交视频</span>
                </el-option>
                <el-option label="快手" value="kuaishou">
                  <el-icon><VideoCamera /></el-icon>
                  <span>快手 - 短视频社区</span>
                </el-option>
                <el-option label="B站" value="bilibili">
                  <el-icon><Monitor /></el-icon>
                  <span>B站 - 弹幕视频</span>
                </el-option>
                <el-option label="TikTok" value="tiktok">
                  <el-icon><Monitor /></el-icon>
                  <span>TikTok - 国际短视频</span>
                </el-option>
              </el-select>
            </div>

            <!-- AI模型选择 -->
            <div class="form-section">
              <label class="section-label">AI模型</label>
              <el-select
                v-model="selectedProvider"
                placeholder="选择AI提供商"
                class="full-width"
                :loading="isLoadingProviders"
                @change="handleProviderChange"
                :disabled="providerOptions.length === 0"
              >
                <el-option
                  v-for="option in providerOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <el-select
                v-model="selectedModel"
                placeholder="选择模型"
                class="full-width model-select"
                :disabled="availableModels.length === 0"
              >
                <el-option
                  v-for="model in availableModels"
                  :key="model"
                  :label="model"
                  :value="model"
                />
              </el-select>
              <p v-if="providerOptions.length === 0" class="provider-hint">未检测到可用的AI模型，已启用离线模板。</p>
              <p v-else-if="providerError" class="provider-error">{{ providerError }}</p>
            </div>

            <!-- 内容类型 -->
            <div class="form-section">
              <label class="section-label">内容类型</label>
              <el-radio-group v-model="contentType" class="full-width">
                <el-radio label="video">短视频脚本</el-radio>
                <el-radio label="image">图文内容</el-radio>
                <el-radio label="text">纯文案</el-radio>
                <el-radio label="livestream">直播脚本</el-radio>
              </el-radio-group>
            </div>

            <!-- 行业类型 -->
            <div class="form-section">
              <label class="section-label">行业类型</label>
              <el-select v-model="selectedIndustry" placeholder="选择行业" class="full-width">
                <el-option
                  v-for="item in industryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>

            <!-- 营销场景 -->
            <div class="form-section">
              <label class="section-label">营销场景</label>
              <el-select v-model="selectedScene" placeholder="选择场景" class="full-width">
                <el-option
                  v-for="item in sceneOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>

            <!-- 主题输入 -->
            <div class="form-section">
              <label class="section-label">内容主题</label>
              <el-input
                v-model="contentTheme"
                type="textarea"
                :rows="3"
                placeholder="请描述你想要创作的内容主题，例如：分享日常护肤心得、产品使用体验、行业见解等..."
              />
            </div>

            <!-- 关键词 -->
            <div class="form-section">
              <label class="section-label">关键词 (可选)</label>
              <el-tag
                v-for="tag in keywordTags"
                :key="tag"
                closable
                @close="removeKeyword(tag)"
                class="keyword-tag"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="keywordInputVisible"
                ref="keywordInputRef"
                v-model="keywordInput"
                class="keyword-input"
                size="small"
                @keyup.enter="addKeyword"
                @blur="addKeyword"
              />
              <el-button v-else class="keyword-add-btn" @click="showKeywordInput">
                + 添加关键词
              </el-button>
            </div>

            <!-- 风格设置 -->
            <div class="form-section">
              <label class="section-label">内容风格</label>
              <el-select v-model="contentStyle" placeholder="选择内容风格" class="full-width">
                <el-option label="轻松幽默" value="humorous" />
                <el-option label="专业严谨" value="professional" />
                <el-option label="温馨亲切" value="warm" />
                <el-option label="时尚潮流" value="trendy" />
                <el-option label="教育科普" value="educational" />
                <el-option label="故事叙述" value="storytelling" />
              </el-select>
            </div>

            <!-- 生成按钮 -->
            <div class="form-section">
              <el-button
                type="primary"
                size="large"
                class="generate-btn"
                :loading="isGenerating"
                @click="generateContent"
                :disabled="!canGenerate"
              >
                <el-icon><MagicStick /></el-icon>
                {{ isGenerating ? 'AI正在生成...' : '生成内容' }}
              </el-button>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧结果区 -->
        <el-col :span="16">
          <!-- 生成结果 -->
          <el-card class="result-card">
            <template #header>
              <div class="card-header">
                <h3>生成结果</h3>
                <div class="header-actions">
                  <el-button-group>
                    <el-button
                      size="small"
                      @click="regenerateContent"
                      :disabled="!generatedContent"
                    >
                      <el-icon><Refresh /></el-icon>重新生成
                    </el-button>
                    <el-button
                      size="small"
                      type="success"
                      @click="optimizeContent"
                      :disabled="!generatedContent"
                    >
                      <el-icon><MagicStick /></el-icon>优化内容
                    </el-button>
                    <el-button
                      size="small"
                      @click="saveToLibrary"
                      :disabled="!generatedContent"
                    >
                      <el-icon><FolderOpened /></el-icon>保存到素材库
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </template>

            <!-- 内容预览 -->
            <div v-if="generatedContent" class="content-preview">
              <!-- 标题 -->
              <div class="content-title">
                <h4>{{ generatedContent.title }}</h4>
                <div class="meta-info">
                  <el-tag size="small" :type="getPlatformType(selectedPlatform)">
                    {{ getPlatformName(selectedPlatform) }}
                  </el-tag>
                  <el-tag size="small" effect="plain" class="provider-tag">
                    {{ formatProviderLabel(generatedContent.provider) }}
                  </el-tag>
                  <span v-if="generatedContent.model" class="model-name">{{ generatedContent.model }}</span>
                  <span class="word-count">{{ generatedContent.wordCount }} 字</span>
                  <span class="read-time">预计阅读 {{ generatedContent.readTime }} 分钟</span>
                </div>
              </div>

              <!-- 正文内容 -->
              <div class="content-body">
                <div v-html="formatContent(generatedContent.content)"></div>
              </div>

              <!-- 标签和话题 -->
              <div class="content-tags">
                <div class="tags-section">
                  <label>推荐标签：</label>
                  <el-tag
                    v-for="tag in generatedContent.tags"
                    :key="tag"
                    size="small"
                    class="content-tag"
                  >
                    #{{ tag }}
                  </el-tag>
                </div>
                <div class="hashtags-section">
                  <label>推荐话题：</label>
                  <el-tag
                    v-for="hashtag in generatedContent.hashtags"
                    :key="hashtag"
                    size="small"
                    type="success"
                    class="hashtag-tag"
                  >
                    #{{ hashtag }}
                  </el-tag>
                </div>
              </div>

              <!-- SEO建议 -->
              <div class="seo-suggestions">
                <h5><el-icon><Star /></el-icon>SEO优化建议</h5>
                <ul class="suggestions-list">
                  <li v-for="(suggestion, index) in generatedContent.seoSuggestions" :key="index">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>

              <div
                class="shotlist-section"
                v-if="shotlist && shotlist.shots && shotlist.shots.length"
              >
                <h5><el-icon><VideoCamera /></el-icon>镜头脚本建议</h5>
                <el-table
                  :data="shotlist.shots"
                  size="small"
                  border
                  class="shotlist-table"
                >
                  <el-table-column prop="duration" label="时长(s)" width="90" />
                  <el-table-column prop="scene" label="画面描述" />
                  <el-table-column prop="voiceover" label="口播/旁白" />
                  <el-table-column prop="onscreen_text" label="屏幕文字" />
                </el-table>
              </div>
              <div v-else-if="generatingShotlist" class="shotlist-loading">
                正在生成镜头脚本...
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <el-icon class="empty-icon"><DocumentAdd /></el-icon>
              <p>请在左侧配置内容参数，然后点击"生成内容"按钮</p>
              <p class="empty-hint">AI将根据你的设置创作个性化的内容</p>
            </div>
          </el-card>

          <!-- 生成历史 -->
          <el-card class="history-card">
            <template #header>
              <div class="card-header">
                <h3>生成历史</h3>
                <el-button size="small" @click="clearHistory">清空历史</el-button>
              </div>
            </template>

            <div v-if="generationHistory.length > 0" class="history-list">
              <div
                v-for="(item, index) in generationHistory"
                :key="index"
                class="history-item"
                @click="loadFromHistory(item)"
              >
                <div class="history-content">
                  <div class="history-title">{{ item.title }}</div>
                  <div class="history-meta">
                    <el-tag size="small" :type="getPlatformType(item.platform)">
                      {{ getPlatformName(item.platform) }}
                    </el-tag>
                    <span class="history-time">{{ formatTime(item.timestamp) }}</span>
                  </div>
                </div>
                <el-icon class="history-arrow"><ArrowRight /></el-icon>
              </div>
            </div>

            <div v-else class="empty-history">
              <p>暂无生成历史</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 模板选择对话框 -->
    <el-dialog v-model="showTemplates" title="选择内容模板" width="800px">
      <div class="templates-grid">
        <div
          v-for="template in contentTemplates"
          :key="template.id"
          class="template-card"
          @click="useTemplate(template)"
        >
          <div class="template-icon">
            <el-icon><component :is="template.icon" /></el-icon>
          </div>
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
            <div class="template-tags">
              <el-tag size="small" v-for="tag in template.tags" :key="tag">
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { aiApi } from '@/api/ai'
import {
  VideoPlay, Picture, ChatDotRound, VideoCamera, Monitor,
  Collection, Download, MagicStick, Refresh, FolderOpened,
  DocumentAdd, ArrowRight, Star
} from '@element-plus/icons-vue'

const selectedPlatform = ref('douyin')
const selectedIndustry = ref('catering')
const selectedScene = ref('promotion')
const contentType = ref('video')
const contentStyle = ref('humorous')
const selectedProvider = ref('')
const selectedModel = ref('')
const providerOptions = ref([])
const providerModelMap = ref({})
const isLoadingProviders = ref(false)
const providerError = ref('')
const contentTheme = ref('')
const keywordTags = ref([])
const keywordInputVisible = ref(false)
const keywordInput = ref('')
const keywordInputRef = ref()
const isGenerating = ref(false)
const generatingShotlist = ref(false)
const generatedContent = ref(null)
const shotlist = ref(null)
const generationHistory = ref([])
const showTemplates = ref(false)

const contentTemplates = ref([
  {
    id: 1,
    name: '产品测评',
    description: '专业的产品使用体验分享',
    icon: 'Star',
    tags: ['测评', '产品', '体验']
  },
  {
    id: 2,
    name: '教程指南',
    description: '步骤清晰的实用教程',
    icon: 'Guide',
    tags: ['教程', '指南', '技巧']
  },
  {
    id: 3,
    name: '生活日常',
    description: '分享生活中的点滴感悟',
    icon: 'Sunny',
    tags: ['日常', '生活', '感悟']
  },
  {
    id: 4,
    name: '知识科普',
    description: '有趣的知识分享和科普',
    icon: 'Reading',
    tags: ['知识', '科普', '学习']
  },
  {
    id: 5,
    name: '情感故事',
    description: '打动人心的情感故事',
    icon: 'Heart',
    tags: ['情感', '故事', '温暖']
  },
  {
    id: 6,
    name: '行业见解',
    description: '专业的行业分析和见解',
    icon: 'TrendCharts',
    tags: ['行业', '分析', '见解']
  }
])

const industryOptions = [
  { value: 'catering', label: '餐饮门店' },
  { value: 'retail', label: '零售便利店' },
  { value: 'agriculture', label: '农特产/土特产' },
  { value: 'service', label: '生活服务' },
  { value: 'education', label: '教育培训' },
  { value: 'hospitality', label: '民宿/文旅' }
]

const sceneOptions = [
  { value: 'promotion', label: '促销引流' },
  { value: 'new_arrival', label: '新品发布' },
  { value: 'festival', label: '节日节气' },
  { value: 'daily', label: '日常经营' },
  { value: 'review', label: '客户口碑' },
  { value: 'live', label: '活动直播' }
]

const providerNameMap = {
  qwen: '通义千问',
  zhipu: '智谱GLM'
}

const availableModels = computed(() => {
  const models = providerModelMap.value[selectedProvider.value] || []
  return Array.isArray(models) ? models : []
})

const canGenerate = computed(() => {
  if (!contentTheme.value.trim()) return false
  if (isGenerating.value) return false
  if (providerOptions.value.length === 0) return true
  if (!selectedProvider.value) return false
  if (availableModels.value.length > 0 && !selectedModel.value) return false
  return true
})

watch(selectedProvider, () => {
  handleProviderChange()
})

watch(availableModels, (models) => {
  if (models.length && !models.includes(selectedModel.value)) {
    selectedModel.value = models[0]
  }
  if (!models.length) {
    selectedModel.value = ''
  }
})

watch(generationHistory, () => {
  persistHistory()
}, { deep: true })

const showKeywordInput = () => {
  keywordInputVisible.value = true
  nextTick(() => {
    keywordInputRef.value && keywordInputRef.value.focus()
  })
}

const addKeyword = () => {
  if (keywordInput.value && !keywordTags.value.includes(keywordInput.value)) {
    keywordTags.value.push(keywordInput.value)
  }
  keywordInputVisible.value = false
  keywordInput.value = ''
}

const removeKeyword = (tag) => {
  keywordTags.value.splice(keywordTags.value.indexOf(tag), 1)
}

const persistHistory = () => {
  try {
    localStorage.setItem('ai-content-history', JSON.stringify(generationHistory.value.slice(0, 10)))
  } catch (error) {
    console.warn('保存历史记录失败', error)
  }
}

const loadHistoryFromStorage = () => {
  try {
    const saved = localStorage.getItem('ai-content-history')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        generationHistory.value = parsed
      }
    }
  } catch (error) {
    console.warn('读取历史记录失败', error)
  }
}

const formatProviderLabel = (value) => {
  if (!value) return '离线模板'
  const name = providerNameMap[value] || value
  return name === value ? name : `${name}（${value}）`
}

const handleProviderChange = () => {
  providerError.value = ''
  if (availableModels.value.length === 0) {
    selectedModel.value = ''
    return
  }
  if (!availableModels.value.includes(selectedModel.value)) {
    selectedModel.value = availableModels.value[0]
  }
}

const fetchProviders = async () => {
  if (isLoadingProviders.value) return
  isLoadingProviders.value = true
  providerError.value = ''
  try {
    const res = await aiApi.getProviders()
    if (res.code === 200 && res.data) {
      providerModelMap.value = res.data
      providerOptions.value = Object.keys(res.data).map((key) => ({
        value: key,
        label: formatProviderLabel(key)
      }))
      if (providerOptions.value.length > 0 && !selectedProvider.value) {
        selectedProvider.value = providerOptions.value[0].value
      }
    } else {
      providerError.value = res.msg || '获取AI模型失败，请检查后端配置'
    }
  } catch (error) {
    providerError.value = error.message || '获取AI模型失败，请检查网络或密钥配置'
  } finally {
    isLoadingProviders.value = false
  }
}

const findOptionLabel = (options, value) => {
  const target = options.find((item) => item.value === value)
  return target ? target.label : value
}

const buildPrompt = () => {
  const lines = [
    `请为${getPlatformName(selectedPlatform.value)}平台创作一份${getContentTypeName(contentType.value)}内容。`,
    `主题：${contentTheme.value}`,
    `行业：${findOptionLabel(industryOptions, selectedIndustry.value)}`,
    `场景：${findOptionLabel(sceneOptions, selectedScene.value)}`,
    `内容风格：${getContentStyleLabel(contentStyle.value)}`
  ]
  if (keywordTags.value.length) {
    lines.push(`关键词：${keywordTags.value.join('、')}`)
  }
  lines.push('请输出结构化结果，包含标题、核心卖点、详细内容、行动号召与推荐话题。回复内容请使用中文。')
  return lines.join('\n')
}


const convertToPlainText = (value) => {
  if (!value) return ''
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\*\*/g, ' ')
    .replace(/[#`>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatContent(content) {
  if (!content) return ''
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content
  }
  const blocks = content.split(/
{2,}/).map((block) => block.trim()).filter(Boolean)
  if (!blocks.length) {
    return `<p>${content.replace(/
/g, '<br>')}</p>`
  }
  return blocks
    .map((block) => `<p>${block.replace(/
/g, '<br>')}</p>`)
    .join('')
}


const parseAiResponse = (text) => {
  const cleaned = (text || '').replace(/
/g, '').trim()
  if (!cleaned) return null
  const lines = cleaned.split(/
+/).map((line) => line.trim()).filter(Boolean)
  let title = ''
  const bodyLines = []
  const hashtags = new Set()

  lines.forEach((line) => {
    if (!title && /^标题[:：]/.test(line)) {
      title = line.replace(/^标题[:：]\s*/, '').trim()
      return
    }
    if (/^(话题|标签)[:：]/.test(line)) {
      const parts = line.split(/[:：]/).slice(1).join(':')
      parts.split(/[,，\s]+/).forEach((part) => {
        const tag = part.replace(/^#/, '').trim()
        if (tag) hashtags.add(tag)
      })
      return
    }
    if (/^#/.test(line)) {
      const tag = line.replace(/^#/, '').replace(/#/g, '').trim()
      if (tag) hashtags.add(tag)
      return
    }
    bodyLines.push(line)
  })

  if (!title && bodyLines.length) {
    title = bodyLines.shift()
  }

  const bodyText = bodyLines.join('
')
  const html = formatContent(bodyText)
  const plain = convertToPlainText(html)

  return {
    title: title || 'AI生成内容',
    content: html,
    rawText: cleaned,
    wordCount: plain.length,
    readTime: Math.max(1, Math.round(plain.length / 260)),
    tags: keywordTags.value.length ? Array.from(new Set(keywordTags.value)) : Array.from(hashtags).slice(0, 6),
    hashtags: Array.from(hashtags).slice(0, 6),
    seoSuggestions: generateSEOSuggestions(contentTheme.value, getPlatformName(selectedPlatform.value))
  }
}

const estimateDuration = (type, text) => {
  const baseSeconds = Math.max(convertToPlainText(text).length / 8, 15)
  if (type === 'video') return Math.min(Math.round(baseSeconds), 90)
  if (type === 'livestream') return Math.min(Math.round(baseSeconds * 1.5), 180)
  return Math.min(Math.round(baseSeconds), 60)
}

const normalizeShotlist = (data) => {
  if (!data) return { shots: [] }
  if (typeof data === 'string') {
    try {
      return normalizeShotlist(JSON.parse(data))
    } catch (error) {
      return { shots: [] }
    }
  }
  if (Array.isArray(data)) {
    return { shots: data }
  }
  if (Array.isArray(data.shots)) {
    return { shots: data.shots }
  }
  if (Array.isArray(data.scenes)) {
    return { shots: data.scenes }
  }
  return { shots: [] }
}

const generateShotlistFromContent = async (contentObj) => {
  if (!contentObj) {
    shotlist.value = null
    return
  }
  const scriptText = convertToPlainText(contentObj.rawText || contentObj.content)
  if (!scriptText) {
    shotlist.value = null
    return
  }
  generatingShotlist.value = true
  try {
    const res = await aiApi.generateShotlist({
      script: scriptText,
      duration: estimateDuration(contentType.value, scriptText),
      style: getContentStyleLabel(contentStyle.value)
    })
    if (res.code === 200 && res.data) {
      const normalized = normalizeShotlist(res.data)
      shotlist.value = normalized
      if (generatedContent.value) {
        generatedContent.value.shotlist = normalized
      }
      if (generationHistory.value.length) {
        generationHistory.value[0].shotlist = normalized
      }
    } else {
      shotlist.value = null
    }
  } catch (error) {
    console.warn('生成镜头脚本失败', error)
    shotlist.value = null
  } finally {
    generatingShotlist.value = false
    persistHistory()
  }
}

const generateContent = async () => {
  if (!canGenerate.value) return
  isGenerating.value = true
  providerError.value = ''
  shotlist.value = null
  try {
    let aiText = ''
    if (selectedProvider.value) {
      try {
        const res = await aiApi.generateText({
          provider: selectedProvider.value,
          model: selectedModel.value || undefined,
          prompt: buildPrompt(),
          industry: selectedIndustry.value,
          scene: selectedScene.value,
          platform: selectedPlatform.value,
          temperature: 0.65
        })
        if (res.code === 200 && res.data?.text) {
          aiText = res.data.text
          if (res.data.provider_used) {
            selectedProvider.value = res.data.provider_used
          }
          if (res.data.model_used) {
            selectedModel.value = res.data.model_used
          }
        } else {
          providerError.value = res.msg || 'AI生成失败，已使用本地模板生成'
        }
      } catch (error) {
        providerError.value = error.message || 'AI生成失败，已使用本地模板生成'
      }
    }

    let result = aiText ? parseAiResponse(aiText) : null
    if (!result) {
      const fallbackContent = generateContentBody(contentTheme.value, getPlatformName(selectedPlatform.value), getContentTypeName(contentType.value))
      result = {
        title: generateTitle(contentTheme.value),
        content: fallbackContent,
        rawText: fallbackContent,
        wordCount: convertToPlainText(fallbackContent).length,
        readTime: 2,
        tags: generateTags(contentTheme.value, keywordTags.value),
        hashtags: generateHashtags(selectedPlatform.value),
        seoSuggestions: generateSEOSuggestions(contentTheme.value, getPlatformName(selectedPlatform.value))
      }
    }

    generatedContent.value = {
      ...result,
      provider: selectedProvider.value,
      model: selectedModel.value,
      industry: selectedIndustry.value,
      scene: selectedScene.value,
      platform: selectedPlatform.value,
      contentType: contentType.value,
      keywords: [...keywordTags.value],
      theme: contentTheme.value
    }

    await generateShotlistFromContent(generatedContent.value)

    generationHistory.value.unshift({
      ...generatedContent.value,
      timestamp: new Date().toISOString()
    })
    generationHistory.value = generationHistory.value.slice(0, 10)
    persistHistory()

    ElMessage.success(aiText ? 'AI内容生成成功！' : '已使用本地模板生成内容')
  } catch (error) {
    ElMessage.error(error.message || '内容生成失败，请重试')
  } finally {
    isGenerating.value = false
  }
}

const regenerateContent = () => {
  generateContent()
}

const optimizeContent = async () => {
  if (!generatedContent.value) return
  if (!selectedProvider.value) {
    generatedContent.value.content = optimizeContentBody(generatedContent.value.content)
    ElMessage.success('已使用本地规则优化内容')
    return
  }
  isGenerating.value = true
  try {
    const baseText = convertToPlainText(generatedContent.value.rawText || generatedContent.value.content)
    const res = await aiApi.generateText({
      provider: selectedProvider.value,
      model: selectedModel.value || undefined,
      prompt: `${buildPrompt()}

这是当前草稿：
${baseText}

请在保留核心卖点的前提下，优化语言风格，使其更易懂、更适合短视频脚本。输出结构化内容。`,
      temperature: 0.55
    })
    if (res.code === 200 && res.data?.text) {
      const result = parseAiResponse(res.data.text)
      if (result) {
        generatedContent.value = {
          ...generatedContent.value,
          ...result
        }
        await generateShotlistFromContent(generatedContent.value)
        generationHistory.value[0] = {
          ...generationHistory.value[0],
          ...generatedContent.value,
          timestamp: new Date().toISOString()
        }
        ElMessage.success('内容优化成功！')
        return
      }
    }
    throw new Error(res.msg || 'AI优化失败')
  } catch (error) {
    console.warn('AI优化失败，使用本地优化', error)
    generatedContent.value.content = optimizeContentBody(generatedContent.value.content)
    ElMessage.warning('AI优化失败，已使用本地规则微调')
  } finally {
    isGenerating.value = false
    persistHistory()
  }
}

const saveToLibrary = () => {
  ElMessage.success('内容已保存到素材库（示例）')
}

const useTemplate = (template) => {
  contentTheme.value = template.description
  showTemplates.value = false
  ElMessage.info(`已应用模板：${template.name}`)
}

const loadFromHistory = (item) => {
  generatedContent.value = { ...item }
  shotlist.value = item.shotlist || null
  selectedPlatform.value = item.platform || selectedPlatform.value
  contentType.value = item.contentType || contentType.value
  selectedIndustry.value = item.industry || selectedIndustry.value
  selectedScene.value = item.scene || selectedScene.value
  keywordTags.value = item.keywords || []
  selectedProvider.value = item.provider || selectedProvider.value
  selectedModel.value = item.model || selectedModel.value
  contentTheme.value = item.theme || contentTheme.value
}

const clearHistory = () => {
  generationHistory.value = []
  shotlist.value = null
  persistHistory()
  ElMessage.info('历史记录已清空')
}

const exportContent = () => {
  if (!generatedContent.value) {
    ElMessage.warning('请先生成内容')
    return
  }
  let exportText = `【标题】${generatedContent.value.title}

${convertToPlainText(generatedContent.value.content)}`
  if (shotlist.value?.shots?.length) {
    exportText += '

【镜头脚本建议】
'
    shotlist.value.shots.forEach((shot, idx) => {
      exportText += `${idx + 1}. 时长${shot.duration || ''}秒｜画面：${shot.scene || shot.description || ''}｜旁白：${shot.voiceover || ''}
`
    })
  }
  const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${generatedContent.value.title || 'AI内容'}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('内容已导出')
}

const getPlatformName = (platform) => {
  const platforms = {
    douyin: '抖音',
    xiaohongshu: '小红书',
    wechat: '微信视频号',
    kuaishou: '快手',
    bilibili: 'B站',
    tiktok: 'TikTok'
  }
  return platforms[platform] || platform
}

const getPlatformType = (platform) => {
  const types = {
    douyin: '',
    xiaohongshu: 'danger',
    wechat: 'success',
    kuaishou: 'warning',
    bilibili: 'info',
    tiktok: ''
  }
  return types[platform] || ''
}

const getContentTypeName = (type) => {
  const types = {
    video: '短视频',
    image: '图文',
    text: '文案',
    livestream: '直播'
  }
  return types[type] || type
}

const getContentStyleLabel = (style) => {
  const styles = {
    humorous: '轻松幽默',
    professional: '专业严谨',
    warm: '温馨亲切',
    trendy: '时尚潮流',
    educational: '教育科普',
    storytelling: '故事叙述'
  }
  return styles[style] || style
}

const generateTitle = (theme) => {
  const prefixes = ['超实用', '必看', '独家', '详细', '完整', '专业']
  const suffixes = ['指南', '教程', '分享', '技巧', '心得', '方法']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  return `${prefix}${suffix}`
}

const generateContentBody = (theme, platform, type) => {
  return `
<p><strong>🌟 引言部分</strong></p>
<p>今天要和大家分享的是关于${theme}的实用内容。作为一名内容创作者，我发现很多朋友都在这个领域遇到了各种问题和困惑。</p>

<p><strong>💡 核心内容</strong></p>
<p>首先，我们需要明确${theme}的基本概念和重要性。通过大量的实践和总结，我整理出了以下几个关键要点：</p>

<ul>
  <li><strong>要点一</strong>：深入理解用户需求，提供有价值的信息</li>
  <li><strong>要点二</strong>：保持内容的专业性和可信度</li>
  <li><strong>要点三</strong>：注重内容的互动性和参与感</li>
  <li><strong>要点四</strong>：持续优化和改进内容质量</li>
</ul>

<p><strong>🎯 实践建议</strong></p>
<p>基于以上要点，我建议大家可以从以下几个方面入手：</p>

<ol>
  <li>制定明确的内容策略和目标</li>
  <li>深入了解目标受众的喜好和需求</li>
  <li>保持内容的持续更新和优化</li>
  <li>积极与观众互动，收集反馈</li>
</ol>

<p><strong>📝 总结</strong></p>
<p>总的来说，${theme}是一个需要长期投入和不断学习的过程。希望今天的分享对大家有所帮助，也欢迎在评论区分享你们的经验和想法！</p>

<p>记得点赞关注，我们下期再见！✨</p>
  `.trim()
}

const generateTags = (theme, keywords) => {
  const baseTags = [theme, '实用', '分享', '教程']
  return [...baseTags, ...keywords].slice(0, 6)
}

const generateHashtags = (platform) => {
  const hashtags = {
    douyin: ['抖音创作者', '短视频', '内容创作'],
    xiaohongshu: ['小红书', '生活方式', '种草'],
    wechat: ['视频号', '微信创作', '社交内容'],
    kuaishou: ['快手', '老铁', '短视频创作'],
    bilibili: ['B站', 'UP主', '弹幕互动'],
    tiktok: ['TikTok', '国际创作', '短视频']
  }
  return hashtags[platform] || ['内容创作', '社交媒体']
}

const generateSEOSuggestions = (theme, platform) => {
  return [
    `在标题中包含"${theme}"关键词，提高搜索排名`,
    `使用${platform}平台的热门标签增加曝光度`,
    '内容开头前30秒要吸引注意力',
    '添加相关的话题标签提高被发现几率',
    '保持内容更新频率，维持账号活跃度',
    '与观众互动，提高内容参与度'
  ]
}

const optimizeContentBody = (content) => {
  return content
    .replace(/<p><strong>/g, '<p><em>✨ </em><strong>')
    .replace(/<\/p>/g, '</p>\n')
    .replace(/<ul>/g, '<div class="tips-list">\n<ul>')
    .replace(/<\/ul>/g, '</ul>\n</div>')
}

const formatTime = (timestamp) => {
  const now = new Date()
  const diff = now - new Date(timestamp)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return new Date(timestamp).toLocaleDateString()
}

onMounted(() => {
  loadHistoryFromStorage()
  fetchProviders()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.ai-content-generator {
  padding: 20px;
  background-color: $bg-color-page;
  min-height: 100vh;
}

.generator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    h2 {
      margin: 0 0 8px 0;
      color: $text-primary;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.generator-content {
  .input-card {
    .form-section {
      margin-bottom: 24px;

      .section-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: $text-regular;
      }

      .full-width {
        width: 100%;
      }

      .model-select {
        margin-top: 8px;
      }

      .provider-hint {
        margin-top: 6px;
        font-size: 12px;
        color: $text-secondary;
      }

      .provider-error {
        margin-top: 6px;
        font-size: 12px;
        color: var(--el-color-danger);
      }

      .keyword-tag {
        margin-right: 8px;
        margin-bottom: 8px;
      }

      .keyword-input {
        width: 100px;
        margin-right: 8px;
        margin-bottom: 8px;
      }

      .keyword-add-btn {
        margin-bottom: 8px;
      }

      .generate-btn {
        width: 100%;
        height: 48px;
        font-size: 16px;
        font-weight: 500;
      }
    }
  }

  .result-card {
    margin-bottom: 20px;

    .content-preview {
      .content-title {
        margin-bottom: 16px;

        h4 {
          margin: 0 0 8px 0;
          color: $text-primary;
          font-size: 18px;
          font-weight: 600;
        }

        .meta-info {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: $text-secondary;

          .provider-tag {
            border-radius: 4px;
          }

          .model-name {
            font-size: 12px;
            color: $text-secondary;
          }
        }
      }

      .content-body {
        line-height: 1.6;
        color: $text-regular;
        margin-bottom: 20px;

        :deep(ul) {
          padding-left: 20px;
        }

        :deep(li) {
          margin-bottom: 8px;
        }
      }

      .content-tags {
        .tags-section, .hashtags-section {
          margin-bottom: 12px;

          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: $text-regular;
          }

          .content-tag, .hashtag-tag {
            margin-right: 8px;
            margin-bottom: 8px;
          }
        }
      }

      .seo-suggestions {
        background-color: $bg-color;
        padding: 16px;
        border-radius: 8px;

        h5 {
          margin: 0 0 12px 0;
          color: $text-primary;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .suggestions-list {
          margin: 0;
          padding-left: 20px;

          li {
            margin-bottom: 4px;
            color: $text-regular;
            font-size: 13px;
          }
        }
      }

      .shotlist-section {
        margin-top: 20px;

        h5 {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }
      }

      .shotlist-table {
        width: 100%;
      }

      .shotlist-loading {
        margin-top: 16px;
        font-size: 13px;
        color: $text-secondary;
      }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: $text-secondary;

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: $text-placeholder;
      }

      p {
        margin: 0 0 8px 0;

        &.empty-hint {
          font-size: 14px;
          color: $text-placeholder;
        }
      }
    }
  }

  .history-card {
    .history-list {
      .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid $border-color;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: $bg-color;
        }

        .history-content {
          .history-title {
            font-weight: 500;
            color: $text-primary;
            margin-bottom: 4px;
          }

          .history-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: $text-secondary;
          }
        }

        .history-arrow {
          color: $text-placeholder;
        }
      }
    }

    .empty-history {
      text-align: center;
      padding: 40px 20px;
      color: $text-secondary;
      font-size: 14px;
    }
  }
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;

  .template-card {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 1px solid $border-color;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $primary-color;
      box-shadow: 0 2px 8px rgba($primary-color, 0.1);
    }

    .template-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background-color: $primary-light;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      color: $primary-color;
    }

    .template-info {
      flex: 1;

      h4 {
        margin: 0 0 4px 0;
        color: $text-primary;
        font-size: 14px;
        font-weight: 500;
      }

      p {
        margin: 0 0 8px 0;
        color: $text-secondary;
        font-size: 12px;
      }

      .template-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .ai-content-generator {
    padding: 16px;
  }

  .generator-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .generator-content {
    .el-col {
      width: 100% !important;
      margin-bottom: 20px;
    }
  }
}
</style>