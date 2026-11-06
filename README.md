# 智汇黎安+

校园摆渡车实时位置查询 · 微信小程序（uni-app + Vue 3 + TypeScript）

> 让师生在出门前就知道：车在哪，数据新不新。

当前为 **第一阶段（MVP）小程序端**，对应 PRD V1.0 的 P0 / P1 小程序需求。管理后台（网页端）不在本仓库。

## 快速开始

```bash
npm install
npm run dev:mp-weixin        # 开发模式，使用内置 mock 数据
```

用 **微信开发者工具** 导入 `dist/dev/mp-weixin` 即可预览。没有 AppID 时选“测试号”。

| 命令 | 说明 |
| --- | --- |
| `npm run dev:mp-weixin` | 开发 + 热更新，**mock 数据** |
| `npm run build:mp-weixin` | 正式包，请求真实后端（`.env.production` 里的 `VITE_API_BASE`），mock 代码和数据不会打进包 |
| `npm run build:mp-weixin:mock` | 用 mock 数据打正式包，适合体验版演示 |
| `npm run type-check` | TypeScript 检查 |

## 页面

| 页面 | 路径 | 内容 |
| --- | --- | --- |
| 首页 / 线路列表 | `pages/index/index` | 置顶线路实时卡、全部线路（☆ 置顶）、服务入口 |
| 线路详情 | `pages/route/detail` | 地图 + 车辆位置 + 数据状态 + 站点列表，每 5 秒自动刷新，也可手动刷新 |
| 意见反馈 | `pages/feedback/index` | 问题类型 + 描述 + 最多 3 张截图 + 选填联系方式 |
| 服务说明 | `pages/about/index` | 服务时段、数据状态说明、隐私说明 |

## 首页置顶线路

首页顶部卡片显示哪条线路：

1. **用户手动置顶的线路**：在线路列表点 ☆、点卡片右上角「更换」，或在线路详情页点「置顶到首页」。存在本机，不需要登录（`src/composables/usePinnedRoute.ts`）。
2. 没置顶，或置顶的线路停运或下线：退回到**第一条运营中的线路**，标题显示「默认线路」。

切换置顶时会立即丢弃旧线路的数据，重新拉取，不会出现“标题是 A2、车是 A1”的情况。

## 数据状态（PRD 06）

判断逻辑在 `src/utils/status.ts` 和 `src/composables/useVehicles.ts`：

| 状态 | 条件 | 表现 |
| --- | --- | --- |
| 正常 | 最近定位 ≤ 60 秒 | 车辆正常显示，“X 秒前更新” + 新鲜度进度条 |
| 数据已过期 | > 60 秒无新位置 | 车辆标记置灰，“最后更新于 HH:MM:SS”；本地每秒重新判断，到 60 秒会自动切换 |
| 位置暂不可用 | 设备离线 | 隐藏车辆，线路站点照常显示 |
| 服务异常 | 接口失败 / 断网 | 错误提示 + 重试按钮，**清空车辆，不显示旧位置** |
| 非运营时段 | 后端返回 `operating: false` | “当前非运营时段”，不显示车辆 |

“X 秒前”用服务端时间 `serverTime` 计算，不依赖手机时钟。页面隐藏时停止轮询，回到前台立即重新拉取。

## 地图初始视野

线路详情页打开时的地图中心和缩放级别在 `.env` 里配置（所有模式共用）：

```bash
# 经度,纬度（GCJ-02）。从高德坐标拾取器 https://lbs.amap.com/tools/picker 复制即可
VITE_MAP_CENTER=103.7764,1.2966
# 缩放级别 3–20，校园一般 15–17
VITE_MAP_SCALE=15
```

- 只想改自己本地的，写到 `.env.local`（不进 git）；临时试也可以 `VITE_MAP_CENTER=... npm run dev:mp-weixin`。
- 格式填错时会回退到默认值，并在控制台给出警告。
- 这里只决定地图打开时看哪里，站点坐标在 `src/mock/data.ts`（以后由后台维护）。
- 地图右侧的「⤢」按钮可以缩放到整条线路，「◎」可以定位到车辆。
- 改 env 后需要重新运行 `dev` / `build` 才会生效（编译时注入）。

## Mock 模式

开发模式下页面左下角有 **MOCK** 按钮，可以切换场景：正常运行 / 数据已过期 / 位置暂不可用 / 服务异常 / 非运营时段 / 按真实时钟判断运营时段。

- 模拟数据：`src/mock/data.ts`，为 NUS Kent Ridge 校区 Internal Shuttle Bus 的 **A1（12 站）/ A2（13 站）**。站点名称和坐标来自 [NUSMods](https://github.com/nusmodifications/nusmods) 的 `bus-stops.json`（源自 NUS NextBus）；站点顺序为人工整理，服务时段和一圈用时为示意值。
- 模拟车辆 `A1-01` / `A2-01` 沿各自环线行驶（约 20 / 22 分钟一圈），每 5 秒上报一次。
- 线路折线目前是站点间直线，不沿真实道路。

## 后端接口约定（占位，以技术方案文档为准）

返回格式 `{ code: 0, data, message }`，见 `src/services/api.ts`：

```
GET  /v1/routes                     -> Route[]
GET  /v1/routes/:id                 -> Route
GET  /v1/routes/:id/vehicles        -> { routeId, serverTime, operating, nextServiceAt?, vehicles: [{ vehicleId, latitude, longitude, collectedAt, deviceStatus }] }
POST /v1/feedback/images (multipart) -> { url }
POST /v1/feedback                   -> { id }
```

坐标用 GCJ-02（微信 `<map>` 使用腾讯地图坐标系）。异常坐标（定位漂移）由后端过滤。

## 上线前

- `src/manifest.json` 里填 `mp-weixin.appid`
- 小程序后台配置 request / uploadFile 合法域名
- 本项目不调用定位接口，无需申请位置权限
