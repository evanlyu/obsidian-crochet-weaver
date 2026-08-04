# Crochet Weaver

**[English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)**

Crochet Weaver 會把文字織圖轉換成 Obsidian 筆記中的鉤針織圖。完全在本機的 Markdown 程式碼區塊中運作，不會發出任何網路請求。

## 功能特色

- 將 `crochet` 程式碼區塊渲染成套用主題的 SVG 織圖。
- 支援平織、同心圓環織、連續螺旋三種佈局。
- 內建常見鉤針符號：鎖針、短針、中長針、長針、長長針、滑針、加針、減針、玉編、爆米花針、以及引上針。
- 支援行／圈層級的 `blo`／`flo` 標記，以及魔術環、鎖針環等起針方式。
- **照原文畫蕾絲花樣**：可直接寫出鉤入位置（`5 dc in next ch-2 sp`、`sc in center dc of next 7-dc shell`）；貝殼針會從來源空間展開，鎖針會沿實際弧線排列，V 針、狗牙針、接合、翻面與來源圈重複都照原文解析。
- 圈號與換圈縫隙會避開針目，同時保留遠離縫隙處的放射狀針目對齊。
- `crochet-tool` 區塊會渲染成可讀的行清單，含針數統計、進度控制，以及每行的針數計數器。
- **可直接把進度工具或唯讀簡碼文字嵌入 `crochet` 織圖旁邊**（`tool: on` / `text: on`），不用再把同一份織圖複製貼上到兩個程式碼區塊。
- **嵌入進度工具時，會在織圖上即時標示目前所在圈與目標針**，顏色可自訂。
- **用 `color <顏色>` 步驟標記換線**，可在行中或整圈換色──織圖會在每次換色的第一針畫一個該顏色的小圓圈（不會把針目本身重新上色），工具／文字面板也會直接寫出「換成 `<顏色>`」。
- **織圖文字可切換成完整翻譯的易讀樣式**（`readable: on`），不用看縮寫──例如顯示「短針6」而不是「6 sc」，介面支援的八種語言都可以。
- **超出筆記寬度的織圖可以拖曳／捲動**，不會被硬擠小──用滑鼠拖曳，或用觸控／觸控板的原生捲動；超出範圍時預設會置中顯示。
- **可以直接在外掛設定頁面複製 AI 織圖撰寫參考文件**，支援四種語言，方便直接貼進 AI 對話請它幫忙轉換或撰寫織圖。
- 所有進度都儲存在本機的外掛資料檔中。
- 完整支援八種介面語言：英文、繁體中文、簡體中文、日文、韓文、德文、法文、西班牙文。

## 快速開始

[`examples/demo.md`](examples/demo.md) 這份筆記把本文提到的每個功能都實際示範了一遍──三種織圖類型、每種針法、行修飾詞、行與行的連接線、錯誤提示、進度工具（含易讀文字樣式與換線標記）、面板位置，以及一份真實織圖轉換範例。

在筆記中加入一個 `crochet` 程式碼區塊：

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

### 織圖 + 進度工具，同一份資料

加上 `tool: on` 就能把互動式進度工具（行清單、針數計數器）直接嵌入織圖旁邊，不需要額外的 `crochet-tool` 區塊：

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

只想在織圖旁看到單純、不需互動的簡碼列表嗎？改用 `text: on`：

```crochet
---
type: round
text: on
---
R1: 6 sc in MR
R2: [sc, inc] x 6
```

如果只想要進度清單、不需要織圖，仍然可以使用獨立的 `crochet-tool` 區塊：

```crochet-tool
---
id: coaster-small
type: round
---
R1: 6 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] x 6, sl st
```

想讓進度在修改織圖文字後仍然保留，請設定明確的 `id`。它必須是 1–80 個 ASCII 英文字母、數字、`_` 或 `-`；省略或無效的 `id` 會退回以區塊內容產生的本機雜湊值，因此修改區塊內容可能會重設進度。

## 讓 AI 幫你寫織圖

