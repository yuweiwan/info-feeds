#!/usr/bin/env node
/**
 * entities 命令：查看实体关系
 */

import { loadAllMemories } from '../core/storage.mjs';

export async function entities(dataDir, entityName = null) {
  const memories = await loadAllMemories(dataDir);

  if (memories.length === 0) {
    console.log('还没有任何文章记录');
    return;
  }

  // 收集所有实体关系
  const allEntities = [];
  for (const article of memories) {
    if (article.entities && article.entities.length > 0) {
      for (const entity of article.entities) {
        allEntities.push({
          ...entity,
          article_title: article.title,
          article_url: article.url
        });
      }
    }
  }

  // 过滤
  const filtered = entityName
    ? allEntities.filter(e =>
        e.name.toLowerCase().includes(entityName.toLowerCase()) ||
        e.target.toLowerCase().includes(entityName.toLowerCase())
      )
    : allEntities;

  if (filtered.length === 0) {
    console.log(entityName ? `未找到相关实体: ${entityName}` : '没有提取到任何实体关系');
    return;
  }

  console.log(`找到 ${filtered.length} 条实体关系:\n`);

  // 按关系类型分组
  const byRelation = {};
  for (const entity of filtered) {
    if (!byRelation[entity.relation]) {
      byRelation[entity.relation] = [];
    }
    byRelation[entity.relation].push(entity);
  }

  for (const [relation, entities] of Object.entries(byRelation)) {
    console.log(`\n## ${relation} (${entities.length} 条)\n`);

    for (const entity of entities.slice(0, 10)) {
      console.log(`${entity.name} → ${entity.target}`);
      console.log(`  来源: ${entity.article_title}`);
      console.log(`  ${entity.article_url}\n`);
    }

    if (entities.length > 10) {
      console.log(`... 还有 ${entities.length - 10} 条\n`);
    }
  }
}
