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
- **织图文字可以切换成完整翻译的易读样式**（`readable: on`），不用看缩写——例如显示“短针6”而不是“6 sc”，界面支持的八种语言都可以。
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

## 让 AI 帮你写织图

你不需要学语法也能用这个插件。把 **crochet-weaver-pattern skill** 交给 AI 助手一次，之后给它任何文字织图——书上的、PDF、商品说明，或者你自己的速记——再把它回复的内容贴回笔记就好。

1. **复制 skill。** 设置 → Crochet Weaver → **复制织图 skill**，按下你要的语言（English、繁體中文、简体中文、日本語）。
2. **开一个对话**（Claude、ChatGPT，你习惯用的都可以），把 skill 当作第一条消息粘贴进去。它自成一体，不用另外安装或下载任何东西。
3. **贴上你的织图**并说明你要什么。例如：

    > 这是一只兔子头部的织图，请帮我转成一个 Crochet Weaver 的 `crochet` 代码块，`type: round`，并打开进度工具。
    >
    > R1: 魔术环起 6 短针（6）
    > R2: 每针加针（12）
    > R3:（1 短针、加针）重复一圈（18）
    > R4–R6: 一圈短针（18）
    > R7:（1 短针、减针）重复一圈（12）

4. **把它回复的代码块贴进笔记**，切到阅读或实时预览模式：

    ````markdown
    ```crochet
    ---
    type: round
    tool: on
    id: bunny-head
    ---
    R1: 6 sc in MR
    R2: [inc] x 6
    R3: [sc, inc] x 6
    R4: 18 sc
    R5: 18 sc
    R6: 18 sc
    R7: [sc, dec] x 6
    ```
    ````

5. **动手钩之前先核对。** 图表和行列表都是照 AI 写的内容生成的，所以请用进度面板上的针数对一次原文自己标的 `(N)`。哪一行不对就直接在对话里说——skill 已经告诉 AI 针数怎么算，通常一句“R7 结束应该是 12 针”就会修好。

**用 Claude Code？** 把 [`skills/crochet-weaver-pattern/`](skills/crochet-weaver-pattern/) 放进项目或用户目录的 `.claude/skills/`，之后贴上钩织织图时它会自己加载。

**遇到转不出来的内容**，skill 要求 AI 直接说出来而不是硬猜——例如不支持的针法，或本来就没有图面意义的指示。这些提醒值得看：一张“看起来正常”却少了一针的图，比一句“我没法转”更麻烦。

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
style: radial | japanese | continuous
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

重复使用中括号，写成 `x 6` 或 `rep 6` 都可以：

```crochet
R2: [sc, inc] x 6
R2: [sc, inc] rep 6
```

单独的 `rep` 表示「重复到上一圈的针目用完为止」，不必自己数：

```crochet
R1: mr, ch, sc6, slst
R2: ch, [2 sc, inc] rep, slst
```

`[2 sc, inc]` 每一次会钩入 3 针，R1 有 6 针，所以是 2 次。若无法整除，织图会直接告诉你，而不是自行猜测。

针数可以写在针法名称前面或后面——`6 sc`、`sc6`、`sc 6` 都一样；引拔针可以写成 `sl st`、`slst`、`sl-st` 或 `sl_st`。

每圈开头的起立锁针与结尾的引拔针会画在该圈的接缝处，但都不算进该圈的针数：上一圈钩入的是它们之间的针目。

分组使用小括号，会以同一个针目位置向外展开成扇形——「1 针放 N 针」的加针／贝壳针就是这样写（没有独立的 `2dc-in-1` 之类名称；`(dc, dc)` 或 `(5 dc)` 画出来就是那个织图符号）：

```crochet
R3: (dc, ch, dc), sc, (5 dc)
```

### 蕾丝与花样

蕾丝织图不是数着前一圈钩过去，而是直接说明每一针钩在哪里；Crochet Weaver 就照这个写法读：

