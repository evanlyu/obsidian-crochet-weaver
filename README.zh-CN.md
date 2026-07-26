# Crochet Weaver

**[English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)**

Crochet Weaver 会把文字织图转换成 Obsidian 笔记中的钩针织图。完全在本机的 Markdown 代码块中运行，不会发出任何网络请求。

## 功能特色

- 将 `crochet` 代码块渲染成带主题样式的 SVG 织图。
- 支持平织、同心圆环织、连续螺旋三种布局。
- 内置常见钩针符号：锁针、短针、中长针、长针、长长针、滑针、加针、减针、枣针、爆米花针，以及引拔立体针。
- 支持行／圈级别的 `blo`／`flo` 标记，以及魔术环、锁针环等起针方式。
- 在同心圆环织图上，于下一圈的第一针显示可自定义颜色的记号。
- `crochet-tool` 代码块会渲染成可读的行清单，包含针数统计、进度控制，以及每行的针数计数器。
- **可以直接把进度工具或只读简码文字嵌入到 `crochet` 织图旁边**（`tool: on` / `text: on`），不用再把同一份织图复制到两个代码块中。
- **嵌入进度工具时，会在织图上实时标示当前所在圈与目标针**，颜色可自定义。
- **用 `color <颜色>` 步骤标记换线**，可以在行中间或整圈换色——织图会在每次换色的第一针画一个该颜色的小圆圈（不会把针目本身重新上色），进度工具／文字面板也会直接写出“换成 `<颜色>`”。
- **织图文字可以切换成完整翻译的易读样式**（`readable: on`），不用看缩写——例如显示“短针6”而不是“6 sc”，支持全部四种语言。
- **超出笔记宽度的织图可以拖拽／滚动**，不会被强行压缩——用鼠标拖拽，或使用触控／触控板的原生滚动；超出范围时默认居中显示。
- **可以直接在插件设置页面复制 AI 织图撰写参考文档**，支持四种语言，方便直接粘贴进 AI 对话请它帮忙转换或撰写织图。
- 所有进度都存储在本机的插件数据文件中。
- 完整多语言界面：英文、繁体中文、简体中文、日文。

## 快速开始

[`examples/demo.md`](examples/demo.md) 这份笔记把本文提到的每个功能都实际演示了一遍——三种织图类型、每种针法、行修饰符、行与行的连接线、错误提示、进度工具（含易读文字样式与换线标记）、面板位置，以及一份真实织图转换示例。

在笔记中添加一个 `crochet` 代码块：

```crochet
---
type: round
scale: 1.25
highlight: on
---
R1: 6 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] x 6, sl st
```

### 织图 + 进度工具，同一份数据

加上 `tool: on` 就能把交互式进度工具（行清单、针数计数器）直接嵌入织图旁边，不需要额外的 `crochet-tool` 代码块：

```crochet
---
id: coaster-small
type: round
tool: on
---
R1: 6 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] x 6, sl st
```

只想在织图旁看到简单、无需交互的简码列表？改用 `text: on`：

```crochet
---
type: round
text: on
---
R1: 6 sc in MR
R2: [sc, inc] x 6
```

如果只需要进度清单、不需要织图，仍然可以使用独立的 `crochet-tool` 代码块：

```crochet-tool
---
id: coaster-small
type: round
---
R1: 6 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] x 6, sl st
```

想让进度在修改织图文字后依然保留，请设置明确的 `id`。若省略 `id`，Crochet Weaver 会用代码块内容生成本机哈希值，因此修改代码块内容可能会重置进度。

## 织图语法

### Frontmatter

`crochet` 代码块开头可以加一段简单的 YAML 风格 frontmatter：

```yaml
---
type: flat | round | spiral
id: optional-progress-id
scale: 1.5
stroke: 2
spacing: 40
highlight: on
rotation: smart | all | none
style: standard | book | linked
tool: on | off
text: on | off
position: right | left | below
---
```

默认会应用全局插件设置。frontmatter 中有效的数值会覆盖该张织图的设置；无效的数值则会回退到全局设置。`tool`、`text`、`position` 同样有各自的全局默认值可以覆盖（见〈设置〉）。

### 行（Row）

行标签可以使用两种写法：

```crochet
R1: 10 ch
Row 2: sc, hdc, dc
```

支持的行修饰词：

```crochet
R1: blo, 6 sc in MR
R2: flo, 6 sc in ch ring
```

- `blo`：整行／整圈只挑后半针。
- `flo`：整行／整圈只挑前半针。
- `in MR`：为同心圆环织或螺旋织图添加魔术环中心起针。
- `in ch ring`：添加锁针环中心起针。

### 针目

支持的针目名称（采用美式织图记号），共 46 种：

