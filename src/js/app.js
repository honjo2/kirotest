/**
 * TodoApp クラス - メインアプリケーションロジックを管理
 * 要件 1.1, 2.1, 3.1 に対応
 */

import Todo from './todo.js';
import { StorageManager } from './storage.js';
import { InputValidator } from './validation.js';

/**
 * メインアプリケーションクラス
 */
class TodoApp {
  constructor() {
    this.todos = [];
    this.storageManager = new StorageManager();
    this.initialized = false;
  }

  /**
   * アプリケーションを初期化
   * 保存されたタスクを読み込む
   * @returns {Promise<boolean>} 初期化成功時true
   */
  async initialize() {
    try {
      const loadResult = this.storageManager.loadTodos();
      
      if (loadResult.success) {
        this.todos = loadResult.data || [];
        this.initialized = true;
        
        // ストレージ情報をチェックして警告を表示
        const storageInfo = this.storageManager.getStorageInfo();
        if (!storageInfo.isLocalStorageAvailable) {
          console.warn('LocalStorage is not available. Using fallback storage.');
          this.showStorageWarning('ブラウザのストレージが利用できません。データは一時的に保存されます。');
        }
        
        console.log(`Todo App initialized with ${this.todos.length} tasks`);
        return true;
      } else {
        console.warn('Failed to load todos:', loadResult.error);
        this.todos = [];
        this.initialized = true;
        this.showStorageWarning('保存されたデータの読み込みに失敗しました。新しく開始します。');
        return false;
      }
    } catch (error) {
      console.error('Initialization failed:', error);
      this.todos = [];
      this.initialized = true;
      this.showStorageWarning('アプリケーションの初期化中にエラーが発生しました。');
      return false;
    }
  }

  /**
   * 新しいタスクを追加
   * @param {string} text - タスクのテキスト
   * @returns {Object} 追加結果 { success: boolean, todo?: Todo, error?: string }
   */
  addTodo(text) {
    try {
      // 入力バリデーション（要件 1.2 に対応）
      const validationResult = InputValidator.validateTaskText(text);
      if (!validationResult.isValid) {
        return { success: false, error: validationResult.errorMessage };
      }

      // テキストをサニタイズ
      const sanitizedText = InputValidator.sanitizeText(text);
      const trimmedText = sanitizedText.trim();

      // 新しいTodoを作成
      const id = Todo.generateId();
      const newTodo = new Todo(id, trimmedText);

      // todos配列に追加
      this.todos.push(newTodo);

      // ストレージに保存
      const saveResult = this.storageManager.saveTodos(this.todos);
      if (!saveResult.success) {
        // 保存に失敗した場合、配列から削除してロールバック
        this.todos.pop();
        return { success: false, error: `保存に失敗しました: ${saveResult.error}` };
      }

      return { success: true, todo: newTodo };
    } catch (error) {
      return { success: false, error: `タスクの追加に失敗しました: ${error.message}` };
    }
  }

  /**
   * タスクの完了状態を切り替え
   * @param {string} id - 切り替えるタスクのID
   * @returns {Object} 切り替え結果 { success: boolean, todo?: Todo, error?: string }
   */
  toggleTodo(id) {
    try {
      // IDバリデーション
      if (!id || typeof id !== 'string') {
        return { success: false, error: 'IDは文字列である必要があります' };
      }

      // タスクを検索
      const todoIndex = this.todos.findIndex(todo => todo.id === id);
      if (todoIndex === -1) {
        return { success: false, error: '指定されたIDのタスクが見つかりません' };
      }

      // 完了状態を切り替え
      const currentTodo = this.todos[todoIndex];
      const toggledTodo = currentTodo.toggle();
      this.todos[todoIndex] = toggledTodo;

      // ストレージに保存
      const saveResult = this.storageManager.saveTodos(this.todos);
      if (!saveResult.success) {
        // 保存に失敗した場合、元の状態にロールバック
        this.todos[todoIndex] = currentTodo;
        return { success: false, error: `保存に失敗しました: ${saveResult.error}` };
      }

      return { success: true, todo: toggledTodo };
    } catch (error) {
      return { success: false, error: `タスクの切り替えに失敗しました: ${error.message}` };
    }
  }