```crochet
---
type: round
style: japanese
---
R1: MR, ch 3 (counts as dc), 23 dc in MR,
    sl st to top of beginning ch-3. (24 dc)

R2: ch 1 (does not count as a st),
    sc in same st, ch 1,
    [sc in next dc, ch 1] x23,
    sl st to first sc.
    (24 sc + 24 ch-1 sp = 48 sts)

R3: sl st into next ch-1 sp,
    ch 3, 2 dc in same ch-1 sp,
    sc in next ch-1 sp,
    [3 dc in next ch-1 sp,
     sc in next ch-1 sp] x11,
    sl st to top of beginning ch-3.
    (12 reps, 4 sts per rep)

R4: turn,
    [V2 in next sc, ch 1,
     sc in center dc of next 3-dc shell,
     picot, ch 1] x12,
    sl st to join.
```

| 写法 | 意思 |
| --- | --- |
| `in next dc`／`in next ch-2 sp`／`in next picot` | 下一个該种類的位置，中间的东西自動略过 |
| `in same st`／`in same ch-1 sp` | 上一步用过的同一个位置──钩在那里的针会并成同一个花样 |
| `in center dc of next 7-dc shell` | 下一组 7 長针贝壳的正中央那一针 |
| `5 dc in next ch-2 sp` | 一组五针贝壳，钩入同一个空间，画成扇形 |
| `V2`／`V3` | `(dc, ch 2, dc)`／`(dc, ch 3, dc)` 钩入同一位置，内部自成一个空间 |
| `ch 3 (counts as dc)` | 起始锁针代替一针 |
| `sl st into next ch-1 sp` | 引拔移動到该空间；此时还没钩入任何针 |
| `turn` | 写在最前面：这一圈翻面往反方向钩 |
| `R15-R18: repeat R11-R14.` | 画图前会展开成真正的圈数 |

在 frontmatter 加上 `lace: on`，就会照钩织书印制蕾丝的样子画：不画每一圈的框线、不标圈数，针目也画得更大以衬托镂空。它只改变织图周围画了什么，完全不影响织图本身。

再加 `wholeRounds: 4` 可以让前四圈完整画出、之后才开始只画扇形——中心那几圈花样还在成形，钩织书也是完整画出来的。每一圈与下一圈的距离，默认由该圈自己针目的高度决定——短针的圈靠得近，长长针的圈拉得开——除非织图或设置指定了 `spacing`。加上 `sector: 90`（或 `sector: on`，即 90 度）则**只画整圈的一块扇形，而不是完整的圆**——一圈由十二个相同花样组成时，一块切片就把该说的都说完了，钩织书也是这样印的。整张织图仍然会完整算出，只是从换圈接缝开始画出那一块；落在边界上的花样会整组保留，不会被切一半。

两针之间的连续锁针会形成一个空间，让下一圈钩入，而每一针锁针仍然会画出来、可以数。没有加注的起始锁针，只要该圈接合到它的顶端就算一针──所以照原文写就好，不必补注记。

蕾丝由 `japanese` 与 `continuous` 两种圈织画法绘制，它们会依照每一针钩入的位置来摆放；`radial` 一如既往地平均分布。

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

`style: japanese` 会把环织织图切换成日本钩织书的风格：用一条连续螺旋线绕过每一圈（实际上圈织就是一条连续螺旋，而不是一圈圈独立的封闭圆），在每圈起点缝线处往外跨到下一圈，并在缝线处用红色标注圈数。

加针与减针比照钩织书的画法：它们是**自己那一圈的符号**，和普通针排在同一条带子上。`inc` 是一个 **V**，尖点落在该圈内侧圈线、对齐它所钩入的那一针，两臂张开到该圈外侧圈线，各代表它产生的一针，也就是下一圈要钩入的位置。`dec`（以及 `scNtog`）则是 **∧**：两脚分别落在被并掉的两针上，尖点立在其上方。没有任何东西浮在两圈之间，也没有固定图形：每个符号都依该圈的带宽决定大小，并朝它所属的针目倾斜。它会开到足以跨过所属的那几针，但不会开到失去 V 的形状：在外圈把相隔很远的两针并起来时，符号仍然朝着两者张开，而不会被拉成两条长线。

底层上，每一针都由「上一圈所钩入的针目」决定位置并记录下来：加针的两针共用同一个来源，减针的一针则有两个来源。针目不会被排版改变钩织顺序、不会互相重叠，加减针多出或少掉的空间则由附近的针目分摊。

