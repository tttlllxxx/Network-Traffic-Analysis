// 电力资产数据（基于真实目标数据，选择主要80个资产）
export const powerAssets = [
  {
    "id": "ASSET-01",
    "name": "AMI 采集前置与 MDMS",
    "type": "asset",
    "label": "AMI 采集前置与 MDMS",
    "category": "metering"
  },
  {
    "id": "ASSET-02",
    "name": "AMR 手持抄表终端",
    "type": "asset",
    "label": "AMR 手持抄表终端",
    "category": "metering"
  },
  {
    "id": "ASSET-03",
    "name": "FACTS / STATCOM 控制器",
    "type": "asset",
    "label": "FACTS / STATCOM 控制器",
    "category": "control"
  },
  {
    "id": "ASSET-04",
    "name": "GIS 一体化变电站控制平台",
    "type": "asset",
    "label": "GIS 一体化变电站控制平台",
    "category": "transmission"
  },
  {
    "id": "ASSET-05",
    "name": "GIS 设备监控平台",
    "type": "asset",
    "label": "GIS 设备监控平台",
    "category": "control"
  },
  {
    "id": "ASSET-06",
    "name": "HVDC 换流站控制与保护",
    "type": "asset",
    "label": "HVDC 换流站控制与保护",
    "category": "transmission"
  },
  {
    "id": "ASSET-07",
    "name": "IDS / IPS 入侵检测设备",
    "type": "asset",
    "label": "IDS / IPS 入侵检测设备",
    "category": "security"
  },
  {
    "id": "ASSET-08",
    "name": "IEC 61850 SCL 模型库",
    "type": "asset",
    "label": "IEC 61850 SCL 模型库",
    "category": "control"
  },
  {
    "id": "ASSET-09",
    "name": "MPLS 专网与 QoS 策略",
    "type": "asset",
    "label": "MPLS 专网与 QoS 策略",
    "category": "network"
  },
  {
    "id": "ASSET-10",
    "name": "OT 安全监测与 SIEM",
    "type": "asset",
    "label": "OT 安全监测与 SIEM",
    "category": "security"
  },
  {
    "id": "ASSET-11",
    "name": "OT 证书与密钥管理（ CA / KM ）",
    "type": "asset",
    "label": "OT 证书与密钥管理（ CA / KM ）",
    "category": "management"
  },
  {
    "id": "ASSET-12",
    "name": "OT 跳板 / 跳转服务器",
    "type": "asset",
    "label": "OT 跳板 / 跳转服务器",
    "category": "control"
  },
  {
    "id": "ASSET-13",
    "name": "OT 防火墙日志服务器",
    "type": "asset",
    "label": "OT 防火墙日志服务器",
    "category": "security"
  },
  {
    "id": "ASSET-14",
    "name": "PI 接口与数据代理",
    "type": "asset",
    "label": "PI 接口与数据代理",
    "category": "data"
  },
  {
    "id": "ASSET-15",
    "name": "SCADA 主站冗余服务器",
    "type": "asset",
    "label": "SCADA 主站冗余服务器",
    "category": "control"
  },
  {
    "id": "ASSET-16",
    "name": "SCADA 前端采集服务器",
    "type": "asset",
    "label": "SCADA 前端采集服务器",
    "category": "control"
  },
  {
    "id": "ASSET-17",
    "name": "SCADA 前置通信机",
    "type": "asset",
    "label": "SCADA 前置通信机",
    "category": "control"
  },
  {
    "id": "ASSET-18",
    "name": "AMI 集中器/主站",
    "type": "asset",
    "label": "AMI 集中器/主站",
    "category": "metering"
  },
  {
    "id": "ASSET-19",
    "name": "DCS 控制器工程站",
    "type": "asset",
    "label": "DCS 控制器工程站",
    "category": "control"
  },
  {
    "id": "ASSET-20",
    "name": "EMS 历史库/趋势库",
    "type": "asset",
    "label": "EMS 历史库/趋势库",
    "category": "data"
  },
  {
    "id": "ASSET-21",
    "name": "OT/IT 跳板机（堡垒机）",
    "type": "asset",
    "label": "OT/IT 跳板机（堡垒机）",
    "category": "control"
  },
  {
    "id": "ASSET-22",
    "name": "PMU/相量测量网关服务器",
    "type": "asset",
    "label": "PMU/相量测量网关服务器",
    "category": "control"
  },
  {
    "id": "ASSET-23",
    "name": "SCADA 前置机",
    "type": "asset",
    "label": "SCADA 前置机",
    "category": "control"
  },
  {
    "id": "ASSET-24",
    "name": "SCADA 监控大屏",
    "type": "asset",
    "label": "SCADA 监控大屏",
    "category": "control"
  },
  {
    "id": "ASSET-25",
    "name": "SOC/SIEM 安全监测平台",
    "type": "asset",
    "label": "SOC/SIEM 安全监测平台",
    "category": "security"
  },
  {
    "id": "ASSET-26",
    "name": "VPN 汇聚设备/集中器",
    "type": "asset",
    "label": "VPN 汇聚设备/集中器",
    "category": "network"
  },
  {
    "id": "ASSET-27",
    "name": "串口服务器 / 协议转换网关",
    "type": "asset",
    "label": "串口服务器 / 协议转换网关",
    "category": "control"
  },
  {
    "id": "ASSET-28",
    "name": "主变有载调压（ OLTC ）控制单元",
    "type": "asset",
    "label": "主变有载调压（ OLTC ）控制单元",
    "category": "control"
  },
  {
    "id": "ASSET-29",
    "name": "主站 SCADA 数据库",
    "type": "asset",
    "label": "主站 SCADA 数据库",
    "category": "control"
  },
  {
    "id": "ASSET-30",
    "name": "主站与变电站之间通信通道",
    "type": "asset",
    "label": "主站与变电站之间通信通道",
    "category": "transmission"
  },
  {
    "id": "ASSET-31",
    "name": "二次站 RTU",
    "type": "asset",
    "label": "二次站 RTU",
    "category": "control"
  },
  {
    "id": "ASSET-32",
    "name": "云上 SCADA 灾备实例",
    "type": "asset",
    "label": "云上 SCADA 灾备实例",
    "category": "control"
  },
  {
    "id": "ASSET-33",
    "name": "企业办公邮件系统",
    "type": "asset",
    "label": "企业办公邮件系统",
    "category": "control"
  },
  {
    "id": "ASSET-34",
    "name": "低频 / 低电压减载（ UFLS / UVLS ）",
    "type": "asset",
    "label": "低频 / 低电压减载（ UFLS / UVLS ）",
    "category": "control"
  },
  {
    "id": "ASSET-35",
    "name": "供电线路断路器自动控制系统",
    "type": "asset",
    "label": "供电线路断路器自动控制系统",
    "category": "control"
  },
  {
    "id": "ASSET-36",
    "name": "保护继电器管理工作站",
    "type": "asset",
    "label": "保护继电器管理工作站",
    "category": "management"
  },
  {
    "id": "ASSET-37",
    "name": "停电管理系统（ OMS ）",
    "type": "asset",
    "label": "停电管理系统（ OMS ）",
    "category": "management"
  },
  {
    "id": "ASSET-38",
    "name": "储能电池管理系统",
    "type": "asset",
    "label": "储能电池管理系统",
    "category": "management"
  },
  {
    "id": "ASSET-39",
    "name": "储能电站 EMS",
    "type": "asset",
    "label": "储能电站 EMS",
    "category": "management"
  },
  {
    "id": "ASSET-40",
    "name": "储能电站管理系统",
    "type": "asset",
    "label": "储能电站管理系统",
    "category": "management"
  },
  {
    "id": "ASSET-41",
    "name": "储能系统监控平台",
    "type": "asset",
    "label": "储能系统监控平台",
    "category": "control"
  },
  {
    "id": "ASSET-42",
    "name": "储能调度控制系统",
    "type": "asset",
    "label": "储能调度控制系统",
    "category": "control"
  },
  {
    "id": "ASSET-43",
    "name": "光伏电站监控平台",
    "type": "asset",
    "label": "光伏电站监控平台",
    "category": "control"
  },
  {
    "id": "ASSET-44",
    "name": "光伏逆变器控制系统",
    "type": "asset",
    "label": "光伏逆变器控制系统",
    "category": "control"
  },
  {
    "id": "ASSET-45",
    "name": "光伏逆变器群",
    "type": "asset",
    "label": "光伏逆变器群",
    "category": "control"
  },
  {
    "id": "ASSET-46",
    "name": "分布式光伏发电监控系统",
    "type": "asset",
    "label": "分布式光伏发电监控系统",
    "category": "generation"
  },
  {
    "id": "ASSET-47",
    "name": "分布式电源聚合控制平台（DERMS）",
    "type": "asset",
    "label": "分布式电源聚合控制平台（DERMS）",
    "category": "control"
  },
  {
    "id": "ASSET-48",
    "name": "分布式能源接入网关",
    "type": "asset",
    "label": "分布式能源接入网关",
    "category": "control"
  },
  {
    "id": "ASSET-49",
    "name": "分布式能源管理系统",
    "type": "asset",
    "label": "分布式能源管理系统",
    "category": "management"
  },
  {
    "id": "ASSET-50",
    "name": "分布式能源聚合平台（ VPP ）",
    "type": "asset",
    "label": "分布式能源聚合平台（ VPP ）",
    "category": "control"
  },
  {
    "id": "ASSET-51",
    "name": "前置机与遥测集中器",
    "type": "asset",
    "label": "前置机与遥测集中器",
    "category": "control"
  },
  {
    "id": "ASSET-52",
    "name": "区域 EMS 报表模块",
    "type": "asset",
    "label": "区域 EMS 报表模块",
    "category": "management"
  },
  {
    "id": "ASSET-53",
    "name": "区域 SCADA 探针",
    "type": "asset",
    "label": "区域 SCADA 探针",
    "category": "control"
  },
  {
    "id": "ASSET-54",
    "name": "区域 SCADA 终端",
    "type": "asset",
    "label": "区域 SCADA 终端",
    "category": "control"
  },
  {
    "id": "ASSET-55",
    "name": "区域 SCADA 网关",
    "type": "asset",
    "label": "区域 SCADA 网关",
    "category": "control"
  },
  {
    "id": "ASSET-56",
    "name": "区域变电站 SCADA 服务器",
    "type": "asset",
    "label": "区域变电站 SCADA 服务器",
    "category": "transmission"
  },
  {
    "id": "ASSET-57",
    "name": "区域变电站控制器",
    "type": "asset",
    "label": "区域变电站控制器",
    "category": "transmission"
  },
  {
    "id": "ASSET-58",
    "name": "区域变电通信网关",
    "type": "asset",
    "label": "区域变电通信网关",
    "category": "transmission"
  },
  {
    "id": "ASSET-59",
    "name": "区域智能终端 RTU",
    "type": "asset",
    "label": "区域智能终端 RTU",
    "category": "control"
  },
  {
    "id": "ASSET-60",
    "name": "区域电力监控中心",
    "type": "asset",
    "label": "区域电力监控中心",
    "category": "control"
  },
  {
    "id": "ASSET-61",
    "name": "区域电网调度中心",
    "type": "asset",
    "label": "区域电网调度中心",
    "category": "control"
  },
  {
    "id": "ASSET-62",
    "name": "区域电网负荷预测系统",
    "type": "asset",
    "label": "区域电网负荷预测系统",
    "category": "control"
  },
  {
    "id": "ASSET-63",
    "name": "区域监控服务器",
    "type": "asset",
    "label": "区域监控服务器",
    "category": "control"
  },
  {
    "id": "ASSET-64",
    "name": "区域能源数据仓库",
    "type": "asset",
    "label": "区域能源数据仓库",
    "category": "data"
  },
  {
    "id": "ASSET-65",
    "name": "区域能源管理系统 EMS",
    "type": "asset",
    "label": "区域能源管理系统 EMS",
    "category": "management"
  },
  {
    "id": "ASSET-66",
    "name": "区域调度中心",
    "type": "asset",
    "label": "区域调度中心",
    "category": "control"
  },
  {
    "id": "ASSET-67",
    "name": "区域调度历史档案",
    "type": "asset",
    "label": "区域调度历史档案",
    "category": "control"
  },
  {
    "id": "ASSET-68",
    "name": "区域调度员笔记本",
    "type": "asset",
    "label": "区域调度员笔记本",
    "category": "control"
  },
  {
    "id": "ASSET-69",
    "name": "区域调度工作站",
    "type": "asset",
    "label": "区域调度工作站",
    "category": "control"
  },
  {
    "id": "ASSET-70",
    "name": "区域调度负载预测模块",
    "type": "asset",
    "label": "区域调度负载预测模块",
    "category": "control"
  },
  {
    "id": "ASSET-71",
    "name": "区域负荷监测与告警平台",
    "type": "asset",
    "label": "区域负荷监测与告警平台",
    "category": "control"
  },
  {
    "id": "ASSET-72",
    "name": "区域通信服务器",
    "type": "asset",
    "label": "区域通信服务器",
    "category": "network"
  },
  {
    "id": "ASSET-73",
    "name": "区域配电固件仓库",
    "type": "asset",
    "label": "区域配电固件仓库",
    "category": "distribution"
  },
  {
    "id": "ASSET-74",
    "name": "区域配电监控系统",
    "type": "asset",
    "label": "区域配电监控系统",
    "category": "distribution"
  },
  {
    "id": "ASSET-75",
    "name": "区域配电路由器",
    "type": "asset",
    "label": "区域配电路由器",
    "category": "distribution"
  },
  {
    "id": "ASSET-76",
    "name": "卫星与蜂窝备链通信",
    "type": "asset",
    "label": "卫星与蜂窝备链通信",
    "category": "network"
  },
  {
    "id": "ASSET-77",
    "name": "厂商远程支持门户",
    "type": "asset",
    "label": "厂商远程支持门户",
    "category": "control"
  },
  {
    "id": "ASSET-78",
    "name": "厂站 HMI 操作站",
    "type": "asset",
    "label": "厂站 HMI 操作站",
    "category": "control"
  },
  {
    "id": "ASSET-79",
    "name": "厂站 PLC 控制器",
    "type": "asset",
    "label": "厂站 PLC 控制器",
    "category": "control"
  },
  {
    "id": "ASSET-80",
    "name": "厂站 UPS 电源管理系统",
    "type": "asset",
    "label": "厂站 UPS 电源管理系统",
    "category": "management"
  }
]