  /**
   * タスクを削除
   * @param {string} id - 削除するタスクのID
   * @returns {Object} 削除結果 { success: boolean, deletedTodo?: Todo, error?: string }
   */
  deleteTodo(id) {
    try {
      // IDバリデーション
      if (!id || typeof id !== 'string') {
        return { success: false, error: 'IDは文字列である必要があります' };
      }

      // タスクを検索
      const todoIndex = this.todos.findIndex(todo => todo.id === id);
      if (todoIndex === -1) {
        return { success: false, error: '指定されたIDのタスクが見つかりません' };
      }

      // タスクを削除（バックアップを保持）
      const deletedTodo = this.todos[todoIndex];
      this.todos.splice(todoIndex, 1);

      // ストレージに保存
      const saveResult = this.storageManager.saveTodos(this.todos);
      if (!saveResult.success) {
        // 保存に失敗した場合、削除したタスクを復元
        this.todos.splice(todoIndex, 0, deletedTodo);
        return { success: false, error: `保存に失敗しました: ${saveResult.error}` };
      }

      return { success: true, deletedTodo };
    } catch (error) {
      return { success: false, error: `タスクの削除に失敗しました: ${error.message}` };
    }
  }

  /**
   * すべてのタスクを取得
   * @returns {Todo[]} タスクの配列
   */
  getAllTodos() {
    return [...this.todos]; // 配列のコピーを返す
  }

  /**
   * 完了済みタスクを取得
   * @returns {Todo[]} 完了済みタスクの配列
   */
  getCompletedTodos() {
    return this.todos.filter(todo => todo.completed);
  }

  /**
   * 未完了タスクを取得
   * @returns {Todo[]} 未完了タスクの配列
   */
  getActiveTodos() {
    return this.todos.filter(todo => !todo.completed);
  }

  /**
   * タスクの総数を取得
   * @returns {number} タスクの総数
   */
  getTodoCount() {
    return this.todos.length;
  }

  /**
   * 完了済みタスクの数を取得
   * @returns {number} 完了済みタスクの数
   */
  getCompletedCount() {
    return this.todos.filter(todo => todo.completed).length;
  }

  /**
   * 未完了タスクの数を取得
   * @returns {number} 未完了タスクの数
   */
  getActiveCount() {
    return this.todos.filter(todo => !todo.completed).length;
  }

