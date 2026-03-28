---
name: feeds
description: AI-driven information feed aggregator with smart categorization and entity extraction
version: 2.0.0
metadata:
  author: Yuwei Wan
  license: MIT
---

# Feeds Skill

AI 驱动的信息流聚合工具，支持从多个信息源抓取内容，自动分类和提取实体关系。

## 前置检查

在开始使用前，先检查环境：

```bash
bash ~/.claude/skills/feeds/scripts/check-env.sh [data-dir]
```

**必需环境**：
- **Node.js 18+**：必需
- **npm 依赖**：首次使用需安装（`cd ~/.claude/skills/feeds && npm install`）
- **数据目录**：需要通过 `setup` 命令初始化

检查通过后再执行其他操作，未通过则引导用户完成设置。

## 信息聚合哲学

**目标导向，质量优先，增量高效。**

这个 skill 的核心是帮助用户从海量信息中提取有价值的内容，而不是简单地堆砌数据。所有行为都应遵循这个逻辑。

**① 明确目标** — 用户需要什么类型的信息？关注哪些领域？成功标准是什么（覆盖面、时效性、深度）？

**② 选择信息源** — 根据目标选择合适的源类型。一手信息优于二手聚合，官方源优于转载源，结构化 API 优于网页抓取。

**③ 增量处理** — 新源处理近期内容（默认 7 天），已有源只处理新文章。避免重复处理，节省资源。

**④ AI 提取** — 每篇文章通过 AI 提取分类、摘要、实体关系。提取失败不阻塞其他文章，记录错误继续处理。

**⑤ 质量控制** — 单个源连续失败 3 次自动禁用，避免浪费资源。用户可手动重置后重试。

## 信息源选择

根据需求选择合适的信息源类型：

| 需求 | 推荐源类型 | 说明 |
|------|-----------|------|
| 技术社区热点 | `hacker-news`, `github-trending` | 高质量技术讨论和开源项目 |
| 行业资讯 | `rss` | 订阅权威媒体和行业博客 |
| 深度文章 | `rss-full` | 抓取完整正文，适合长文 |
| 特定平台 | `dev-to`, `spaceflight-news` | 垂直领域专业内容 |

完整信息源目录：`/feeds refs sources-catalog`

## 使用流程

### 1. 初始化配置

```bash
/feeds setup --data-dir ~/feeds-data
```

这会创建以下文件：
- `config.yaml`: 主配置文件
- `sources.yaml`: 信息源列表
- `categories.yaml`: 分类配置
- `state.json`: 状态追踪

### 2. 选择信息源

**查看可用信息源**：

```bash
/feeds refs sources-catalog
```

支持的类型：
- `hacker-news` - Hacker News 热门文章
- `github-trending` - GitHub Trending 项目
- `spaceflight-news` - 航天新闻
- `dev-to` - Dev.to 技术文章（需要 API Key）
- `rss` / `rss-full` - 通用 RSS/Atom 订阅

**编辑你的配置**：

编辑 `~/feeds-data/sources.yaml`，添加你需要的源：

```yaml
sources:
  - name: hn-top
    type: hacker-news
    enabled: true
    config:
      story_type: top
      limit: 30
```

### 3. 测试抓取

```bash
/feeds check
```

或测试单个源：

```bash
/feeds check hacker-news
```

### 4. 执行抓取与 AI 提取

```bash
/feeds run --data-dir ~/feeds-data
```

**工作流程**：
1. 脚本抓取所有配置源的新文章
2. 输出文章列表（JSON 格式）
3. **你需要对每篇文章调用 AI 提取**（见下方"AI 提取流程"）
4. 保存提取结果到 memories 和 daily 目录

带通知：

```bash
/feeds run --data-dir ~/feeds-data --notify session,wechat --chat-id wxid_xxx
```

### 5. 搜索和查询

```bash
# 搜索文章
/feeds search "AI" --data-dir ~/feeds-data

# 按分类搜索
/feeds search "GPT" --data-dir ~/feeds-data --category "AI研究"

# 查看实体关系
/feeds entities --data-dir ~/feeds-data

# 查看特定实体
/feeds entities "OpenAI" --data-dir ~/feeds-data

# 列出所有源
/feeds list --data-dir ~/feeds-data
```

## AI 提取流程

`/feeds run` 执行后，你需要对每篇文章进行 AI 提取。这是一个**半自动流程**：

**① 脚本输出文章列表** — JSON 格式，包含标题、URL、时间、内容等

**② 读取提取模板** — `references/prompts/extraction.md` 包含提取指令

**③ 对每篇文章执行提取**：
- 替换模板中的占位符（`{{TITLE}}`, `{{URL}}`, `{{CONTENT}}` 等）
- 调用 Claude API 或在会话中执行提取
- 解析返回的 JSON 结果（category, entities, summary）

**④ 保存结果**：
- 文章记忆：`memories/{source}.json`
- 每日摘要：`daily/{date}/digest.json`