| 符号 | 分类 | 说明 |
| --- | --- | --- |
| `ch` | 基本 | 锁针 |
| `sc` | 基本 | 短针 |
| `hdc` | 基本 | 中长针 |
| `dc` | 基本 | 长针 |
| `tr` | 基本 | 长长针 |
| `dtr` | 基本 | 三卷长针 |
| `sl st` | 基本 | 引拔针 |
| `MR` | 基本 | 魔术环 |
| `picot` | 基本 | 结粒针（锁 3 针引拔） |
| `rsc` | 基本 | 逆短针／蟹步针 |
| `inc` | 加减针 | 加针（1 针放 2 短针） |
| `dec` | 加减针 | 减针（短针 2 并针简写） |
| `sc2tog`、`sc3tog` | 加减针 | 短针 2／3 并针 |
| `hdc2tog`…`hdc5tog` | 加减针 | 中长针 2–5 并针 |
| `dc2tog`…`dc5tog` | 加减针 | 长针 2–5 并针 |
| `fpsc`、`fphdc`、`fpdc`、`fptr` | 引上针 | 外钩短针／中长针／长针／长长针 |
| `bpsc`、`bphdc`、`bpdc`、`bptr` | 引上针 | 内钩短针／中长针／长针／长长针 |
| `xhdc`、`xdc`、`xtr` | 交叉针 | 中长针／长针／长长针的 1 针交叉 |
| `hdc2cl`、`hdc3cl`、`hdc5cl` | 枣针／泡芙针 | 中长针 2／3／5 针枣针 |
| `dc2cl`、`dc3cl`、`dc5cl` | 枣针／泡芙针 | 长针 2／3／5 针枣针 |
| `tr2cl`、`tr3cl`、`tr5cl` | 枣针／泡芙针 | 长长针 2／3／5 针枣针 |
| `bobble` | 枣针／泡芙针 | 通用枣针／泡芙针 |
| `popcorn` | 爆米花针 | 长针 5 针爆米花 |
| `hdc popcorn` | 爆米花针 | 中长针 5 针爆米花 |
| `tr popcorn` | 爆米花针 | 长长针 5 针爆米花 |

「1 针放 N 针」的加针／贝壳针没有独立名称——请见下方「分组」示例。

支持数量前缀：

```crochet
R1: 10 ch, 6 sc
```

重复使用中括号：

```crochet
R2: [sc, inc] x 6
```

分组使用小括号，会以同一个针目位置向外展开成扇形——「1 针放 N 针」的加针／贝壳针就是这样写（没有独立的 `2dc-in-1` 之类名称；`(dc, dc)` 或 `(5 dc)` 画出来就是那个织图符号）：

```crochet
R3: (dc, ch, dc), sc, (5 dc)
```

## 织图类型

### 平织（Flat）

`type: flat` 会以来回交替的平织方式排列每一行。

```crochet
---
type: flat
---
R1: 10 ch
R2: 10 sc
R3: 10 dc
```

### 同心圆环织（Round）

`type: round` 会把每一行画成一个同心圆环。行尾的 `sl st` 会被视为并圈，不计入该圈的针数间距计算。

```crochet
---
type: round
---
R1: 6 sc in MR
R2: [sc, inc] x 6, sl st
```

`style: book` 会把环织织图切换成日本钩织书的风格：用一条连续螺旋线绕过每一圈（实际上圈织就是一条连续螺旋，而不是一圈圈独立的封闭圆），在每圈起点缝线处往外跨到下一圈，并在缝线处用红色标注圈数。

加针与减针比照钩织书的画法：它们是**自己那一圈的符号**，和普通针排在同一条带子上。`inc` 是一个 **V**，尖点落在该圈内侧圈线、对齐它所钩入的那一针，两臂张开到该圈外侧圈线，各代表它产生的一针，也就是下一圈要钩入的位置。`dec`（以及 `scNtog`）则是 **∧**：两脚分别落在被并掉的两针上，尖点立在其上方。没有任何东西浮在两圈之间，也没有固定图形——每个符号都依照该圈的带宽与相关针目的实际角度拉伸而成，因此缩放后仍然正确，也会随实际间距倾斜或开合。

底层上，每一针都由「上一圈所钩入的针目」决定位置并记录下来：加针的两针共用同一个来源，减针的一针则有两个来源。针目不会被排版改变钩织顺序、不会互相重叠，加减针多出或少掉的空间则由附近的针目分摊。

`style: linked` 使用同一套排版，但把对应关系直接画出来而不是用书上的符号表示：每一针都保留自己的符号（**包含加针产生的两针**），再从它们画线连到上一圈所钩入的针目。适合用来检查织图，或在还不熟悉书上符号时阅读。

默认的 `style: standard` 保持原本的平均分布画法与原本的 `inc`／`dec` 符号；全局的「圆织图样式」设置可以改变所有织图的默认值。