  /**
   * すべてのタスクをクリア
   * @returns {Object} クリア結果 { success: boolean, error?: string }
   */
  clearAllTodos() {
    try {
      const backup = [...this.todos];
      this.todos = [];

      const clearResult = this.storageManager.clearTodos();
      if (!clearResult.success) {
        // クリアに失敗した場合、バックアップを復元
        this.todos = backup;
        return { success: false, error: `クリアに失敗しました: ${clearResult.error}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `タスクのクリアに失敗しました: ${error.message}` };
    }
  }

  /**
   * アプリケーションの状態を取得（デバッグ用）
   * @returns {Object} アプリケーション状態
   */
  getAppState() {
    return {
      initialized: this.initialized,
      todoCount: this.getTodoCount(),
      completedCount: this.getCompletedCount(),
      activeCount: this.getActiveCount(),
      storageInfo: this.storageManager.getStorageInfo()
    };
  }

  /**
   * UIを更新してタスクリストを表示
   * 要件 4.1, 4.3 に対応
   */
  render() {
    if (!this.todoList) {
      console.error('Todo list element not found');
      return;
    }

    // タスクリストをクリア
    this.todoList.innerHTML = '';

    // タスクが存在するかチェック
    if (this.todos.length === 0) {
      // 空のリスト状態の処理（要件 4.2）
      this.showEmptyState();
      return;
    }

    // 空のメッセージを非表示
    this.hideEmptyState();

    // 各タスクをレンダリング
    this.todos.forEach(todo => {
      const todoElement = this.createTodoElement(todo);
      this.todoList.appendChild(todoElement);
    });
  }

  /**
   * 個別のタスク要素を作成
   * @param {Todo} todo - タスクオブジェクト
   * @returns {HTMLElement} タスク要素
   */
  createTodoElement(todo) {
    // リストアイテムを作成
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;
    li.dataset.todoId = todo.id;

    // チェックボックスを作成
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.dataset.todoId = todo.id;

    // タスクテキストを作成
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = todo.text;

    // 削除ボタンを作成
    const deleteButton = document.createElement('button');
    deleteButton.className = 'todo-delete';
    deleteButton.textContent = '削除';
    deleteButton.dataset.todoId = todo.id;

    // 要素を組み立て
    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(deleteButton);

    return li;
  }

  /**
   * 空のリスト状態を表示
   * 要件 4.2 に対応
   */
  showEmptyState() {
    if (this.emptyMessage) {
      this.emptyMessage.style.display = 'block';
    }
  }

  /**
   * 空のリスト状態を非表示
   */
  hideEmptyState() {
    if (this.emptyMessage) {
      this.emptyMessage.style.display = 'none';
    }
  }

  /**
   * UI要素を初期化し、イベントリスナーを設定
   */
  initializeUI() {
    // DOM要素を取得
    this.todoInput = document.getElementById('todo-text');
    this.addButton = document.getElementById('add-todo');
    this.todoList = document.getElementById('todo-list');
    this.emptyMessage = document.getElementById('empty-message');
    this.errorMessage = document.getElementById('error-message');

    // イベントリスナーを設定
    this.setupEventListeners();
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // 追加ボタンのクリックイベント
    if (this.addButton) {
      this.addButton.addEventListener('click', () => this.handleAddTodo());
    }

    // 入力フィールドでのEnterキー押下イベント
    if (this.todoInput) {
      this.todoInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          this.handleAddTodo();
        }
      });

      // 入力フィールドでの入力時にエラーメッセージをクリア
      this.todoInput.addEventListener('input', () => {
        this.hideErrorMessage();
      });
    }

    // チェックボックスの切り替えイベント
    this.setupToggleEventListeners();
    
    // 削除ボタンのクリックイベント
    this.setupDeleteEventListeners();
  }

  /**
   * タスク追加のUIハンドリング
   * 要件 1.1, 1.3 に対応
   */
  handleAddTodo() {
    if (!this.todoInput) {
      console.error('Todo input element not found');
      return;
    }

    const text = this.todoInput.value;
    const result = this.addTodo(text);

    if (result.success) {
      // 成功時: 入力フィールドをクリア（要件 1.3）
      this.todoInput.value = '';
      
      // UIを更新（後のタスクで実装される render メソッドを呼び出し）
      if (typeof this.render === 'function') {
        this.render();
      }
      
      console.log('Task added successfully:', result.todo.text);
    } else {
      // エラー時: エラーメッセージを表示
      // ストレージエラーの場合は特別な処理
      if (result.error.includes('保存に失敗しました')) {
        this.handleStorageError(result.error);
      } else {
        this.showErrorMessage(result.error);
      }
      console.error('Failed to add task:', result.error);
    }
  }

  /**
   * エラーメッセージを表示
   * 要件 1.2 に対応 - バリデーション失敗時のフィードバック
   * @param {string} message - エラーメッセージ
   */
  showErrorMessage(message) {
    if (!this.errorMessage) {
      console.error('Error message element not found');
      return;
    }

    // エラーメッセージを設定
    this.errorMessage.textContent = message;
    this.errorMessage.classList.add('show');
    this.errorMessage.style.display = 'block';

    // 入力フィールドにエラー状態のスタイルを適用
    if (this.todoInput) {
      this.todoInput.classList.add('error');
    }

    // 5秒後に自動的にエラーメッセージを非表示
    setTimeout(() => {
      this.hideErrorMessage();
    }, 5000);
  }

  /**
   * エラーメッセージを非表示
   */
  hideErrorMessage() {
    if (this.errorMessage) {
      this.errorMessage.classList.remove('show');
      this.errorMessage.style.display = 'none';
      this.errorMessage.textContent = '';
    }

    // 入力フィールドからエラー状態のスタイルを削除
    if (this.todoInput) {
      this.todoInput.classList.remove('error');
    }
  }

  /**
   * 成功メッセージを表示
   * @param {string} message - 成功メッセージ
   */
  showSuccessMessage(message) {
    // エラーメッセージを非表示にする（成功時）
    this.hideErrorMessage();
    
    // 簡単なコンソール出力（後でより良いUI実装に置き換え可能）
    console.log(`成功: ${message}`);
  }

  /**
   * ストレージ警告メッセージを表示
   * 要件 4.1 に対応 - LocalStorageエラーハンドリング
   * @param {string} message - 警告メッセージ
   */
  showStorageWarning(message) {
    // コンソールに警告を出力
    console.warn(`ストレージ警告: ${message}`);
    
    // 必要に応じてユーザーに通知（非侵入的な方法）
    if (this.errorMessage) {
      // エラーメッセージ要素を警告として一時的に使用
      this.errorMessage.textContent = `警告: ${message}`;
      this.errorMessage.classList.add('show');
      this.errorMessage.style.display = 'block';
      this.errorMessage.style.backgroundColor = '#fff3cd';
      this.errorMessage.style.borderColor = '#ffeaa7';
      this.errorMessage.style.color = '#856404';
      
      // 10秒後に自動的に非表示
      setTimeout(() => {
        this.hideStorageWarning();
      }, 10000);
    }
  }

  /**
   * ストレージ警告メッセージを非表示
   */
  hideStorageWarning() {
    if (this.errorMessage) {
      this.errorMessage.classList.remove('show');
      this.errorMessage.style.display = 'none';
      this.errorMessage.textContent = '';
      // スタイルをリセット
      this.errorMessage.style.backgroundColor = '';
      this.errorMessage.style.borderColor = '';
      this.errorMessage.style.color = '';
    }
  }

  /**
   * ストレージエラーを処理
   * 要件 4.1 に対応 - LocalStorageエラーハンドリング
   * @param {string} error - エラーメッセージ
   */
  handleStorageError(error) {
    console.error('Storage error occurred:', error);
    
    // ストレージ容量不足の場合
    if (error.includes('ストレージ容量が不足')) {
      this.showStorageWarning('ストレージ容量が不足しています。ブラウザのデータを整理してください。');
      return;
    }
    
    // 一般的なストレージエラーの場合
    this.showStorageWarning('データの保存中にエラーが発生しました。一時的に保存されます。');
    
    // フォールバック機能の確認
    const storageInfo = this.storageManager.getStorageInfo();
    if (!storageInfo.isLocalStorageAvailable) {
      this.showStorageWarning('ブラウザのストレージが利用できません。データは一時的に保存されます。');
    }
  }

  /**
   * ストレージの健全性をチェック
   * 要件 4.1 に対応 - LocalStorageエラーハンドリング
   * @returns {Object} チェック結果 { healthy: boolean, issues: string[] }
   */
  checkStorageHealth() {
    const issues = [];
    
    try {
      // LocalStorageの可用性をチェック
      const storageInfo = this.storageManager.getStorageInfo();
      if (!storageInfo.isLocalStorageAvailable) {
        issues.push('LocalStorageが利用できません');
      }
      
      // データの整合性をチェック
      const validationResult = this.storageManager.validateStorageData();
      if (!validationResult.success) {
        issues.push(`データの整合性に問題があります: ${validationResult.error}`);
      }
      
      // ストレージ容量をチェック（簡易的）
      try {
        const testData = 'x'.repeat(1000); // 1KB のテストデータ
        localStorage.setItem('__storage_test__', testData);
        localStorage.removeItem('__storage_test__');
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          issues.push('ストレージ容量が不足している可能性があります');
        }
      }
      
      return {
        healthy: issues.length === 0,
        issues: issues
      };
    } catch (error) {
      issues.push(`ストレージチェック中にエラーが発生しました: ${error.message}`);
      return {
        healthy: false,
        issues: issues
      };
    }
  }

  /**
   * ストレージの自動回復を試行
   * 要件 4.1 に対応 - LocalStorageエラーハンドリング
   * @returns {boolean} 回復成功時true
   */
  attemptStorageRecovery() {
    try {
      console.log('Attempting storage recovery...');
      
      // 1. LocalStorageの再チェック
      this.storageManager.isLocalStorageAvailable = this.storageManager.checkLocalStorageSupport();
      
      // 2. データの再保存を試行
      if (this.storageManager.isLocalStorageAvailable && this.todos.length > 0) {
        const saveResult = this.storageManager.saveTodos(this.todos);
        if (saveResult.success) {
          console.log('Storage recovery successful');
          this.showStorageWarning('ストレージが回復しました。データが正常に保存されています。');
          return true;
        }
      }
      
      // 3. フォールバックモードの確認
      if (!this.storageManager.isLocalStorageAvailable) {
        console.log('Using fallback storage mode');
        this.showStorageWarning('フォールバックストレージを使用しています。');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Storage recovery failed:', error);
      return false;
    }
  }

  /**
   * タスク完了切り替えのUIハンドリング
   * 要件 2.1, 2.3 に対応
   * @param {string} id - 切り替えるタスクのID
   */
  handleToggleTodo(id) {
    const result = this.toggleTodo(id);

    if (result.success) {
      // 成功時: UIを更新
      if (typeof this.render === 'function') {
        this.render();
      }
      
      const status = result.todo.completed ? '完了' : '未完了';
      console.log(`Task toggled successfully: ${result.todo.text} -> ${status}`);
    } else {
      // エラー時: エラーメッセージを表示
      // ストレージエラーの場合は特別な処理
      if (result.error.includes('保存に失敗しました')) {
        this.handleStorageError(result.error);
      } else {
        this.showErrorMessage(result.error);
      }
      console.error('Failed to toggle task:', result.error);
    }
  }

  /**
   * チェックボックスのイベントリスナーを設定
   * 動的に生成されるチェックボックスに対してイベントデリゲーションを使用
   */
  setupToggleEventListeners() {
    if (this.todoList) {
      // イベントデリゲーションを使用してチェックボックスのクリックを処理
      this.todoList.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox' && event.target.dataset.todoId) {
          const todoId = event.target.dataset.todoId;
          this.handleToggleTodo(todoId);
        }
      });
    }
  }

  /**
   * タスク削除のUIハンドリング
   * 要件 3.1, 3.2 に対応
   * @param {string} id - 削除するタスクのID
   */
  handleDeleteTodo(id) {
    const result = this.deleteTodo(id);

    if (result.success) {
      // 成功時: UIを即座に更新（要件 3.2）
      if (typeof this.render === 'function') {
        this.render();
      }
      
      console.log(`Task deleted successfully: ${result.deletedTodo.text}`);
      this.showSuccessMessage(`タスク「${result.deletedTodo.text}」を削除しました`);
    } else {
      // エラー時: エラーメッセージを表示
      // ストレージエラーの場合は特別な処理
      if (result.error.includes('保存に失敗しました')) {
        this.handleStorageError(result.error);
      } else {
        this.showErrorMessage(result.error);
      }
      console.error('Failed to delete task:', result.error);
    }
  }

  /**
   * 削除ボタンのイベントリスナーを設定
   * 動的に生成される削除ボタンに対してイベントデリゲーションを使用
   */
  setupDeleteEventListeners() {
    if (this.todoList) {
      // イベントデリゲーションを使用して削除ボタンのクリックを処理
      this.todoList.addEventListener('click', (event) => {
        if (event.target.classList.contains('todo-delete') && event.target.dataset.todoId) {
          const todoId = event.target.dataset.todoId;
          
          // 確認ダイアログを表示（オプション）
          const todo = this.todos.find(t => t.id === todoId);
          if (todo && confirm(`タスク「${todo.text}」を削除しますか？`)) {
            this.handleDeleteTodo(todoId);
          }
        }
      });
    }
  }
}

export default TodoApp;

/**
 * アプリケーション起動時の処理
 * 要件 4.1 に対応 - 保存されたタスクの読み込み機能を実装
 */
class AppBootstrap {
  constructor() {
    this.app = null;
    this.isInitialized = false;
  }

  /**
   * アプリケーションを起動
   * @returns {Promise<boolean>} 起動成功時true
   */
  async startApplication() {
    try {
      console.log('Starting Todo Application...');
      
      // 1. TodoAppインスタンスを作成
      this.app = new TodoApp();
      
      // 2. アプリケーションを初期化（保存されたタスクを読み込み）
      const initSuccess = await this.app.initialize();
      if (!initSuccess) {
        console.warn('Application initialized with warnings');
      }
      
      // 3. UI要素を初期化
      this.app.initializeUI();
      
      // 4. 初期レンダリングを実行
      this.app.render();
      
      // 5. ストレージヘルスチェックを開始
      this.startHealthMonitoring();
      
      // 6. グローバルアクセス用に公開（デバッグ用）
      if (typeof window !== 'undefined') {
        window.todoApp = this.app;
      }
      
      this.isInitialized = true;
      
      // 7. 起動完了ログ
      const appState = this.app.getAppState();
      console.log('Todo App successfully started!', {
        ...appState,
        startupTime: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to start Todo Application:', error);
      this.handleStartupError(error);
      return false;
    }
  }

  /**
   * 定期的なストレージヘルスチェックを開始
   */
  startHealthMonitoring() {
    if (!this.app) return;
    
    // 5分間隔でストレージの健全性をチェック
    setInterval(() => {
      try {
        const healthCheck = this.app.checkStorageHealth();
        if (!healthCheck.healthy) {
          console.warn('Storage health issues detected:', healthCheck.issues);
          // 自動回復を試行
          const recoverySuccess = this.app.attemptStorageRecovery();
          if (recoverySuccess) {
            console.log('Storage recovery completed successfully');
          } else {
            console.warn('Storage recovery failed, continuing with current state');
          }
        }
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, 5 * 60 * 1000); // 5分間隔
  }

  /**
   * 起動エラーを処理
   * @param {Error} error - 起動エラー
   */
  handleStartupError(error) {
    // エラーメッセージを表示
    const errorContainer = document.getElementById('error-message');
    if (errorContainer) {
      errorContainer.textContent = 'アプリケーションの起動に失敗しました。ページを再読み込みしてください。';
      errorContainer.style.display = 'block';
      errorContainer.classList.add('show');
    }
    
    // フォールバック: 基本的なアプリケーションを起動
    try {
      console.log('Attempting fallback initialization...');
      this.app = new TodoApp();
      this.app.todos = []; // 空の状態で開始
      this.app.initialized = true;
      this.app.initializeUI();
      this.app.render();
      
      console.log('Fallback initialization completed');
    } catch (fallbackError) {
      console.error('Fallback initialization also failed:', fallbackError);
    }
  }

  /**
   * アプリケーションの状態を取得
   * @returns {Object} アプリケーション状態
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasApp: !!this.app,
      appState: this.app ? this.app.getAppState() : null
    };
  }
}

// アプリケーションの自動起動
if (typeof window !== 'undefined') {
  window.TodoApp = TodoApp;
  
  // DOMContentLoadedイベント後にアプリケーションを起動
  document.addEventListener('DOMContentLoaded', async () => {
    const bootstrap = new AppBootstrap();
    const startupSuccess = await bootstrap.startApplication();
    
    if (startupSuccess) {
      console.log('Todo App is ready for use!');
    } else {
      console.error('Todo App startup completed with errors');
    }
    
    // デバッグ用にbootstrapも公開
    window.todoAppBootstrap = bootstrap;
  });
  
  // ページ離脱時の処理
  window.addEventListener('beforeunload', () => {
    if (window.todoApp && window.todoApp.initialized) {
      // 最終的なデータ保存を試行
      try {
        const saveResult = window.todoApp.storageManager.saveTodos(window.todoApp.todos);
        if (!saveResult.success) {
          console.warn('Final save before unload failed:', saveResult.error);
        }
      } catch (error) {
        console.warn('Error during final save:', error);
      }
    }
  });
}