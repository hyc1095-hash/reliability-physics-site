# 半導體可靠度物理 · 互動教材

純靜態網站。30 個 HTML 檔，全部自給自足：**沒有任何外部資源請求、沒有後端、沒有 cookie、沒有追蹤**。
所有互動模型都在瀏覽器本機即時計算。

## 結構

```
index.html              首頁（機制選單 + HCI vs TDDB 對照表）
├─ hci.html             HCI 課程地圖
│  ├─ hci-1-intuition   階段 1：直覺
│  ├─ hci-2-mechanism   階段 2：物理機制（DAHC / CHE / SHE / off-state）
│  ├─ hci-3-model       階段 3：物理模型（pseudo-2D 電場、撞擊游離）
│  ├─ hci-4-formula     階段 4：公式階梯（I = qnvA → Age function）
│  ├─ hci-5-spec        階段 5：HCI 規格（JESD28、JEP122、AEC-Q100）
│  ├─ hci-6-fix         階段 6：如何防治（三檔 implant 劑量 + 四組合壽命比較）
│  └─ hci-7-playground  階段 7：可調模型工作台（四分頁 + 常駐數值列）
│                        ① 結構與材料：5 種元件結構、11 種閘極介電層、13 種閘極電極、能帶對齊圖
│                        ② 摻雜與製程：三個濃度可直接輸入量級（下限 n_i、上限矽原子密度）
│                        ③ 偏壓與環境：含自我發熱（負活化能的反直覺效應）
│                        ④ 壽命與統計：power-law + 對數常態，五個判準同時比較
├─ materials.html       材料與結構參考表（全站數據唯一出處，逐項附來源與查證狀態）
├─ tddb.html            TDDB 課程地圖
│  ├─ tddb-1-intuition  階段 1：直覺（即時滲流動畫）
│  ├─ tddb-2-percolation階段 2：滲流蒙地卡羅（Weibull 分布自己長出來）
│  ├─ tddb-3-trapsize   階段 3：陷阱尺寸與 Weibull 斜率（β = m·t_ox/a₀、文獻 a₀ 對照表）
│  ├─ tddb-4-model      階段 4：統計與外推（Weibull、面積、加速模型分歧）
│  ├─ tddb-5-spec       階段 5：TDDB 規格（JESD263、商規 vs 車規）
│  ├─ tddb-6-fix        階段 6：如何防治（本質 vs 外質雙分布）
│  └─ tddb-7-playground 階段 7：完整壽命外推鏈
├─ nbti.html            NBTI/PBTI 課程地圖
│  ├─ nbti-1-intuition  階段 1：直覺（靜態偏壓，不是電流；與 HCI 對照表）
│  ├─ nbti-2-mechanism  階段 2：物理機制與 R-D 模型（Si-H 斷裂、時間指數 n 理論 vs 實測）
│  ├─ nbti-3-recovery   階段 3：恢復動力學與量測陷阱（OTF、ultra-fast I-V）
│  └─ nbti-4-spec       階段 4：判準、外推與防治（與 TDDB 氮化對策的衝突）
├─ em.html              電遷移（EM）課程地圖
│  ├─ em-1-intuition    階段 1：直覺（電子風力、陰極空洞／陽極突起）
│  ├─ em-2-model        階段 2：Black 方程式 + 材料活化能表（Al／Al-Cu／Cu 介電質-cap／Cu 金屬-cap／W）
│  ├─ em-3-blech        階段 3：Blech 長度（短導線免疫效應）
│  └─ em-4-spec         階段 4：統計外推與防治（wide-narrow rule、redundant via）
├─ coupling.html        自我發熱與機制耦合（把 HCI/NBTI/TDDB/EM 的溫度活化能放回同一張表）
└─ tools.html           HCI 負載電阻與 AC 交叉點工具（獨立單檔）
```

## 部署

任何靜態主機都可以，直接把整個資料夾丟上去：

