import type { Route, Stop } from '@/types'

/**
 * 模拟数据：新加坡国立大学 Kent Ridge 校区 Internal Shuttle Bus 的 A1 / A2 线。
 *
 * - 站点名称和坐标（WGS-84）来自 NUSMods 的 bus-stops.json（源自 NUS NextBus），
 *   https://github.com/nusmodifications/nusmods
 * - 站点顺序按 A1 / A2 的环线走向整理，相邻站间距已核对（均在 100–600 米），上线前请以 NUS 官方线路图为准。
 * - 服务时段、一圈用时是示意值，不是官方时刻。
 * - 线路折线目前是站点之间直线相连，不沿真实道路。
 * 接入真实数据后，这些内容由后台“线路管理”维护。
 */
const A1_STOPS: Stop[] = [
  { id: 'KRB', name: "Kent Ridge Bus Terminal", latitude: 1.294229, longitude: 103.769799 },
  { id: 'LT13', name: "LT 13", latitude: 1.294791, longitude: 103.770550 },
  { id: 'AS5', name: "AS 5", latitude: 1.293474, longitude: 103.771761 },
  { id: 'BIZ2', name: "BIZ 2", latitude: 1.293244, longitude: 103.775144 },
  { id: 'TCOMS-OPP', name: "Opp TCOMS", latitude: 1.293755, longitude: 103.776873 },
  { id: 'PGP', name: "Prince George's Park", latitude: 1.291766, longitude: 103.780361 },
  { id: 'KR-MRT', name: "Kent Ridge MRT", latitude: 1.294885, longitude: 103.784426 },
  { id: 'LT27', name: "LT 27", latitude: 1.297437, longitude: 103.780999 },
  { id: 'UHALL', name: "University Hall", latitude: 1.297274, longitude: 103.778640 },
  { id: 'UHC-OPP', name: "Opp University Health Centre", latitude: 1.298840, longitude: 103.775593 },
  { id: 'YIH', name: "Yusof Ishak House", latitude: 1.298887, longitude: 103.774281 },
  { id: 'CLB', name: "Central Library", latitude: 1.296349, longitude: 103.772205 },
]

const A2_STOPS: Stop[] = [
  { id: 'KRB', name: "Kent Ridge Bus Terminal", latitude: 1.294229, longitude: 103.769799 },
  { id: 'IT', name: "Information Technology", latitude: 1.297266, longitude: 103.772792 },
  { id: 'YIH-OPP', name: "Opp Yusof Ishak House", latitude: 1.298820, longitude: 103.774143 },
  { id: 'MUSEUM', name: "Museum", latitude: 1.301132, longitude: 103.773421 },
  { id: 'UHC', name: "University Health Centre", latitude: 1.298794, longitude: 103.776373 },
  { id: 'UHALL-OPP', name: "Opp University Hall", latitude: 1.297530, longitude: 103.777935 },
  { id: 'S17', name: "S 17", latitude: 1.297491, longitude: 103.780684 },
  { id: 'KR-MRT-OPP', name: "Opp Kent Ridge MRT", latitude: 1.294948, longitude: 103.784548 },
  { id: 'PGPR', name: "Prince George's Park Foyer", latitude: 1.291010, longitude: 103.781048 },
  { id: 'TCOMS', name: "TCOMS", latitude: 1.293755, longitude: 103.776873 },
  { id: 'HSSML-OPP', name: "Opp HSSML", hint: "Opp Hon Sui Sen Memorial Library", latitude: 1.292876, longitude: 103.774976 },
  { id: 'NUSS-OPP', name: "Opp NUSS", latitude: 1.293337, longitude: 103.772473 },
  { id: 'LT13-OPP', name: "Ventus", latitude: 1.295347, longitude: 103.770652 },
]

const loop = (stops: Stop[]) => [...stops, stops[0]].map(({ latitude, longitude }) => ({ latitude, longitude }))

// 示意时段
const WEEKDAY = [{ start: '07:00', end: '23:00' }]

export const MOCK_ROUTES: Route[] = [
  {
    id: 'a1',
    name: 'A1 环线',
    code: 'A1',
    color: '#D2413A',
    status: 'active',
    summary: 'KR 巴士总站 → BIZ2 → PGP → KR MRT → UHall → 中央图书馆',
    loopMinutes: 20,
    serviceWindows: WEEKDAY,
    stops: A1_STOPS,
    path: loop(A1_STOPS),
  },
  {
    id: 'a2',
    name: 'A2 环线',
    code: 'A2',
    color: '#A87400',
    status: 'active',
    summary: 'KR 巴士总站 → IT → 博物馆 → KR MRT → PGPR → TCOMS',
    loopMinutes: 22,
    serviceWindows: WEEKDAY,
    stops: A2_STOPS,
    path: loop(A2_STOPS),
  },
]