你不需要學語法也能用這個外掛。把 **crochet-weaver-pattern skill** 交給 AI 助理一次，之後給它任何文字織圖──書上的、PDF、賣場說明，或你自己的速記──再把它回覆的內容貼回筆記就好。

1. **複製 skill。** 設定 → Crochet Weaver → **複製織圖 skill**，按下你要的語言（English、繁體中文、简体中文、日本語）。
2. **開一個對話**（Claude、ChatGPT，你慣用的都可以），把 skill 當成第一則訊息貼進去。它自成一體，不用另外安裝或下載任何東西。
3. **貼上你的織圖**並說明你要什麼。例如：

    > 這是一隻兔子頭部的織圖，請幫我轉成一個 Crochet Weaver 的 `crochet` 區塊，`type: round`，並打開進度工具。
    >
    > R1: 魔術環起 6 短針（6）
    > R2: 每針加針（12）
    > R3:（1 短針、加針）重複一圈（18）
    > R4–R6: 一圈短針（18）
    > R7:（1 短針、減針）重複一圈（12）

4. **把它回覆的區塊貼進筆記**，切到閱讀或即時預覽模式：

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

5. **動手鉤之前先核對。** 圖表和行列表都是照 AI 寫的內容產生的，所以請用進度面板上的針數對一次原文自己標的 `(N)`。哪一行不對就直接在對話裡說──skill 已經告訴 AI 針數怎麼算，通常講一句「R7 結束應該是 12 針」就會修好。

**用 Claude Code？** 把 [`skills/crochet-weaver-pattern/`](skills/crochet-weaver-pattern/) 放進專案或家目錄的 `.claude/skills/`，之後貼上鉤織織圖時它會自己載入。

**遇到轉不出來的東西**，skill 要求 AI 直接說出來而不是硬猜──例如不支援的針法，或本來就沒有圖面意義的指示。這些提醒值得看：一張「看起來正常」卻少了一針的圖，比一句「我沒辦法轉」更麻煩。

## 織圖語法

### Frontmatter

`crochet` 區塊開頭可以加上一段簡單的 YAML 風格 frontmatter：

```yaml
---
type: flat | round | spiral
id: optional-progress-id
scale: 1.5
stroke: 2
spacing: 40
highlight: on
style: radial | japanese | continuous
lace: on | off
sector: on | degrees
wholeRounds: positive-integer
grid: on | off
rounds: positive-integer
rows: positive-integer
columns: positive-integer
tool: on | off
text: on | off
readable: on | off
position: right | left | below
---
```

有全域設定的選項會預設套用全域值；frontmatter 中有效的值只覆蓋該張織圖，無效值則退回對應全域值。`sector` 這類只有單張織圖才有的顯示選項若無效會被忽略。蕾絲、扇形、背景網格與面板選項會在下方各節說明。

### 行（Row）

行標籤可用兩種寫法：

```crochet
R1: 10 ch
Row 2: sc, hdc, dc
```

支援的行修飾詞：

```crochet
R1: blo, 6 sc in MR
R2: flo, 6 sc in ch ring
```

- `blo`：整行／整圈只挑後半針。
- `flo`：整行／整圈只挑前半針。
- `in MR`：為同心圓環織或螺旋織圖加上魔術環中心起針。
- `in ch ring`：加上鎖針環中心起針。

### 針目

支援的針目名稱（採用美式織圖記號），共 46 種：

