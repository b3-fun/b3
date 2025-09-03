---
lang: cn
originalPath: README.md
---
# Mintlify 启动套件

使用启动套件可以部署您的文档并准备进行自定义。

点击此仓库顶部的绿色 **使用此模板** 按钮以复制 Mintlify 启动套件。启动套件包含以下示例：

- 指南页面
- 导航
- 自定义
- API 参考页面
- 使用流行组件

**[遵循完整的快速启动指南](https://starter.mintlify.com/quickstart)**

## 开发

安装 [Mintlify CLI](https://www.npmjs.com/package/mint) 以在本地预览您的文档更改。使用以下命令进行安装：

```
npm i -g mint
```

在您的文档根目录下运行以下命令，您的 `docs.json` 应位于此处：

```
mint dev
```

在 `http://localhost:3000` 查看您的本地预览。

## 发布更改

从您的 [仪表板](https://dashboard.mintlify.com/settings/organization/github-app) 安装我们的 GitHub 应用，以将更改从您的仓库传播到您的部署。更改在推送到默认分支后会自动部署到生产环境。

## 需要帮助？

### 故障排除

- 如果您的开发环境未运行：运行 `mint update` 以确保您拥有 CLI 的最新版本。
- 如果页面作为 404 加载：确保您在包含有效 `docs.json` 的文件夹中运行。

### 资源

- [Mintlify 文档](https://mintlify.com/docs)
- [Mintlify 社区](https://mintlify.com/community)
