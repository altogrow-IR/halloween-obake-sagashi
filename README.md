# ハロウィンおばけ探し

夜のシーンの中に隠れたおばけを探してタップする、子ども向けのミニゲームです。

公開URL（予定）: https://altogrow-ir.github.io/halloween-obake-sagashi/

## 遊び方

- モードを選んで「スタート」を押します
  - かんたん：おばけ 5ひき（大きめで見つけやすい）
  - ふつう：おばけ 10ひき
- 夜のまちのシーンの中に隠れた 👻 を探してタップします。隠れ場所はラウンドごとにランダムです
- 見つけたおばけは 😊 に変わり、「みつけた！」と表示されます
- 間違えてタップしても大丈夫です（✨ が出るだけです）
- 全部見つけたらクリア表示とかかった時間が出ます。「もういっかい あそぶ」で同じモードでもう一度遊べます
- ベストタイム（モード別）とクリア回数は、この端末の localStorage に保存されて表示されます

対象は約6歳と約3歳の子どもと家族です。大きなボタンと、ひらがな多めのやさしい日本語で作っています。スマホでも遊べるレスポンシブデザインです。

## 構成

- Vite + React 19 + TypeScript（ESM、npm）
- `src/App.tsx` を中心に実装、`src/App.css` / `src/index.css`
- 外部画像素材は使わず、絵文字とCSSだけで表現しています
- サーバーやアカウント登録は不要で、ブラウザと端末内保存だけで完結します

```
index.html
vite.config.ts        # base: "/halloween-obake-sagashi/"
tsconfig.json / tsconfig.app.json / tsconfig.node.json
package.json          # scripts: dev=vite, build=tsc -b && vite build, preview=vite preview
src/App.tsx
src/main.tsx
public/
docs/                 # GitHub Pages 公開用ビルド成果物
```

## 開発

```bash
npm install
npm run dev
```

ビルドは `npm run build`（出力は `dist/`）。GitHub Pages へは、ビルド成果物を `docs/` フォルダに入れておき、リポジトリ設定で Pages の公開元を main ブランチの `/docs` フォルダに指定して公開します。
