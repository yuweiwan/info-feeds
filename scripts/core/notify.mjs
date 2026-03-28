#!/usr/bin/env node
/**
 * 通知分发模块
 */

/**
 * 发送通知
 */
export async function notify(articles, channels = ['session'], options = {}) {
  for (const channel of channels) {
    switch (channel.trim()) {
      case 'session':
        await notifySession(articles);
        break;
      case 'wechat':
        await notifyWeChat(articles, options.chatId);
        break;
      default:
        console.warn(`未知通知渠道：${channel}`);
    }
  }
}

/**
 * 会话内通知
 */
async function notifySession(articles) {
  if (articles.length === 0) {
    console.log('\n没有新文章。');
    return;
  }

  console.log(`\n=== 新文章通知 (${articles.length} 篇) ===\n`);

  // 按分类分组
  const byCategory = {};
  for (const article of articles) {
    if (!byCategory[article.category]) {
      byCategory[article.category] = [];
    }
    byCategory[article.category].push(article);
  }

  // 输出每个分类
  for (const [category, items] of Object.entries(byCategory)) {
    console.log(`\n## ${category} (${items.length} 篇)\n`);

    for (const article of items.slice(0, 5)) {
      console.log(`**${article.title}**`);
      console.log(`  ${article.summary}`);
      if (article.entities && article.entities.length > 0) {
        const entityStr = article.entities
          .map(e => `${e.name} ${e.relation} ${e.target}`)
          .join(', ');
        console.log(`  关系: ${entityStr}`);
      }
      console.log(`  ${article.url}\n`);
    }

    if (items.length > 5) {
      console.log(`  ... 还有 ${items.length - 5} 篇\n`);
    }
  }
}

/**
 * 微信通知
 */
async function notifyWeChat(articles, chatId) {
  if (!chatId) {
    console.error('微信通知需要 --chat-id 参数');
    return;
  }

  if (articles.length === 0) {
    return;
  }

  // 构造消息（限制长度）
  const message = `发现 ${articles.length} 篇新文章：\n\n` +
    articles.slice(0, 5).map(a =>
      `${a.category} ${a.title}\n${a.url}`
    ).join('\n\n');

  console.log(`\n[微信通知] 准备发送到 ${chatId}`);
  console.log('消息内容：');
  console.log(message);
  console.log('\n请在 SKILL.md 中调用 mcp__plugin_weixin_weixin__reply 工具发送此消息。');
}
