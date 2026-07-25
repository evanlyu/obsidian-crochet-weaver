# Crochet Weaver

**[English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)**

Crochet Weaver 會把文字織圖轉換成 Obsidian 筆記中的鉤針織圖。完全在本機的 Markdown 程式碼區塊中運作，不會發出任何網路請求。

## 功能特色

- 將 `crochet` 程式碼區塊渲染成套用主題的 SVG 織圖。
- 支援平織、同心圓環織、連續螺旋三種佈局。
- 內建常見鉤針符號：鎖針、短針、中長針、長針、長長針、滑針、加針、減針、玉編、爆米花針、以及引上針。
- 支援行／圈層級的 `blo`／`flo` 標記，以及魔術環、鎖針環等起針方式。
- 在同心圓環織圖上，於下一圈的第一針顯示可自訂顏色的記號。
- `crochet-tool` 區塊會渲染成可讀的行清單，含針數統計、進度控制，以及每行的針數計數器。
- **可直接把進度工具或唯讀簡碼文字嵌入 `crochet` 織圖旁邊**（`tool: on` / `text: on`），不用再把同一份織圖複製貼上到兩個程式碼區塊。
- **嵌入進度工具時，會在織圖上即時標示目前所在圈與目標針**，顏色可自訂。
- **用 `color <顏色>` 步驟標記換線**，可在行中或整圈換色──織圖會在每次換色的第一針畫一個該顏色的小圓圈（不會把針目本身重新上色），工具／文字面板也會直接寫出「換成 `<顏色>`」。
- **織圖文字可切換成完整翻譯的易讀樣式**（`readable: on`），不用看縮寫──例如顯示「短針6」而不是「6 sc」，支援所有四種語言。
- **超出筆記寬度的織圖可以拖曳／捲動**，不會被硬擠小──用滑鼠拖曳，或用觸控／觸控板的原生捲動；超出範圍時預設會置中顯示。
- **可以直接在外掛設定頁面複製 AI 織圖撰寫參考文件**，支援四種語言，方便直接貼進 AI 對話請它幫忙轉換或撰寫織圖。
- 所有進度都儲存在本機的外掛資料檔中。
- 完整多語系介面：英文、繁體中文、簡體中文、日文。

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