**⑤ 错误处理**：
- 单篇文章提取失败不阻塞其他文章
- 记录错误日志，继续处理下一篇

**提取模板示例**：

```markdown
你是一个信息提取专家。请从以下文章中提取结构化信息。

## 文章信息
**标题**：{{TITLE}}
**URL**：{{URL}}
**内容**：{{CONTENT}}

## 任务
1. 从给定分类中选择一个最合适的分类
2. 提取实体关系（投资、创始、产品、工作、收购、合作）
3. 生成一句话摘要（30字以内）

## 输出格式
{
  "category": "分类名称",
  "entities": [...],
  "summary": "一句话摘要"
}
```

## 技术事实

- **增量处理机制**：新源处理 7 天内文章，已有源通过 `state.json` 记录最后处理时间，只抓取新文章
- **去重逻辑**：基于 URL 哈希去重，同一 URL 只处理一次
- **错误容错**：单个源失败不影响其他源，连续 3 次失败自动禁用该源
- **并发限制**：fetcher 脚本串行执行，避免触发 API 限流
- **数据持久化**：所有数据存储在用户指定的 data-dir，便于备份和迁移
- **通知机制**：支持会话内通知（console）和微信通知（需 WeChat MCP 插件）

## 数据存储结构

```
{data_dir}/
├── config.yaml              # 主配置
├── sources.yaml             # 信息源列表
├── categories.yaml          # 分类配置
├── state.json               # 状态追踪（最后处理时间、错误计数）
├── memories/                # 文章记忆（按源分文件）
│   ├── hacker-news.json
│   ├── github-trending.json
│   └── ...
└── daily/                   # 每日摘要
    └── 2026-03-28/
        └── digest.json
```

**state.json 格式**：
```json
{
  "source-name": {
    "last_fetch": "2026-03-28T08:00:00Z",
    "error_count": 0
  }
}
```

**memories/{source}.json 格式**：
```json
[
  {
    "id": "hash-of-url",
    "title": "文章标题",
    "url": "https://...",
    "time": "2026-03-28T08:00:00Z",
    "source": "hacker-news",
    "category": "AI研究",
    "summary": "一句话摘要",
    "entities": [...]
  }
]
```

## 故障排查

### 抓取失败

```bash
/feeds check source-name
```

查看详细错误信息。常见问题：
- **网络超时**：检查网络连接，某些 API 可能需要代理
- **API Key 无效**：检查 `sources.yaml` 中的 API Key 配置
- **RSS 格式错误**：某些 RSS 源格式不标准，尝试用 `rss-full` 类型

### 源被禁用

检查 `state.json` 中的 `error_count`，如果 >= 3 则源被自动禁用。

手动重置：
```json
{
  "source-name": {
    "last_fetch": "2026-03-28T08:00:00Z",
    "error_count": 0
  }
}
```

### 数据目录不存在

运行 `setup` 命令重新初始化：
```bash
/feeds setup --data-dir ~/feeds-data
```

### AI 提取失败

- 检查提取 prompt 是否正确替换了占位符
- 确保 Claude 返回的是有效 JSON 格式
- 单篇文章失败不影响其他文章，查看错误日志定位问题

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `references/sources-catalog.md` | 选择信息源时，查看所有支持的源类型和配置参数 |
| `references/categories.md` | 自定义分类体系时 |
| `references/entity-types.md` | 了解支持的实体关系类型时 |
| `references/prompts/extraction.md` | 执行 AI 提取时，作为 prompt 模板 |

## 开发指南

### 添加新的信息源类型

1. 在 `scripts/fetchers/` 创建新的抓取脚本（如 `my-source.mjs`）
2. 实现标准接口：
   - 接收 JSON 配置作为命令行参数
   - 输出标准化的文章列表（JSON 格式）
3. 文章格式：
   ```javascript
   {
     title: string,
     url: string,
     time: string,      // ISO 8601 格式
     content: string,   // 可选
     author: string,    // 可选
     metadata: object   // 可选
   }
   ```
4. 在 `references/sources-catalog.md` 中添加文档

### 自定义分类

编辑 `categories.yaml`：

```yaml
core_categories:
  - 自定义分类1
  - 自定义分类2

sub_categories:
  自定义分类1:
    - 子分类1
    - 子分类2
```

## 注意事项

1. **data-dir 必须配置**：除了 `setup` 命令，其他命令都需要 `--data-dir` 参数
2. **AI 提取需要手动**：skill 只负责抓取，AI 提取需要在 Claude Code 会话中完成
3. **增量更新**：新源只处理 7 天内文章，已有源只处理新文章
4. **错误处理**：单个源失败不影响其他源，连续 3 次失败后自动禁用
5. **微信通知**：需要配置 WeChat MCP 插件并提供 `--chat-id`
6. **环境检查**：首次使用前运行 `check-env.sh` 确保环境就绪

## 许可证

MIT
