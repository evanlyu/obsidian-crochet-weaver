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
- 所有進度都儲存在本機的外掛資料檔中。
- 完整多語系介面：英文、繁體中文、簡體中文、日文。

## 快速開始

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

支援的針目名稱：

- `ch`（鎖針）
- `sc`（短針）
- `hdc`（中長針）
- `dc`（長針）
- `tr`（長長針）
- `dtr`（三卷長針）
- `sl st`（滑針）
- `fpdc`（前引長針）
- `bpdc`（後引長針）
- `bobble`（玉編）
- `popcorn`（爆米花針）
- `inc`（加針）
- `dec`（減針）
- `MR`（魔術環）

支援數量前綴：

```crochet
R1: 10 ch, 6 sc
```

重複使用中括號：

```crochet
R2: [sc, inc] x 6
```

群組使用小括號，會以同一個針目位置向外展開成扇形：

```crochet
R3: (dc, ch, dc), sc
```

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
- **環織符號旋轉**：同心圓環織／螺旋圖裡符號的旋轉方式（`smart`、`all`、或 `none`）。

標示「可個別覆蓋」的設定，都能用對應的 frontmatter 鍵（`scale`、`stroke`、`spacing`、`highlight`、`rotation`、`tool`、`text`、`position`）在單一織圖中覆蓋。`chartMarkerColor` 僅限全域設定。

## 安全限制

Crochet Weaver 會在展開佈局前先驗證解析後的織圖。行數、針數、重複次數、巢狀深度或總渲染針數若過大，會直接以行內錯誤訊息拒絕渲染，避免讓 Obsidian 預覽畫面卡死。

目前限制：

- 最多 200 行
- 單一數量前綴最多 1000
- 最多重複 500 次
- 最多渲染 5000 個針目
- 最大巢狀深度 8 層

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

如果你想請 AI 助理幫忙把織圖轉換成 Crochet Weaver 語法，可以參考 [`docs/ai-pattern-authoring.md`](docs/ai-pattern-authoring.md)——一份專為此用途撰寫、可獨立使用的語法參考文件。也提供現成的 Claude Code skill：[`.claude/skills/crochet-weaver-pattern/`](.claude/skills/crochet-weaver-pattern/)。

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
