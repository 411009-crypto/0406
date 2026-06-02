背單字純前端範例

簡介
- 使用純 HTML/CSS/JS（無框架）實作一個翻轉卡片的背單字 App，並附帶管理頁面。

檔案
- index.html: 主畫面（卡片練習）
- admin.html: 單字管理（新增/編輯/刪除/自動填入）
- styles.css: 樣式
- app.js: 邏輯與 localStorage

自動填入機制
- 會呼叫 https://api.dictionaryapi.dev 取得詞性、定義與例句，並嘗試用 LibreTranslate（https://libretranslate.de）將定義翻譯為中文做為「翻譯」欄位。此公開服務可能有 CORS 或流量限制。

使用方法
1. 在瀏覽器中開啟 `index.html`。
2. 點選右上「管理單字」進入 `admin.html`，可新增單字或使用「自動填入」。
3. 新增後回到 `index.html` 即可翻閱單字卡片。
# 0406