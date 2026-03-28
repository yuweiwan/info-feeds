# 信息源目录

本文档列出 feeds skill 支持的所有信息源类型及其配置方式。

## 添加信息源

从下方选择需要的源，编辑 `sources.yaml`：

```yaml
sources:
  - name: my-custom-name    # 自定义名称
    type: xxx              # 从下方选择类型
    enabled: true
    config:
      # 配置参数（见下方）
```

---

## 支持的信息源类型

### 1. hacker-news

Hacker News 热门文章。

```yaml
- name: hn-top
  type: hacker-news
  config:
    story_type: top  # top | new | best | ask | show | job
    limit: 30        # 最多获取数量
```

| 参数 | 可选值 | 说明 |
|------|--------|------|
| story_type | top, new, best, ask, show, job | 故事类型 |
| limit | 1-500 | 最多获取数量 |

---

### 2. github-trending

GitHub Trending 项目。

```yaml
- name: gh-daily
  type: github-trending
  config:
    language: ""      # 编程语言，留空表示所有
    since: daily      # daily | weekly | monthly
```

| 参数 | 可选值 | 说明 |
|------|--------|------|
| language | "", javascript, python, go, rust, ... | 编程语言 |
| since | daily, weekly, monthly | 时间范围 |

---

### 3. spaceflight-news

航天新闻 (spaceflightnews.com)。

```yaml
- name: space-news
  type: spaceflight-news
  config:
    limit: 20        # 最多获取数量
```

| 参数 | 说明 |
|------|------|
| limit | 最多获取数量 |

---

### 4. dev-to

Dev.to 技术文章（需要 API Key）。

```yaml
- name: devto-js
  type: dev-to
  config:
    api_key: your_api_key_here
    tag: "javascript"    # 留空表示所有
    top: 7               # 最近 N 天的热门
```

| 参数 | 说明 |
|------|------|
| api_key | Dev.to API Key（从 https://dev.to/settings/keys 获取）|
| tag | 技术标签，留空表示所有 |
| top | 最近 N 天的热门文章 |

---

### 5. rss

通用 RSS/Atom 订阅源。

```yaml
- name: techcrunch-ai
  type: rss
  config:
    url: https://techcrunch.com/category/artificial-intelligence/feed/
    max_age: 7          # 最多获取 N 天内的文章
```

| 参数 | 说明 |
|------|------|
| url | RSS/Atom 订阅地址 |
| max_age | 最多获取 N 天内的文章 |

---

### 6. rss-full

通用 RSS/Atom 订阅源（完整内容抓取版）。

```yaml
- name: my-blog
  type: rss-full
  config:
    url: https://example.com/feed.xml
    max_age: 7
```

与 `rss` 类似，但会尝试抓取文章的完整内容而非仅仅摘要。

---

## 配置示例

编辑 `sources.yaml`，选择需要的源：

```yaml
sources:
  # Hacker News 热门
  - name: hn-top
    type: hacker-news
    enabled: true
    config:
      story_type: top
      limit: 30

  # GitHub 今日热门
  - name: gh-daily
    type: github-trending
    enabled: true
    config:
      language: ""
      since: daily

  # RSS 订阅
  - name: techcrunch
    type: rss
    enabled: false      # 先禁用，测试通过后再启用
    config:
      url: https://techcrunch.com/feed/
      max_age: 7
```

## 测试配置

添加新源后，测试一下：

```bash
/feeds check source-name
```