| 符號 | 分類 | 說明 |
| --- | --- | --- |
| `ch` | 基本 | 鎖針 |
| `sc` | 基本 | 短針 |
| `hdc` | 基本 | 中長針 |
| `dc` | 基本 | 長針 |
| `tr` | 基本 | 長長針 |
| `dtr` | 基本 | 三卷長針 |
| `sl st` | 基本 | 引拔針 |
| `MR` | 基本 | 魔術環 |
| `picot` | 基本 | 結粒針（鎖 3 目引拔） |
| `rsc` | 基本 | 逆短針／蟹步針 |
| `inc` | 加減針 | 加針（1 針放 2 短針） |
| `dec` | 加減針 | 減針（短針 2 併針簡寫） |
| `sc2tog`、`sc3tog` | 加減針 | 短針 2／3 併針 |
| `hdc2tog`…`hdc5tog` | 加減針 | 中長針 2–5 併針 |
| `dc2tog`…`dc5tog` | 加減針 | 長針 2–5 併針 |
| `fpsc`、`fphdc`、`fpdc`、`fptr` | 引上針 | 表引短針／中長針／長針／長長針 |
| `bpsc`、`bphdc`、`bpdc`、`bptr` | 引上針 | 裡引短針／中長針／長針／長長針 |
| `xhdc`、`xdc`、`xtr` | 交叉針 | 中長針／長針／長長針的 1 目交叉 |
| `hdc2cl`、`hdc3cl`、`hdc5cl` | 玉針／泡芙針 | 中長針 2／3／5 針玉編 |
| `dc2cl`、`dc3cl`、`dc5cl` | 玉針／泡芙針 | 長針 2／3／5 針玉編 |
| `tr2cl`、`tr3cl`、`tr5cl` | 玉針／泡芙針 | 長長針 2／3／5 針玉編 |
| `bobble` | 玉針／泡芙針 | 通用玉編／泡芙針 |
| `popcorn` | 爆米花針 | 長針 5 針爆米花 |
| `hdc popcorn` | 爆米花針 | 中長針 5 針爆米花 |
| `tr popcorn` | 爆米花針 | 長長針 5 針爆米花 |

「1 針放 N 針」的加針／貝殼針沒有獨立名稱——請見下方「群組」範例。

支援數量前綴：

```crochet
R1: 10 ch, 6 sc
```

重複使用中括號，寫成 `x 6` 或 `rep 6` 都可以：

```crochet
R2: [sc, inc] x 6
R2: [sc, inc] rep 6
```

單獨的 `rep` 表示「重複到上一圈的針目用完為止」，不必自己數：

```crochet
R1: mr, ch, sc6, slst
R2: ch, [2 sc, inc] rep, slst
```

`[2 sc, inc]` 每一次會鉤入 3 針，R1 有 6 針，所以是 2 次。若無法整除，織圖會直接告訴你，而不是自行猜測。

針數可以寫在針法名稱前面或後面——`6 sc`、`sc6`、`sc 6` 都一樣；引拔針可以寫成 `sl st`、`slst`、`sl-st` 或 `sl_st`。

每圈開頭的起立鎖針與結尾接合的引拔針都會畫在接縫處；接合引拔針一律算 0。起立鎖針若寫成 `ch 3 (counts as dc)`，或沒有加註但最後接合到它的頂端，就算它所代替的 1 針；`ch 1 (does not count as a st)` 或接合到別處的起立鎖針則算 0。

群組使用小括號，會以同一個針目位置向外展開成扇形——「1 針放 N 針」的加針／貝殼針就是這樣寫（沒有獨立的 `2dc-in-1` 之類名稱；`(dc, dc)` 或 `(5 dc)` 畫出來就是那個織圖符號）：

```crochet
R3: (dc, ch, dc), sc, (5 dc)
```

### 蕾絲與花樣

蕾絲織圖不是數著前一圈鉤過去，而是直接說明每一針鉤在哪裡；Crochet Weaver 就照這個寫法讀：

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

