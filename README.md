# Codex Marketplace

MuYiYong 的 Codex 插件索引。Codex 通过 `codex plugin marketplace add` 读取本仓库的 `.agents/plugins/marketplace.json`，再从各插件自己的仓库下载并安装。

它与 [MuYiYong/dsh-marketplace](https://github.com/MuYiYong/dsh-marketplace) 并列：同一个插件仓库可以同时被两个 marketplace 收录，插件代码只维护一份。

## 在 Codex 中使用

在支持 Git 插件来源的 Codex 桌面端打开 **插件 → codex-marketplace**，找到 **Nebula MCP** 并安装。已添加本索引的用户不需要再添加一次。运行时需要 Node.js 18+。

也可使用 Codex CLI 0.172.0+ 添加索引并安装：

```bash
# 1. 添加索引仓库
codex plugin marketplace add MuYiYong/codex-marketplace

# 2. 查看可安装插件
codex plugin list

# 3. 安装
codex plugin add nebula-mcp@codex-marketplace
```

安装后重启 Codex，在插件页确认插件已启用。首次启动会联网准备运行时；如果 Codex 提示 MCP 启动超时，等一会儿再开一个对话，必要时重新打开 Codex。

在 **Nebula MCP** 插件中选择「配置悦数连接（打开本机浏览器）」，或在对话中说「配置悦数连接」。在默认浏览器打开的临时本机页填写地址、用户名和密码，点 **测试并保存**，成功后回 Codex 查询。不用运行安装器，也不用把连接参数发到对话里。设置只保存在本机，重启和升级后继续使用。更多信息见 [Nebula MCP 配置说明](https://github.com/MuYiYong/nebula-mcp#配置连接)。

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
| `nebula-mcp` | [MuYiYong/nebula-mcp](https://github.com/MuYiYong/nebula-mcp) | `plugins/nebula-mcp` | 在 Codex 中连接悦数图数据库（NebulaGraph 5.x），执行只读 GQL 并展示图、表格、图表与解释。首次启动自动准备运行时；从 Codex 打开本机浏览器配置连接；设置保留在本机。 |

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
