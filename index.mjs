#!/usr/bin/env node
/**
 * Feeds Skill 主入口
 */

import { parseArgs } from 'node:util';
import path from 'node:path';
import os from 'node:os';

// 导入命令
import { setup } from './scripts/commands/setup.mjs';
import { check } from './scripts/commands/check.mjs';
import { add } from './scripts/commands/add.mjs';
import { list } from './scripts/commands/list.mjs';
import { search } from './scripts/commands/search.mjs';
import { entities } from './scripts/commands/entities.mjs';
import { refs } from './scripts/commands/refs.mjs';

// 导入核心模块
import { loadConfig } from './scripts/core/storage.mjs';
import { fetchAll } from './scripts/core/fetch.mjs';
import { notify } from './scripts/core/notify.mjs';

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'data-dir': { type: 'string' },
      'notify': { type: 'string', default: 'session' },
      'chat-id': { type: 'string' },
      'category': { type: 'string' },
      help: { type: 'boolean', short: 'h' }
    },
    allowPositionals: true
  });

  const command = positionals[0] || 'run';

  // 帮助信息
  if (values.help) {
    console.log(`
Feeds Skill - AI 驱动的信息流聚合工具

用法:
  /feeds [command] [options]

命令:
  setup              初始化配置
  refs [name]        查看参考文档（无参数列出所有）
  check [source]     测试抓取（可选指定源名称）
  add <config>       添加信息源
  list               列出所有信息源
  search <query>     搜索文章
  entities [name]    查看实体关系
  run                执行抓取（默认命令）

选项:
  --data-dir <path>  数据目录（必需，除了 setup 命令）
  --notify <channels> 通知渠道，逗号分隔（默认: session）
  --chat-id <id>     微信通知的 chat_id
  --category <name>  按分类过滤（search 命令）
  -h, --help         显示帮助信息

示例:
  /feeds setup --data-dir ~/feeds-data
  /feeds check
  /feeds run --notify session,wechat --chat-id wxid_xxx
  /feeds search "AI" --category "AI研究"
  /feeds entities "OpenAI"
`);
    return;
  }

  // setup 命令特殊处理（不需要已有配置）
  if (command === 'setup') {
    const dataDir = values['data-dir'] || path.join(os.homedir(), '.feeds');
    await setup(dataDir);
    return;
  }

  // 其他命令需要 data-dir
  const dataDir = values['data-dir'];
  if (!dataDir) {
    console.error('错误: 需要 --data-dir 参数');
    console.error('运行 /feeds --help 查看帮助');
    process.exit(1);
  }

  // 执行命令
  switch (command) {
    case 'refs':
      // refs 命令不需要 dataDir
      await refs(positionals[1]);
      return;

    case 'check':
      await check(dataDir, positionals[1]);
      break;

    case 'add': {
      if (!positionals[1]) {
        console.error('错误: 需要提供源配置（JSON 格式）');
        process.exit(1);
      }
      const sourceConfig = JSON.parse(positionals[1]);
      await add(dataDir, sourceConfig);
      break;
    }

    case 'list':
      await list(dataDir);
      break;

    case 'search':
      await search(dataDir, positionals[1], {
        category: values.category
      });
      break;

    case 'entities':
      await entities(dataDir, positionals[1]);
      break;

    case 'run':
    default: {
      // 执行完整的抓取流程
      console.log('开始抓取信息流...\n');

      // 1. 抓取所有源
      const articles = await fetchAll(dataDir);

      if (articles.length === 0) {
        console.log('\n没有新文章');
        return;
      }

      console.log(`\n共抓取到 ${articles.length} 篇新文章`);
      console.log('\n⚠️  需要 AI 提取分类和实体关系');
      console.log('请在 Claude Code 会话中继续处理这些文章\n');

      // 输出文章列表供 Claude 处理
      console.log(JSON.stringify(articles, null, 2));

      // 2. 发送通知
      const channels = values.notify.split(',');
      await notify(articles, channels, {
        chatId: values['chat-id']
      });
      break;
    }
  }
}

main().catch(error => {
  console.error('错误:', error.message);
  process.exit(1);
});