| 寫法 | 意思 |
| --- | --- |
| `in next dc`／`in next ch-2 sp`／`in next picot` | 下一個該種類的位置，中間的東西自動略過 |
| `in same st`／`in same ch-1 sp` | 上一步用過的同一個位置──鉤在那裡的針會併成同一個花樣 |
| `in center dc of next 7-dc shell` | 下一組 7 長針貝殼的正中央那一針 |
| `5 dc in next ch-2 sp` | 一組五針貝殼，鉤入同一個空間，畫成扇形 |
| `V2`／`V3` | `(dc, ch 2, dc)`／`(dc, ch 3, dc)` 鉤入同一位置，內部自成一個空間 |
| `ch 3 (counts as dc)` | 起始鎖針代替一針 |
| `sl st into next ch-1 sp` | 引拔移動到該空間；此時還沒鉤入任何針 |
| `turn` | 寫在最前面：這一圈翻面往反方向鉤 |
| `R15-R18: repeat R11-R14.` | 畫圖前會展開成真正的圈數 |

在 frontmatter 加上 `lace: on`，就會照鉤織書印製蕾絲的樣子畫：不畫每一圈的框線、不標圈數，針目也畫得更大以襯托鏤空。它只改變織圖周圍畫了什麼，完全不影響織圖本身。

再加 `wholeRounds: 4` 可以讓前四圈完整畫出、之後才開始只畫扇形——中心那幾圈花樣還在成形，鉤織書也是完整畫出來的。每一圈與下一圈的距離，預設由該圈自己針目的高度決定——短針的圈靠得近，長長針的圈拉得開——除非織圖或設定指定了 `spacing`。加上 `sector: 90`（或 `sector: on`，即 90 度）則**只畫整圈的一塊扇形，而不是完整的圓**——一圈由十二個相同花樣組成時，一塊切片就把該說的都說完了，鉤織書也是這樣印的。整張織圖仍然會完整算出，只是從換圈接縫開始畫出那一塊；落在邊界上的花樣會整組保留，不會被切一半。

兩針之間的連續鎖針會形成一個空間，讓下一圈鉤入，而每一針鎖針仍然會畫出來、可以數。沒有加註的起始鎖針，只要該圈接合到它的頂端就算一針──所以照原文寫就好，不必補註記。

蕾絲由 `japanese` 與 `continuous` 兩種圈織畫法繪製，它們會依照每一針鉤入的位置來擺放；`radial` 一如既往地平均分布。

### 換色

`color <顏色>` 步驟（CSS 顏色名稱或 `#hex` 色碼）用來標記換線的位置──可以寫在行中間，也可以放在行首／圈首：

```crochet
R6: 8 sc, color white, 8 sc, color black, 8 sc
```

從這個步驟開始，之後的每一針──包含這一行剩下的部分，以及之後所有行──都套用這個顏色，直到下一個 `color` 步驟改變顏色為止；沒有「恢復成無顏色」的寫法。針目符號本身仍維持織圖原本的主題色；織圖上會在每次換成新顏色的第一針畫一個該顏色的小圓圈，進度工具／織圖文字面板也會直接寫出「換成 `<顏色>`」。

## 織圖類型

### 平織（Flat）

`type: flat` 會以來回交替的平織方式排列每一行。

```crochet
---
type: flat
---
R1: 10 ch
R2: 10 sc
R3: 10 dc
```

### 同心圓環織（Round）

`type: round` 會把每一行畫成一個同心圓環。行尾的 `sl st` 會視為併圈，不計入該圈的針數間距計算。

```crochet
---
type: round
---
R1: 6 sc in MR
R2: [sc, inc] x 6, sl st
```

`style: japanese` 會把環織織圖切換成日本鉤織書的風格：用一條連續螺旋線繞過每一圈（實際上圈織就是一條連續螺旋，而不是一圈圈獨立的封閉圓），在每圈起點縫線處往外跨到下一圈，並在縫線處用紅色標示圈數。

加針與減針比照鉤織書的畫法：它們是**自己那一圈的符號**，和普通針排在同一條帶子上。`inc` 是一個 **V**，尖點落在該圈內側圈線的來源針位置，兩臂直接終止在它實際產生的兩個子針位置。`dec`（以及 `scNtog`）則是 **∧**：兩腳朝被併掉的針目傾斜，尖點立在其上方；來源異常寬時會把減針符號收緊，維持可讀性。沒有任何東西浮在兩圈之間，每個端點都持續表達真實的針目來源關係。

