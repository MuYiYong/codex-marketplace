# Codex Marketplace

MuYiYong 的 Codex 插件索引。Codex 通过 `codex plugin marketplace add` 读取本仓库的 `.agents/plugins/marketplace.json`，再从各插件自己的仓库下载并安装。

它与 [MuYiYong/dsh-marketplace](https://github.com/MuYiYong/dsh-marketplace) 并列：同一个插件仓库可以同时被两个 marketplace 收录，插件代码只维护一份。

## 在 Codex 中使用

需要 Codex CLI 0.172.0+（支持 `git-subdir` 插件来源）和 Node.js 18+。

```bash
# 1. 添加索引仓库
codex plugin marketplace add MuYiYong/codex-marketplace

# 2. 查看可安装插件
codex plugin list

# 3. 安装
codex plugin add nebula-mcp@codex-marketplace
```

安装后重启 Codex，在插件页确认插件已启用。

### 升级

```bash
codex plugin marketplace upgrade
codex plugin add nebula-mcp@codex-marketplace
```

`marketplace.json` 固定每个插件仓库的完整 commit；`marketplace upgrade` 刷新索引后，重新 `plugin add` 即可切换到新 commit。

### 卸载

```bash
codex plugin remove nebula-mcp@codex-marketplace
```

如不再使用本索引：

```bash
codex plugin marketplace remove codex-marketplace
```

卸载插件只删除 Codex 的插件缓存，不会删除插件自己准备的数据或共享运行时。

## 已收录插件

| 插件 | 仓库 | 来源目录 | 说明 |
|------|------|----------|------|
| `nebula-mcp` | [MuYiYong/nebula-mcp](https://github.com/MuYiYong/nebula-mcp) | `plugins/nebula-mcp` | 在 Codex 中连接悦数图数据库（NebulaGraph 5.x），执行只读 GQL 并展示图、表格、图表与解释。首次启动自动准备运行时。 |

## 仓库结构

```text
.agents/plugins/marketplace.json   Codex marketplace manifest
scripts/validate.mjs               本地与 CI 校验
test/marketplace.test.mjs          校验器测试
.github/workflows/validate.yml     CI
```

## 收录约定（一个插件一个 repo）

本仓库只保存索引，不复制插件文件。新增插件时：

1. 插件必须在自己的仓库中提供 Codex 插件目录，例如 `plugins/<name>/`，内含 `.codex-plugin/plugin.json` 和 `.mcp.json`。
2. 在 `.agents/plugins/marketplace.json` 的 `plugins[]` 中添加条目，`source` 使用 `git-subdir`：

```json
{
  "name": "<plugin-name>",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/Owner/<plugin-repo>",
    "path": "plugins/<name>",
    "ref": "main",
    "sha": "<40 位 commit>"
  },
  "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
  "category": "Developer Tools"
}
```

3. 运行校验：

```bash
npm install --no-audit --no-fund
npm test
npm run validate
```

4. 发布后把 `sha` 固定到完整 commit；不要使用浮动分支（`ref` 只作为人类可读提示，`sha` 优先）。

## 安全说明

- 索引没有签名。`name`、`url`、`path`、`sha` 都是索引方的声明；实际安装的内容取决于对应仓库和 commit。只收录可信来源。
- 插件首次启动可能会下载运行时依赖。`nebula-mcp` 的 launcher 会校验下载文件的 SHA-256，并把日志写到用户缓存目录。
- Codex 会在安装前显示插件来源；请核对仓库、目录和 commit 后再安装。

## License

[MIT](LICENSE)
