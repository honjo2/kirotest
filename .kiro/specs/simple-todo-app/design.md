# 設計ドキュメント

## 概要

シンプルな todo アプリケーションは、React（または Vanilla JavaScript）を使用したフロントエンドアプリケーションとして実装します。ローカルストレージを使用してデータを永続化し、レスポンシブな UI を提供します。

## アーキテクチャ

### 技術スタック

- **フロントエンド**: HTML, CSS, JavaScript (ES6+)
- **データ永続化**: LocalStorage
- **スタイリング**: CSS3 (Flexbox/Grid)
- **モジュール管理**: ES6 Modules

### アプリケーション構造

```
src/
├── index.html          # メインHTMLファイル
├── styles/
│   └── main.css       # メインスタイルシート
├── js/
│   ├── app.js         # メインアプリケーションロジック
│   ├── todo.js        # Todoクラス定義
│   └── storage.js     # LocalStorage管理
└── assets/
    └── icons/         # アイコンファイル（必要に応じて）
```

## コンポーネントとインターフェース

### 1. Todo クラス

```javascript
class Todo {
  constructor(id, text, completed = false, createdAt = new Date()) {
    this.id = id;
    this.text = text;
    this.completed = completed;
    this.createdAt = createdAt;
  }
}
```

### 2. TodoApp クラス

メインアプリケーションロジックを管理

- `todos`: Todo 配列
- `addTodo(text)`: 新しいタスクを追加
- `toggleTodo(id)`: タスクの完了状態を切り替え
- `deleteTodo(id)`: タスクを削除
- `render()`: UI を更新

### 3. StorageManager クラス

LocalStorage との連携を管理

- `saveTodos(todos)`: タスクを LocalStorage に保存
- `loadTodos()`: LocalStorage からタスクを読み込み
- `clearTodos()`: すべてのタスクをクリア

## データモデル

### Todo オブジェクト

```javascript
{
  id: string,           // ユニークID (UUID)
  text: string,         // タスクのテキスト
  completed: boolean,   // 完了状態
  createdAt: Date      // 作成日時
}
```

### アプリケーション状態

```javascript
{
  todos: Todo[],        // すべてのタスクの配列
  filter: string        // 将来の拡張用（all, active, completed）
}
```

## UI 設計

### レイアウト構造

```
┌─────────────────────────────────┐
│           Todo App              │
├─────────────────────────────────┤
│  [入力フィールド] [追加ボタン]    │
├─────────────────────────────────┤
│  ☐ タスク1              [削除]   │
│  ☑ タスク2（完了済み）    [削除]   │
│  ☐ タスク3              [削除]   │
└─────────────────────────────────┘
```

### CSS クラス設計

- `.todo-app`: メインコンテナ
- `.todo-input`: 入力セクション
- `.todo-list`: タスクリスト
- `.todo-item`: 個別タスク
- `.todo-item.completed`: 完了済みタスク
- `.todo-text`: タスクテキスト
- `.todo-checkbox`: チェックボックス
- `.todo-delete`: 削除ボタン

## エラーハンドリング

### 入力検証

- 空のタスクテキストの検証
- 最大文字数制限（例：200 文字）
- 特殊文字のサニタイズ

### LocalStorage エラー

- ストレージ容量不足の処理
- データ破損時のフォールバック
- ブラウザサポートチェック

### ユーザーフィードバック

- 成功メッセージ（タスク追加時）
- エラーメッセージ（検証失敗時）
- 確認ダイアログ（削除時、オプション）

## テスト戦略

### 単体テスト

- Todo クラスのメソッド
- StorageManager の機能
- 入力検証ロジック

### 統合テスト

- タスクの追加から表示までの流れ
- LocalStorage との連携
- UI イベントハンドリング

### E2E テスト

- ユーザーシナリオの実行
- ブラウザ間の互換性
- レスポンシブデザインの確認

## パフォーマンス考慮事項

### 最適化

- DOM 操作の最小化
- イベントデリゲーション
- 効率的なレンダリング

### メモリ管理

- 不要なイベントリスナーの削除
- 大量タスク時のパフォーマンス

## セキュリティ

### XSS 対策

- ユーザー入力のサニタイズ
- innerHTML の安全な使用

### データ保護

- LocalStorage データの適切な管理
- 機密情報の非保存
