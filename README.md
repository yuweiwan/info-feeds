# Feeds Skill

AI 驱动的信息流聚合工具，支持从多个信息源抓取内容，自动分类和提取实体关系。

## 功能特性

- **多源抓取**: 支持 RSS、API、Web 等多种信息源
- **智能分类**: 使用 Claude 自动分类文章（核心分类 + 子分类）
- **实体提取**: 自动提取投资、创始、产品、工作、收购、合作等关系
- **增量更新**: 新源处理 7 天内文章，已有源只处理新文章
- **灵活通知**: 支持会话内通知和微信通知
- **本地存储**: 所有数据存储在用户指定目录

## 快速开始

### 1. 初始化配置

```bash
/feeds setup --data-dir ~/feeds-data
```

### 2. 配置信息源

编辑 `~/feeds-data/sources.yaml`：

```yaml
sources:
  - name: hacker-news
    type: hacker-news
    config:
      storyType: top
      limit: 30

  - name: github-trending
    type: github-trending
    config:
      language: ""
      since: daily
```

### 3. 测试抓取

```bash
/feeds check
```

### 4. 执行抓取

```bash
/feeds run --data-dir ~/feeds-data
```

## 支持的信息源

### Hacker News
抓取 Hacker News 热门文章。

```yaml
- name: hn-top
  type: hacker-news
  config:
    storyType: top  # top, new, best, ask, show, job
    limit: 30
```

### GitHub Trending
抓取 GitHub Trending 项目。

```yaml
- name: gh-trending
  type: github-trending
  config:
    language: ""     # 留空表示所有语言
    since: daily     # daily, weekly, monthly
```

### Spaceflight News
抓取航天新闻。

```yaml
- name: space-news
  type: spaceflight-news
  config:
    limit: 20
```

### Dev.to
抓取 Dev.to 文章（需要 API Key）。

```yaml
- name: devto
  type: dev-to
  config:
    apiKey: your_api_key
    tag: ""          # 留空表示所有标签
    top: 7           # 最近 N 天的热门文章
```

## 命令列表

- `setup`: 初始化配置
- `check [source]`: 测试抓取
- `add <config>`: 添加信息源
- `list`: 列出所有信息源
- `search <query>`: 搜索文章
- `entities [name]`: 查看实体关系
- `run`: 执行抓取（默认命令）

## 项目结构

```
~/.claude/skills/feeds/
├── index.mjs                 # 主入口
├── package.json
├── SKILL.md                  # Skill 文档
├── README.md
├── templates/                # 配置模板
│   ├── config.yaml.template
│   ├── sources.yaml.template
│   └── categories.yaml.template
├── references/               # 参考文档
│   ├── categories.md
│   ├── entity-types.md
│   └── prompts/
│       └── extraction.md
└── scripts/
    ├── commands/             # 命令处理器
    │   ├── setup.mjs
    │   ├── check.mjs
    │   ├── add.mjs
    │   ├── list.mjs
    │   ├── search.mjs
    │   └── entities.mjs
    ├── core/                 # 核心模块
    │   ├── fetch.mjs
    │   ├── extract.mjs
    │   ├── dedup.mjs
    │   ├── storage.mjs
    │   └── notify.mjs
    └── fetchers/             # 抓取脚本
        ├── utils.mjs
        ├── hacker-news.mjs
        ├── github-trending.mjs
        ├── spaceflight-news.mjs
        └── dev-to.mjs
```

## 数据存储结构

```
{data_dir}/
├── config.yaml              # 主配置
├── sources.yaml             # 信息源列表
├── categories.yaml          # 分类配置
├── state.json               # 状态追踪
├── memories/                # 文章记忆
│   ├── hacker-news.json
│   ├── github-trending.json
│   └── ...
└── daily/                   # 每日摘要
    └── 2026-03-15/
        └── digest.json
```

## 开发指南

### 添加新的信息源类型

1. 在 `scripts/fetchers/` 创建新的抓取脚本
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

## 测试

```bash
# 安装依赖
npm install

# 测试帮助命令
node index.mjs --help

# 测试初始化
node index.mjs setup --data-dir ./test-data

# 测试抓取
node index.mjs check --data-dir ./test-data
```

## 许可证

MIT
