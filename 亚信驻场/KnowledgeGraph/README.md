# 针对电力行业的APT组织攻击图谱

这是一个展示针对电力行业的APT（高级持续性威胁）组织攻击知识图谱的可视化项目。

## 项目特点

- **18个APT组织**：包括Sandworm、Dragonfly、Energetic Bear、Lazarus等知名APT组织
- **40种攻击方法**：涵盖PLC逻辑注入、SCADA系统入侵、鱼叉式钓鱼等多种攻击手段
- **55种攻击武器**：包括BlackEnergy、Havex、Industroyer、Stuxnet等恶意软件和工具
- **1000+个攻击剧本**：详细描述APT组织针对电力系统的攻击场景和流程

## 图谱内容

### APT组织（18个）
- Sandworm（俄罗斯）
- Dragonfly（俄罗斯）
- Energetic Bear（俄罗斯）
- Lazarus（朝鲜）
- BlackEnergy（俄罗斯）
- Havex（俄罗斯）
- Xenotime（俄罗斯）
- Triton（俄罗斯）
- Industroyer（俄罗斯）
- RedEcho（中国）
- Volt Typhoon（中国）
- Threat Group 3390（中国）
- Iron Liberty（伊朗）
- Cobalt Trinity（伊朗）
- Shamoon（伊朗）
- Mirage（未知）
- Night Dragon（中国）
- DragonOK（中国）

### 攻击方法（40种）
包括但不限于：
- PLC逻辑注入
- SCADA系统入侵
- 鱼叉式钓鱼
- 水坑攻击
- 供应链攻击
- 零日漏洞利用
- 横向移动
- 权限提升
- 网络嗅探
- 中间人攻击
- 等等...

### 攻击武器（55种）
包括但不限于：
- ICS Payload
- BlackEnergy
- Havex
- Industroyer
- Triton
- Stuxnet
- Flame
- WannaCry
- NotPetya
- Cobalt Strike
- Mimikatz
- 等等...

### 攻击剧本（1000+个）
每个剧本包含：
- 关联的APT组织
- 使用的攻击方法
- 使用的攻击武器
- 攻击目标（发电厂、变电站、SCADA系统等）
- 攻击阶段（侦察、武器化、投递等）
- 严重程度评级

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 技术栈

- **Vue 3** - 前端框架
- **Vite** - 构建工具
- **G6** - 图可视化库
- **JavaScript** - 编程语言

## 项目结构

```
src/
├── components/
│   └── APTGraph.vue      # 图谱可视化组件
├── data/
│   ├── aptOrganizations.js    # APT组织数据
│   ├── attackMethods.js       # 攻击方法数据
│   ├── attackWeapons.js      # 攻击武器数据
│   ├── generateScenarios.js   # 攻击剧本生成器
│   └── graphData.js           # 图谱数据生成器
├── App.vue                # 根组件
└── main.js                # 入口文件
```

## 功能特性

- 交互式图谱可视化
- 节点分类展示（APT组织、攻击方法、攻击武器、攻击剧本）
- 关系连线展示（使用、实现、执行、采用等关系）
- 统计信息展示
- 缩放和平移功能
- 节点点击交互

## 使用说明

1. 安装依赖后运行 `npm run dev`
2. 在浏览器中打开显示的本地地址
3. 使用鼠标滚轮缩放图谱
4. 拖拽节点或画布进行平移
5. 点击节点查看详细信息