底層上，每一針都由「上一圈所鉤入的針目」決定位置並記錄下來：加針的兩針共用同一個來源，減針的一針則有兩個來源。針目不會被排版改變鉤織順序、不會互相重疊，加減針多出或少掉的空間則由附近的針目分攤。

`style: continuous` 使用同一套排版，但把對應關係直接畫出來而不是用書上的符號表示：每一針都保留自己的符號（**包含加針產生的兩針**），再從它們畫線連到上一圈所鉤入的針目。適合用來檢查織圖，或在還不熟悉書上符號時閱讀。

兩種樣式都不做分組、也不刻意擠壓：每一針就直接跟著它所鉤入的那一針。寫成重複的一圈——例如 `[2 sc, inc] x 6`——之所以能看出六個扇形，是因為那六個加針各自落在它們所鉤入的六針正上方，而不是因為織圖把它們湊在一起。既沒有寫重複、也沒有加減針的一圈——例如籃子筒身的 `R9: 40 sc`——會照抄下面那一圈；足夠大的普通圈若需修正圈號縫隙，修正只會在最靠近縫隙的四分之一圈內逐漸消失，對側仍保持精準的放射狀直行。

第一圈鉤入中心環的第一針固定在十二點鐘方向。圈號從其右側開始，每往外一圈再朝十二點鐘方向傾斜半度，形成微微向內收的導線而不是僵硬輻條。縫隙一定會保留接合、換圈階梯、圈號與起立鎖針所需的空間；大的普通圈最多可保留 10px 的額外繼承空間，避免為了關閉縫隙而不必要地把針目拉離來源。

預設的 `style: radial` 維持原本的平均分佈畫法與原本的 `inc`／`dec` 符號；全域的「圓織圖樣式」設定可改變所有織圖的預設值。

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

### 連續螺旋（Spiral）

`type: spiral` 會把所有行沿著同一條連續螺旋線排列。

```crochet
---
type: spiral
---
R1: 6 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] x 6
```

## 空白繪圖網格

`crochet-grid` 會渲染一張空白網格，方便手動草擬新設計——沒有針目、沒有進度追蹤，只有輔助線幾何圖形。

```crochet-grid
shape: polar
rounds: 6
columns: 12
```

- `shape: polar`（預設）會畫出 `rounds` 個同心圓環，以及 `columns` 條等角度分佈的輻條。
- `shape: rect` 則改畫成 `rows` 乘 `columns` 的矩形網格：

  ```crochet-grid
  shape: rect
  rows: 8
  columns: 8
  ```

- `scale`、`stroke`、`spacing` 的行為與 `crochet` 織圖相同；`spacing` 在 `polar` 決定圈距，在 `rect` 決定格距。
- 執行「**插入空白鉤織網格**」指令即可插入一個依你的網格預設值填好的起始區塊。

## 織圖背景參考網格

跟上面獨立的空白網格不同，在「真正的」`crochet` 區塊裡加上 `grid: on`，會在你實際的織圖背後畫出一張淡淡的參考網格，貼合織圖真實的幾何形狀——方便一眼看出「目前織到第幾圈」，尤其是搭配嵌入式進度工具使用時特別有用。

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

- `type: round`／`type: spiral`：每一圈會有一圈參考圓，位置對齊該圈真實的半徑（螺旋織圖沒有真正獨立的圈，所以「第 N 圈」的參考圓是以第 N 行結束時螺旋到達的半徑來近似）。參考輻條預設數量等於最外圈的針數，並以等角度分佈。
- `type: flat`：會畫出貼合織圖真實行高與針寬的行／欄網格——這是一個參考座標，並不保證第一行以外每一針都精準落在網格交叉點上（因為平織每行方向會交替）。
- 預設情況下，網格會自動貼合你目前寫的織圖範圍，不需要額外設定。加上 `rounds:`（環織／螺旋）或 `rows:`（平織）以及／或 `columns:`，可以讓網格延伸到超出目前織圖範圍（例如想預覽這個設計大概還需要幾圈）；這些設定只能讓網格變大，不會縮小到比實際織圖範圍更小。
- 用「**顯示背景參考網格**」設定可以讓所有織圖預設都顯示這個網格。