想讓進度在修改織圖文字後仍然保留，請設定明確的 `id`。若省略 `id`，Crochet Weaver 會用區塊內容產生本機雜湊值，因此修改區塊內容可能會重設進度。

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
rotation: smart | all | none
style: standard | book
tool: on | off
text: on | off
position: right | left | below
---
```

預設會套用全域外掛設定。frontmatter 中有效的數值會覆蓋該張織圖的設定；無效的數值則會退回全域設定。`tool`、`text`、`position` 同樣有各自的全域預設值可覆蓋（見〈設定〉）。

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

重複使用中括號：

```crochet
R2: [sc, inc] x 6
```

群組使用小括號，會以同一個針目位置向外展開成扇形——「1 針放 N 針」的加針／貝殼針就是這樣寫（沒有獨立的 `2dc-in-1` 之類名稱；`(dc, dc)` 或 `(5 dc)` 畫出來就是那個織圖符號）：

```crochet
R3: (dc, ch, dc), sc, (5 dc)
```

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

`style: book` 會把環織織圖切換成日本鉤織書的風格：用一條連續螺旋線繞過每一圈（實際上圈織就是一條連續螺旋，而不是一圈圈獨立的封閉圓），在每圈起點縫線處往外跨到下一圈；每一針對齊上一圈所鉤入的針目（加針從母針展開、減針收合），加針／減針符號本身會拉寬成書上那種 V／∧ 形狀連到對應的針目，並在縫線處用紅色標示圈數。預設的 `style: standard` 維持原本的平均分佈畫法；全域的「圓織圖樣式」設定可改變所有織圖的預設值。

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

- `tool: on`——嵌入完整的互動式進度工具（行清單、進度條、每行的針數計數器含 `+1`／`−1`／重設、上一圈／完成本圈／重設整體進度控制）。
- `text: on`——嵌入唯讀的簡碼列表（行標籤、標準化步驟、針數），沒有進度追蹤也沒有按鈕。適合只想在圖片旁看簡碼的情況。
- 若兩者皆為啟用，`tool` 優先（它本來就已經包含 `text` 會顯示的所有內容）。
- `position: right | left | below` 控制面板相對於織圖的位置。`right`（預設）與 `left` 會並排顯示，版面過窄時自動改為上下堆疊；`below` 則一律上下堆疊。

## 進度工具

不論是嵌入式（`tool: on`）還是獨立的 `crochet-tool` 區塊，進度工具都會追蹤兩種層級的進度：

- **行／圈進度**——點選任一行即可跳到該行，或使用上一圈／完成本圈／重設按鈕。分段進度條會顯示已完成的行數。
- **針數計數器**——針對目前這一行，每完成一針就按一次 `+1`。當計數達到該行總針數時會自動完成該行並把計數器歸零，因此可以連續按 `+1` 一路跨越行與行之間的邊界。`−1` 可修正誤按，重設按鈕則能只清空目前這行的計數，不影響行進度。上一圈、完成本圈、重設整體進度、或點選其他行，都會把新的目前行的針數計數器歸零。

當進度工具與織圖嵌入在同一個區塊（`tool: on`）時，織圖會即時標示目前的位置：目前這一行會有淡淡的底色，而下一針的確切位置則會有更明顯的標示，兩者都使用「**織圖工具目前標記色**」設定的顏色。獨立的 `crochet-tool` 區塊與 `text: on` 面板因為沒有配對的織圖，所以不會顯示這個標示。

## 設定

開啟外掛設定頁可以調整以下全域預設值：

- **語言**：跟隨 Obsidian，或選擇英文、繁體中文、簡體中文、日文。
- **整體大小**：織圖的顯示倍數。
- **符號線條粗細**：SVG 線條寬度。
- **環織圈距**：同心圓環織／螺旋每圈之間的間距。
- **強調加減針**：用強調色標示 `inc` 與 `dec`。
- **織圖工具目前標記色**：當織圖嵌入進度工具時，用來標示目前所在圈／目標針的顏色。
- **預設顯示進度工具**：讓每張 `crochet` 織圖預設嵌入進度工具，可用 `tool: on/off` 個別覆蓋。
- **預設顯示簡碼文字**：讓每張 `crochet` 織圖預設嵌入唯讀簡碼文字，可用 `text: on/off` 個別覆蓋。
- **面板位置**：嵌入的工具或文字面板預設位置（右／左／下方），可用 `position:` 個別覆蓋。
- **顯示背景參考網格**：讓每張 `crochet` 織圖預設顯示圈數／行列參考網格，可用 `grid: on/off` 個別覆蓋。
- **環織符號旋轉**：同心圓環織／螺旋圖裡符號的旋轉方式（`smart`、`all`、或 `none`）。
- **圓織圖樣式**：`standard`（針目平均分佈）或 `book`（連續螺旋圈線、針目對齊上一圈、拉寬的加減針符號、標示圈數）。
- **網格預設形狀**：新建 `crochet-grid` 區塊的預設形狀（`polar` 或 `rect`）。
- **網格預設圈數**：放射狀網格的預設圈數。
- **網格預設欄數**：網格區塊的預設欄數／輻條數。
- **網格預設行數**：矩形網格的預設行數。

標示「可個別覆蓋」的設定，都能用對應的 frontmatter 鍵（`scale`、`stroke`、`spacing`、`highlight`、`rotation`、`style`、`tool`、`text`、`position`、`grid`）在單一織圖中覆蓋。`chartMarkerColor` 僅限全域設定。`crochet-grid` 區塊使用自己的設定鍵（`shape`、`rounds`、`columns`、`rows`，以及 `scale`／`stroke`／`spacing`）；真實織圖上 `grid` 參考網格用的 `rounds`／`rows`／`columns` 是疊加在該織圖自己的 frontmatter 上，且永遠只能延伸、不會縮小其真實範圍。

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

解析器是由 `src/grammar.peggy` 產生至 `src/parser.ts`。請勿手動編輯 `src/parser.ts`。

### 使用 AI 協助撰寫織圖

如果你想請 AI 助理幫忙把織圖轉換成 Crochet Weaver 語法，可以參考 [`docs/ai-pattern-authoring.zh-TW.md`](docs/ai-pattern-authoring.zh-TW.md)——一份專為此用途撰寫、可獨立使用的語法參考文件，也提供 [English](docs/ai-pattern-authoring.md)、[简体中文](docs/ai-pattern-authoring.zh-CN.md)、[日本語](docs/ai-pattern-authoring.ja.md) 版本。也可以直接在外掛設定頁面複製這份文件的內容（設定 →「複製提供給 AI 的說明」）。也提供現成的 Claude Code skill：[`.claude/skills/crochet-weaver-pattern/`](.claude/skills/crochet-weaver-pattern/)。

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