`style: continuous` 使用同一套排版，但把对应关系直接画出来而不是用书上的符号表示：每一针都保留自己的符号（**包含加针产生的两针**），再从它们画线连到上一圈所钩入的针目。适合用来检查织图，或在还不熟悉书上符号时阅读。

两种样式都不做分组、也不刻意挤压：每一针就直接跟着它所钩入的那一针。写成重复的一圈——例如 `[2 sc, inc] x 6`——之所以能看出六个扇形，是因为那六个加针各自落在它们所钩入的六针正上方，而不是因为织图把它们凑在一起。既没有写重复、也没有加减针的一圈——例如篮子筒身的 `R9: 40 sc`——会完全照抄下面那一圈，因此连续的普通圈会沿着下方加减针留下的位置，往外叠成笔直的放射状直行。

默认的 `style: radial` 保持原本的平均分布画法与原本的 `inc`／`dec` 符号；全局的「圆织图样式」设置可以改变所有织图的默认值。

```crochet
---
type: round
style: japanese
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

- **语言**：跟随 Obsidian，或从八种语言中选择——英文、繁体中文、简体中文、日文、韩文、德文、法文、西班牙文。针法名称与所有消息在八种语言都有翻译；AI 织图撰写参考文档目前为前四种语言。
- **整体大小**：织图的显示倍数。
- **符号线条粗细**：SVG 线条宽度。
- **环织圈距**：同心圆环织／螺旋每圈之间的间距。
- **强调加减针**：用强调色标示 `inc` 与 `dec`。
- **加减针显示颜色**：启用上面的强调时，加针与减针符号所使用的颜色。
- **织图工具当前标记色**：当织图嵌入进度工具时，用于标示当前所在圈／目标针的颜色。
- **默认显示进度工具**：让每张 `crochet` 织图默认嵌入进度工具，可用 `tool: on/off` 单独覆盖。
- **默认显示简码文字**：让每张 `crochet` 织图默认嵌入只读简码文字，可用 `text: on/off` 单独覆盖。
- **面板位置**：嵌入的工具或文字面板的默认位置（右／左／下方），可用 `position:` 单独覆盖。
- **显示背景参考网格**：让每张 `crochet` 织图默认显示圈数／行列参考网格，可用 `grid: on/off` 单独覆盖。
- **圆织图样式**：`standard`（针目平均分布）、`japanese`（连续螺旋圈线、依上一圈决定针目位置、书上的 V／∧ 加减针符号、标注圈数）或 `continuous`（同一套排版，每一针都画出并用线连到上一圈）。
- **网格默认形状**：新建 `crochet-grid` 代码块的默认形状（`polar` 或 `rect`）。
- **网格默认圈数**：放射状网格的默认圈数。
- **网格默认列数**：网格代码块的默认列数／辐条数。
- **网格默认行数**：矩形网格的默认行数。

标注「可单独覆盖」的设置，都能用对应的 frontmatter 键（`scale`、`stroke`、`spacing`、`highlight`、`style`、`tool`、`text`、`position`、`grid`）在单张织图中覆盖。`chartMarkerColor` 仅限全局设置。`crochet-grid` 代码块使用自己的配置键（`shape`、`rounds`、`columns`、`rows`，以及 `scale`／`stroke`／`spacing`）；真实织图上 `grid` 参考网格所用的 `rounds`／`rows`／`columns` 是叠加在该织图自身 frontmatter 之上的，且只能延伸、不会缩小到比真实范围更小。

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

解析器由 `src/pattern/grammar.peggy` 生成至 `src/pattern/parser.ts`。请勿手动编辑生成出来的文件。

### 使用 AI 协助编写织图

AI 助手需要的知识放在 [`skills/crochet-weaver-pattern/`](skills/crochet-weaver-pattern/)——`SKILL.md` 以及 `.zh-TW`、`.zh-CN`、`.ja` 版本。使用流程请见《让 AI 帮你写织图》。修改 SKILL 文件之后请执行 `npm run generate-skill`，让插件内嵌的那份（`src/skill-content.ts`）跟着更新；build、测试与 lint 都会先跑一次，并有测试逐字节比对两者。

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
