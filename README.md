# Simple Todo App

Kiroで作成したシンプルなTodoアプリケーション

## 概要

このプロジェクトは、基本的なタスク管理機能を提供するシンプルなTodoアプリです。タスクの追加、完了マーク、削除ができ、LocalStorageを使用してデータを永続化します。

## 機能

- ✅ タスクの追加
- ✅ タスクの完了/未完了の切り替え
- ✅ タスクの削除
- ✅ タスクの一覧表示
- ✅ 完了済みタスクの視覚的区別
- ✅ LocalStorageによるデータ永続化
- ✅ レスポンシブデザイン

## セットアップと実行手順

### 必要な環境
- モダンなWebブラウザ（Chrome, Firefox, Safari, Edge）
- ローカルWebサーバー（開発用）

### 実行方法

#### 方法1: Python を使用（推奨）
```bash
# プロジェクトディレクトリに移動
cd /path/to/simple-todo-app

# Python 3 の場合
python3 -m http.server 8000

# Python 2 の場合
python -m SimpleHTTPServer 8000
```

#### 方法2: Node.js を使用
```bash
# http-server をグローバルにインストール（初回のみ）
npm install -g http-server

# プロジェクトディレクトリに移動
cd /path/to/simple-todo-app

# サーバーを起動
http-server -p 8000
```

#### 方法3: Live Server（VS Code拡張機能）
1. VS Codeで `src/index.html` を開く
2. 右クリックして「Open with Live Server」を選択

### アクセス方法
ブラウザで以下のURLにアクセス：
```
http://localhost:8000/src/
```

## 使い方

1. **タスクの追加**: 入力フィールドにタスクを入力し、「追加」ボタンをクリックまたはEnterキーを押す
2. **タスクの完了**: チェックボックスをクリックしてタスクを完了済みにマーク
3. **タスクの削除**: 削除ボタン（×）をクリックしてタスクを削除
4. **データの永続化**: ブラウザを閉じても、LocalStorageによりタスクが保存される

## プロジェクト構造

```
src/
├── index.html          # メインHTMLファイル
├── styles/
│   └── main.css       # スタイルシート
├── js/
│   ├── app.js         # メインアプリケーションロジック
│   ├── todo.js        # Todoクラス定義
│   ├── storage.js     # LocalStorage管理
│   └── validation.js  # 入力バリデーション
└── test/              # テストファイル
    ├── run-all-tests.js
    ├── initialization.test.js
    ├── integration.test.js
    ├── error-handling.test.js
    └── storage.test.js
```

## テストの実行

ブラウザのコンソールでテストを実行：
```javascript
// すべてのテストを実行
runAllTests();
```

## トラブルシューティング

### よくある問題

1. **ファイルが読み込まれない**
   - ローカルWebサーバーを使用していることを確認
   - ブラウザのセキュリティ制限により、file://プロトコルでは正常に動作しない場合があります

2. **データが保存されない**
   - ブラウザのLocalStorageが有効になっていることを確認
   - プライベートブラウジングモードでは制限される場合があります

3. **スタイルが適用されない**
   - CSSファイルのパスが正しいことを確認
   - ブラウザのキャッシュをクリアしてみてください

## 技術仕様

- **言語**: HTML5, CSS3, JavaScript (ES6+)
- **ストレージ**: LocalStorage
- **アーキテクチャ**: モジュラー設計
- **ブラウザサポート**: モダンブラウザ（ES6+対応）

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