## 嵌入進度工具或簡碼文字

`crochet` 區塊的 `tool`／`text` frontmatter 鍵（或對應的全域設定）能讓織圖自帶進度面板，讓織圖只需要寫一次：

- `tool: on`——嵌入完整的互動式進度工具（行清單、進度條、依權重增減的每行針數計數器、上一圈／完成本圈／重設整體進度控制）。
- `text: on`——嵌入唯讀的簡碼列表（行標籤、標準化步驟、針數），沒有進度追蹤也沒有按鈕。適合只想在圖片旁看簡碼的情況。
- 若兩者皆為啟用，`tool` 優先（它本來就已經包含 `text` 會顯示的所有內容）。
- `position: right | left | below` 控制面板相對於織圖的位置。`right`（預設）與 `left` 會並排顯示，版面過窄時自動改為上下堆疊；`below` 則一律上下堆疊。

## 進度工具

不論是嵌入式（`tool: on`）還是獨立的 `crochet-tool` 區塊，進度工具都會追蹤兩種層級的進度：

- **行／圈進度**——點選任一行即可跳到該行，或使用上一圈／完成本圈／重設按鈕。分段進度條會顯示已完成的行數。
- **針數計數器**——針對目前這一行，每完成一個書寫單位按一次加號；按鈕會依該單位的針數權重顯示並增加，例如 `inc` 是 `+2`，V 針與貝殼針也會一次增加整個單位的權重。當計數達到該行總針數時會自動完成該行並把計數器歸零。減號會依上一個單位的權重修正誤按，重設按鈕則只清空目前這行的計數，不影響行進度。上一圈、完成本圈、重設整體進度或點選其他行，都會把新目前行的針數計數器歸零。

當進度工具與織圖嵌入在同一個區塊（`tool: on`）時，織圖會即時標示目前的位置：目前這一行會有淡淡的底色，而下一針的確切位置則會有更明顯的標示，兩者都使用「**織圖工具目前標記色**」設定的顏色。獨立的 `crochet-tool` 區塊與 `text: on` 面板因為沒有配對的織圖，所以不會顯示這個標示。

## 設定

開啟外掛設定頁可以調整以下全域預設值：

- **語言**：跟隨 Obsidian，或從八種語言中選擇──英文、繁體中文、簡體中文、日文、韓文、德文、法文、西班牙文。針法名稱與所有訊息在八種語言都有翻譯；AI 織圖撰寫參考文件目前為前四種語言。
- **整體大小**：織圖的顯示倍數。
- **符號線條粗細**：SVG 線條寬度。
- **環織圈距**：同心圓環織／螺旋每圈之間的間距。
- **強調加減針**：用強調色標示 `inc` 與 `dec`。
- **加減針顯示顏色**：啟用上面的強調時，加針與減針符號所使用的顏色。
- **織圖工具目前標記色**：當織圖嵌入進度工具時，用來標示目前所在圈／目標針的顏色。
- **預設顯示進度工具**：讓每張 `crochet` 織圖預設嵌入進度工具，可用 `tool: on/off` 個別覆蓋。
- **預設顯示簡碼文字**：讓每張 `crochet` 織圖預設嵌入唯讀簡碼文字，可用 `text: on/off` 個別覆蓋。
- **織圖文字樣式**：選擇原始簡碼或完整翻譯的易讀針法名稱，可用 `readable: on/off` 個別覆蓋。
- **面板位置**：嵌入的工具或文字面板預設位置（右／左／下方），可用 `position:` 個別覆蓋。
- **顯示背景參考網格**：讓每張 `crochet` 織圖預設顯示圈數／行列參考網格，可用 `grid: on/off` 個別覆蓋。
- **圓織圖樣式**：`radial`（針目平均分佈）、`japanese`（連續螺旋圈線、依上一圈決定針目位置、書上的 V／∧ 加減針符號、標示圈數）或 `continuous`（同一套排版，每一針都畫出並用線連到上一圈）。
- **網格預設形狀**：新建 `crochet-grid` 區塊的預設形狀（`polar` 或 `rect`）。
- **網格預設圈數**：放射狀網格的預設圈數。
- **網格預設欄數**：網格區塊的預設欄數／輻條數。
- **網格預設行數**：矩形網格的預設行數。

