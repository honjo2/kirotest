# プロジェクト構造 & 組織化

## ディレクトリレイアウト

```
simple-todo-app/
├── README.md                    # プロジェクトドキュメント（日本語）
├── .gitignore                   # Git除外ルール
├── .kiro/                       # Kiro AIアシスタント設定
│   ├── specs/                   # プロジェクト仕様書
│   └── steering/                # AIガイダンスルール
├── .vscode/                     # VS Codeワークスペース設定
└── src/                         # メインアプリケーションソース
    ├── index.html               # エントリーポイントHTMLファイル
    ├── js/                      # JavaScriptモジュール
    │   ├── app.js              # メインアプリケーションロジック & ブートストラップ
    │   ├── todo.js             # Todoデータモデルクラス
    │   ├── storage.js          # LocalStorage管理
    │   └── validation.js       # 入力バリデーションユーティリティ
    ├── styles/
    │   └── main.css            # 完全なアプリケーションスタイル
    └── test/                   # テストスイート
        ├── run-all-tests.js    # テストランナーとオーケストレーション
        ├── initialization.test.js  # アプリ起動テスト
        ├── integration.test.js     # エンドツーエンド機能テスト
        ├── error-handling.test.js  # エラーシナリオテスト
        └── storage.test.js         # ストレージレイヤーテスト
```

## モジュール組織

### コアアプリケーション (`src/js/`)

- **`app.js`**: メインアプリケーションコントローラー
  - `TodoApp`クラス: 主要ビジネスロジック
  - `AppBootstrap`クラス: アプリケーション初期化
  - DOMイベントハンドリングとUI管理
  - グローバルアプリケーション状態管理

- **`todo.js`**: データモデル
  - `Todo`クラス: 個別タスク表現
  - イミュータブルデータパターン
  - データバリデーションとシリアライゼーション

- **`storage.js`**: 永続化レイヤー
  - `StorageManager`クラス: LocalStorage操作
  - `StorageResult`クラス: 操作結果ラッパー
  - エラーハンドリングとフォールバック機能

- **`validation.js`**: 入力バリデーション
  - `InputValidator`クラス: 静的バリデーションメソッド
  - `ValidationResult`クラス: バリデーション結果ラッパー
  - XSS保護と入力サニタイゼーション

### テスト構造 (`src/test/`)

- **テスト組織**: 各テストファイルは特定の機能に焦点
- **テストランナー**: 詳細レポート付き集中実行
- **モック環境**: 単体テスト用のDOMとLocalStorageモック
- **統合カバレッジ**: エンドツーエンドユーザーシナリオ

## ファイル命名規則

- **JavaScript**: ファイルは`kebab-case.js`、クラスは`PascalCase`
- **CSS**: BEMスタイルクラス命名の`kebab-case.css`
- **HTML**: `kebab-case.html`
- **テスト**: すべてのテストファイルに`*.test.js`サフィックス

## インポート/エクスポートパターン

```javascript
// メインクラスのデフォルトエクスポート
export default TodoApp;

// ユーティリティの名前付きエクスポート
export { StorageManager, StorageResult };

// インポートパターン
import TodoApp from './app.js';
import { InputValidator } from './validation.js';
```

## CSSアーキテクチャ

- **単一ファイル**: シンプルさのため`main.css`にすべてのスタイル
- **コンポーネントベース**: UIコンポーネント別に整理されたスタイル
- **レスポンシブ**: メディアクエリを使用したモバイルファーストアプローチ
- **BEM手法**: Block-Element-Modifier命名規則

## 設定ファイル

- **`.gitignore`**: 標準Webプロジェクト除外設定
- **`.kiro/`**: AIアシスタント設定とプロジェクト仕様
- **`.vscode/`**: 一貫した開発のためのエディター固有設定

## エントリーポイント

- **開発**: `src/index.html`（ローカルサーバー必須）
- **テスト**: `src/test/run-all-tests.js`（ブラウザコンソール）
- **本番**: 開発と同じ（静的ファイル配信）

## コード組織原則

1. **関心の分離**: 各モジュールは単一の責任を持つ
2. **依存関係の方向**: コアロジックはUIに依存しない
3. **エラーバウンダリ**: 各レイヤーは独自のエラーシナリオを処理
4. **テスト可能性**: すべてのモジュールは簡単な単体テスト用に設計
5. **モジュラー性**: 機能は独立して変更可能