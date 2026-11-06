import type { Route } from '@/types'

/**
 * 模拟数据：线路、站点都是示意，坐标放在黎安附近，方便地图上看效果。
 * 接入真实数据后，这些内容由后台“线路管理”维护，与车队运营信息保持一致。
 */
const stops = [
  { id: 's1', name: '学生公寓', hint: '公寓区 3 号楼前', latitude: 18.418, longitude: 110.042 },
  { id: 's2', name: '第一食堂', hint: '食堂东侧', latitude: 18.4183, longitude: 110.0456 },
  { id: 's3', name: '图书馆', hint: '图书馆正门广场', latitude: 18.4178, longitude: 110.0493 },
  { id: 's4', name: '公共教学楼', hint: 'A 栋南侧', latitude: 18.4147, longitude: 110.0506 },
  { id: 's5', name: '实验楼', hint: '实验楼西门', latitude: 18.4114, longitude: 110.0497 },
  { id: 's6', name: '体育中心', hint: '体育馆北侧', latitude: 18.4107, longitude: 110.0452 },
  { id: 's7', name: '行政楼', hint: '行政楼停车场', latitude: 18.4121, longitude: 110.0417 },
  { id: 's8', name: '南门', hint: '南门岗亭旁', latitude: 18.4149, longitude: 110.0409 },
]

export const MOCK_ROUTES: Route[] = [
  {
    id: 'r1',
    name: '校园环线',
    code: '1',
    color: '#0E7C6B',
    status: 'active',
    summary: '环绕教学区与生活区，单向循环',
    loopMinutes: 18,
    serviceWindows: [
      { start: '06:50', end: '12:30' },
      { start: '13:30', end: '22:30' },
    ],
    stops,
    path: [...stops.map(({ latitude, longitude }) => ({ latitude, longitude })), { latitude: stops[0].latitude, longitude: stops[0].longitude }],
  },
  {
    id: 'r2',
    name: '园区通勤线',
    code: '2',
    color: '#7C5CDB',
    status: 'planned',
    summary: '连接校区与园区公寓，第二阶段开通',
    serviceWindows: [],
    stops: [],
    path: [],
  },
]