標示「可個別覆蓋」的設定，都能用對應的 frontmatter 鍵（`scale`、`stroke`、`spacing`、`highlight`、`style`、`tool`、`text`、`position`、`grid`）在單一織圖中覆蓋。`chartMarkerColor` 僅限全域設定。`crochet-grid` 區塊使用自己的設定鍵（`shape`、`rounds`、`columns`、`rows`，以及 `scale`／`stroke`／`spacing`）；真實織圖上 `grid` 參考網格用的 `rounds`／`rows`／`columns` 是疊加在該織圖自己的 frontmatter 上，且永遠只能延伸、不會縮小其真實範圍。

## 安全限制

Crochet Weaver 會在展開佈局前先驗證解析後的織圖。行數、針數、重複次數、巢狀深度或總渲染針數若過大，會直接以行內錯誤訊息拒絕渲染，避免讓 Obsidian 預覽畫面卡死。

目前限制：

- 最多 200 行
- 單一數量前綴最多 1000
- 最多重複 500 次
- 最多渲染 5000 個針目
- 最大巢狀深度 8 層
- 網格最多 40 圈（`crochet-grid` 區塊與 `crochet` 織圖 `grid: on` 的 `rounds:` 覆蓋皆適用）
- 網格最多 72 欄（適用範圍同上）
- 網格最多 40 行（適用範圍同上）

## 隱私權

Crochet Weaver 完全在 Obsidian 本機執行。

- 沒有遙測。
- 沒有網路請求。
- 不會掃描整個 Vault。
- 只會解析渲染中程式碼區塊的織圖文字。
- 進度（行進度與針數）都儲存在本機的外掛 `data.json` 檔案中。

## 開發

安裝相依套件：

```bash
npm install
```

執行測試：

```bash
npm test
```

建置外掛：

```bash
npm run build
```

檢查程式碼風格：

```bash
npm run lint
```

解析器是由 `src/pattern/grammar.peggy` 產生至 `src/pattern/parser.ts`。請勿手動編輯產生出來的檔案。

### 使用 AI 協助撰寫織圖

AI 助理需要的知識放在 [`skills/crochet-weaver-pattern/`](skills/crochet-weaver-pattern/)──`SKILL.md` 以及 `.zh-TW`、`.zh-CN`、`.ja` 版本。使用流程請見〈讓 AI 幫你寫織圖〉。修改 SKILL 檔之後請執行 `npm run generate-skill`，讓外掛內嵌的那份（`src/skill-content.ts`）跟著更新；build、測試與 lint 都會先跑一次，並有測試逐位元比對兩者。

## 手動安裝

先建置外掛，再把以下檔案複製到你的 Vault 外掛資料夾：

```text
<Vault>/.obsidian/plugins/crochet-weaver/
  manifest.json
  main.js
  styles.css
```

重新載入 Obsidian，並在**設定 → 社群外掛**中啟用 **Crochet Weaver**。

## 發佈流程

1. 將 `manifest.json` 與 `package.json` 更新為相同的 SemVer 版本號。
2. 更新 `versions.json`，讓外掛版本對應到最低所需的 Obsidian 版本。
3. 執行 `npm test`、`npm run build`、`npm run lint`。
4. 建立與 manifest 版本號完全相同（不含開頭 `v`）的 Git tag。
5. 發佈 GitHub Release，並附上 `manifest.json`、`main.js`、`styles.css` 作為附加檔案。
