# Claude 用量监控 (Claude Usage Monitor)

一个轻量的 Chrome / Edge 扩展,把你的 [Claude.ai](https://claude.ai) 套餐用量直接显示在工具栏图标的角标上,后台自动刷新,不用手动打开设置页面就能随时看到还剩多少额度。

> **提醒:** 本扩展用的是 Claude.ai 的**非官方内部接口**(`/api/organizations/{id}/usage`),并非官方公开 API。如果 Anthropic 改动了这个接口,扩展可能会失效,需要更新代码后才能继续使用。请自行斟酌使用。

## 功能

- 后台每 5 分钟自动查询一次用量。
- 工具栏角标显示各项限额里的最高使用百分比(绿色 `<60%` / 橙色 `60–85%` / 红色 `>85%`)。
- 点击图标弹出详情:当前会话(session)、周限额(weekly),以及各自的重置倒计时。
- 弹窗里有 **Refresh** 按钮,可手动立即刷新。

## 工作原理

扩展借用你浏览器里 claude.ai **现有的登录态**(登录 cookie)来发请求(`credentials: "include"`)。它**不会**存储、读取或上传任何 token、密码或 cookie——只是以你已登录的身份,读取你自己账号的用量数据,和你自己刷新页面时浏览器做的事是一样的。

组织 ID(organization ID)是自动从 `/api/organizations` 获取的,**没有硬编码**任何人的 ID,所以任何账号装上都能用,显示的都是各自账号的数据。

## 安装

1. 下载本仓库(点绿色 **Code** 按钮 → **Download ZIP**),解压。
2. 打开 `chrome://extensions`(Edge 浏览器是 `edge://extensions`)。
3. 打开右上角的**开发者模式 / Developer mode** 开关。
4. 点**加载已解压的扩展程序 / Load unpacked**,选择解压后的文件夹。
5. 点工具栏的拼图图标,把扩展固定(pin)出来。

使用前提:同一个浏览器里**已登录 claude.ai**。如果没登录,角标会显示 `!`,弹窗会提示你去登录。

> Chrome 每次启动可能弹出一条「请停用以开发者模式运行的扩展程序」的黄色提示,这是 Chrome 对所有本地加载扩展的通用警告,不是插件有问题,关掉即可,不影响使用。

## 配置

想改刷新频率,编辑 `background.js` 开头这一行:

```js
const POLL_MINUTES = 5; // 改成你想要的分钟数
```

建议别太小(几分钟就够)。查得太频繁没必要,也更容易引起注意。

## 兼容性

本扩展基于 Pro 套餐开发和测试,接口返回 `five_hour`(当前会话)和 `seven_day`(周限额)等字段。其他套餐类型返回的结构**可能**略有不同。如果你的用量显示不正常,可以查看 `usage` 接口的返回内容,然后调整 `background.js` 里的 `normalize()` 函数。

## 许可证 (License)

MIT — 详见 [LICENSE](LICENSE)。

---

*本项目与 Anthropic 无任何关联,也未获其认可。「Claude」是 Anthropic 的商标。*