```crochet
---
type: round
style: book
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
```

### 连续螺旋（Spiral）

`type: spiral` 会把所有行沿同一条连续螺旋线排列。

```crochet
---
type: spiral
---
R1: 6 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] x 6
```

## 空白绘图网格

`crochet-grid` 会渲染一张空白网格，方便手动起草新设计——没有针目、没有进度跟踪，只有辅助线几何图形。

```crochet-grid
shape: polar
rounds: 6
columns: 12
```

- `shape: polar`（默认）会画出 `rounds` 个同心圆环，以及 `columns` 条等角度分布的辐条。
- `shape: rect` 则改画成 `rows` 乘 `columns` 的矩形网格：

  ```crochet-grid
  shape: rect
  rows: 8
  columns: 8
  ```

- `scale`、`stroke`、`spacing` 的行为与 `crochet` 织图相同；`spacing` 在 `polar` 下决定圈距，在 `rect` 下决定格距。
- 执行「**插入空白钩织网格**」命令即可插入一个按你的网格默认值预填的起始代码块。

## 织图背景参考网格

和上面独立的空白网格不同，在「真正的」`crochet` 代码块里加上 `grid: on`，会在你实际的织图背后画出一张淡淡的参考网格，贴合织图真实的几何形状——方便一眼看出「目前织到第几圈」，尤其是搭配嵌入式进度工具使用时特别有用。

```crochet
---
type: round
grid: on
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6, sl st
```

- `type: round`／`type: spiral`：每一圈都有一圈参考圆，位置对齐该圈真实的半径（螺旋织图没有真正独立的圈，因此「第 N 圈」的参考圆是用第 N 行结束时螺旋所到达的半径来近似）。参考辐条默认数量等于最外圈的针数，并按等角度分布。
- `type: flat`：会画出贴合织图真实行高与针宽的行／列网格——这是一个参考坐标系，并不保证第一行之外的每一针都精确落在网格交点上（因为平织每行方向会交替）。
- 默认情况下，网格会自动贴合你当前写的织图范围，不需要额外配置。加上 `rounds:`（环织／螺旋）或 `rows:`（平织）以及／或 `columns:`，可以让网格延伸到超出当前织图范围（例如想预览这个设计大概还需要多少圈）；这些设置只能让网格变大，不会缩小到比实际织图范围更小。
- 用「**显示背景参考网格**」设置可以让所有织图默认都显示这个网格。

## 嵌入进度工具或简码文字

`crochet` 代码块的 `tool`／`text` frontmatter 键（或对应的全局设置）能让织图自带进度面板，让织图只需要写一次：

- `tool: on`——嵌入完整的交互式进度工具（行清单、进度条、每行的针数计数器，含 `+1`／`−1`／重置，以及上一圈／完成本圈／重置整体进度控制）。
- `text: on`——嵌入只读的简码列表（行标签、标准化步骤、针数），没有进度跟踪也没有按钮。适合只想在图片旁看简码的情况。
- 若两者都启用，`tool` 优先（它本身就已包含 `text` 会显示的全部内容）。
- `position: right | left | below` 控制面板相对于织图的位置。`right`（默认）与 `left` 会并排显示，版面过窄时会自动改为上下堆叠；`below` 则始终上下堆叠。

## 进度工具

无论是嵌入式（`tool: on`）还是独立的 `crochet-tool` 代码块，进度工具都会跟踪两种粒度的进度：

- **行／圈进度**——点击任意一行即可跳转到该行，或使用上一圈／完成本圈／重置按钮。分段进度条会显示已完成的行数。
- **针数计数器**——针对当前这一行，每完成一针就点击一次 `+1`。当计数达到该行总针数时会自动完成该行并将计数器归零，因此可以连续点击 `+1`，一路跨越行与行之间的边界。`−1` 用于修正误点，重置按钮则只清空当前行的计数，不影响行进度。点击上一圈、完成本圈、重置整体进度，或点击其他行，都会把新的当前行的针数计数器归零。

当进度工具与织图嵌入在同一个代码块（`tool: on`）中时，织图会实时标示当前位置：当前这一行会带有淡淡的底色，下一针的确切位置则会有更明显的标示，两者都使用「**织图工具当前标记色**」设置中的颜色。独立的 `crochet-tool` 代码块与 `text: on` 面板由于没有配对的织图，因此不会显示此标示。

## 设置

打开插件设置页可以调整以下全局默认值：