- **GitHub Pages**：新建 repo → 上傳全部檔案 → Settings → Pages → Source 選 `main` / `root`
- **Cloudflare Pages / Netlify / Vercel**：拖曳整個資料夾即可，不需要 build 指令
- **公司內網**：任何能提供靜態檔案的 web server（nginx、Apache、IIS）
- **本機**：直接用瀏覽器開 `index.html` 也完全可用（沒有跨來源請求）

`robots.txt` 與 `sitemap.xml` 已附上。如果部署在子路徑下，請把 `robots.txt` 裡的
Sitemap 路徑改成完整 URL。

## 鍵盤操作

課程頁面支援 `←` / `→` 翻頁。右上角 `◐` 切換深色／淺色（也會跟隨系統設定）。

## 重要聲明

- 所有物理模型都是**簡化的教學模型**，參數取文獻常見量級，**不是任何製程的實測資料**。
- 可以用來理解因果方向與量級感；**不可作為設計、驗收或對客戶承諾的依據**。
- 凡引用外部標準與文件之處，均附連結與逐字核對狀態（見各模組的「來源與查證狀態」表）。
- 凡屬模型輸出之處，均標示「模型輸出」。**兩者請勿混用。**

## 重新產生

```
python3 build_course.py    # HCI 階段 0–6
python3 build_pg.py        # HCI 階段 7（可調模型工作台）
python3 build_materials.py # 材料與結構參考表
python3 build_tddb.py      # TDDB 模組
python3 build_hub.py       # 首頁
./buildall.sh              # 以上全部 + tools.html
```
共用資源：`core_css.txt`（樣式）、`core_model.js`（HCI 物理核心）、`core_viz2.js`（MOSFET 剖面圖）、`mat_data.js`（已查證的材料與結構資料）。

**注意**：`nbti-*.html`、`em-*.html`、`coupling.html`、`tddb-3-trapsize.html` 這 12 個檔案是後續手動加入的內容，
沿用既有頁面抽出的共用 CSS（與 `core_css.txt` 同一套 class 規則），但**尚未整合進
`build_course.py` / `build_tddb.py` 這類產生器腳本** —— 目前 `buildall.sh` 不會重新產生這幾頁，
修改時需直接編輯對應 HTML。互動模型（R-D 時間律、Black 方程式、Blech 長度、自我發熱耦合）為簡化教學模型，
未接入 `core_model.js` 的 HCI 物理核心，也未做元件級校準；EM 材料活化能表已逐項查證來源，
其餘互動工具的參數請視為文獻常見量級，不是實測值。

### TDDB 階段 3（陷阱尺寸）與階段重新編號

`tddb-3-trapsize.html` 是後來加入的一頁，主題是 **Weibull 斜率 β 如何隨陷阱尺寸 a₀ 改變**
（cell-based 關係式 β = m·t_ox/a₀、文獻萃取出的 a₀ 從 0.4 nm 到 3 nm、以及這個分歧對 ppm 外推與面積縮放的後果）。
加入這一頁時，TDDB 模組從 6 階段變成 7 階段，原本的檔名與顯示編號一起往後移：

```
tddb-3-model.html      → tddb-4-model.html      （階段 3 → 4）
tddb-4-spec.html       → tddb-5-spec.html       （階段 4 → 5）
tddb-5-fix.html        → tddb-6-fix.html        （階段 5 → 6）
tddb-6-playground.html → tddb-7-playground.html （階段 6 → 7）
```

全站的連結、導覽列、進度條、`sitemap.xml`、`index.html` 的階段數與內文交叉引用都已同步更新。
**`build_tddb.py` 尚未同步**：重跑產生器會覆蓋掉這一頁與上述重新編號，修改時請直接編輯 HTML。

`tddb_core_model.js` 的 `beta_of(tox, a0, m)` 已擴充成可指定陷阱尺寸與陷阱生成冪次，
省略後兩個參數時行為與舊版完全相同（a₀ = 1 nm、m = 1），因此階段 7 的可調模型不受影響。
階段 3 本身改用 `beta_raw()`（不夾 β ≥ 1.05 的下限），因為 t_ox < a₀ 時 β 本來就該退化到 m。