- **语言**：跟随 Obsidian，或选择英文、繁体中文、简体中文、日文。
- **整体大小**：织图的显示倍数。
- **符号线条粗细**：SVG 线条宽度。
- **环织圈距**：同心圆环织／螺旋每圈之间的间距。
- **强调加减针**：用强调色标示 `inc` 与 `dec`。
- **织图工具当前标记色**：当织图嵌入进度工具时，用于标示当前所在圈／目标针的颜色。
- **默认显示进度工具**：让每张 `crochet` 织图默认嵌入进度工具，可用 `tool: on/off` 单独覆盖。
- **默认显示简码文字**：让每张 `crochet` 织图默认嵌入只读简码文字，可用 `text: on/off` 单独覆盖。
- **面板位置**：嵌入的工具或文字面板的默认位置（右／左／下方），可用 `position:` 单独覆盖。
- **显示背景参考网格**：让每张 `crochet` 织图默认显示圈数／行列参考网格，可用 `grid: on/off` 单独覆盖。
- **环织符号旋转**：同心圆环织／螺旋图中符号的旋转方式（`smart`、`all`、或 `none`）。
- **圆织图样式**：`standard`（针目平均分布）、`book`（连续螺旋圈线、依上一圈决定针目位置、书上的 V／∧ 加减针符号、标注圈数）或 `linked`（同一套排版，每一针都画出并用线连到上一圈）。
- **网格默认形状**：新建 `crochet-grid` 代码块的默认形状（`polar` 或 `rect`）。
- **网格默认圈数**：放射状网格的默认圈数。
- **网格默认列数**：网格代码块的默认列数／辐条数。
- **网格默认行数**：矩形网格的默认行数。

标注「可单独覆盖」的设置，都能用对应的 frontmatter 键（`scale`、`stroke`、`spacing`、`highlight`、`rotation`、`style`、`tool`、`text`、`position`、`grid`）在单张织图中覆盖。`chartMarkerColor` 仅限全局设置。`crochet-grid` 代码块使用自己的配置键（`shape`、`rounds`、`columns`、`rows`，以及 `scale`／`stroke`／`spacing`）；真实织图上 `grid` 参考网格所用的 `rounds`／`rows`／`columns` 是叠加在该织图自身 frontmatter 之上的，且只能延伸、不会缩小到比真实范围更小。

## 安全限制

Crochet Weaver 会在展开布局之前先验证解析后的织图。行数、针数、重复次数、嵌套深度或总渲染针数如果过大，会直接以行内错误提示拒绝渲染，避免让 Obsidian 预览界面卡死。

当前限制：

- 最多 200 行
- 单个数量前缀最多 1000
- 最多重复 500 次
- 最多渲染 5000 个针目
- 最大嵌套深度 8 层
- 网格最多 40 圈（`crochet-grid` 代码块与 `crochet` 织图 `grid: on` 的 `rounds:` 覆盖均适用）
- 网格最多 72 列（适用范围同上）
- 网格最多 40 行（适用范围同上）

## 隐私

Crochet Weaver 完全在 Obsidian 本机运行。

- 没有遥测。
- 没有网络请求。
- 不会扫描整个 Vault。
- 只会解析渲染中代码块里的织图文字。
- 进度（行进度与针数）都存储在本机的插件 `data.json` 文件中。

## 开发

安装依赖：

```bash
npm install
```

运行测试：

```bash
npm test
```

构建插件：

```bash
npm run build
```

检查代码风格：

```bash
npm run lint
```

解析器由 `src/grammar.peggy` 生成至 `src/parser.ts`。请勿手动编辑 `src/parser.ts`。

### 使用 AI 协助编写织图

如果你想请 AI 助手帮忙把织图转换成 Crochet Weaver 语法，可以参考 [`docs/ai-pattern-authoring.zh-CN.md`](docs/ai-pattern-authoring.zh-CN.md)——一份专为此用途编写、可独立使用的语法参考文档，也提供 [English](docs/ai-pattern-authoring.md)、[繁體中文](docs/ai-pattern-authoring.zh-TW.md)、[日本語](docs/ai-pattern-authoring.ja.md) 版本。也可以直接在插件设置页面复制这份文档的内容（设置 →“复制提供给 AI 的说明”）。也提供现成的 Claude Code skill：[`.claude/skills/crochet-weaver-pattern/`](.claude/skills/crochet-weaver-pattern/)。

## 手动安装

先构建插件，再把以下文件复制到你的 Vault 插件文件夹：

```text
<Vault>/.obsidian/plugins/crochet-weaver/
  manifest.json
  main.js
  styles.css
```

重新加载 Obsidian，并在**设置 → 第三方插件**中启用 **Crochet Weaver**。

## 发布流程

1. 将 `manifest.json` 与 `package.json` 更新为相同的 SemVer 版本号。
2. 更新 `versions.json`，让插件版本对应到所需的最低 Obsidian 版本。
3. 运行 `npm test`、`npm run build`、`npm run lint`。
4. 创建与 manifest 版本号完全一致（不含开头 `v`）的 Git tag。
5. 发布 GitHub Release，并附上 `manifest.json`、`main.js`、`styles.css` 作为附加文件。
