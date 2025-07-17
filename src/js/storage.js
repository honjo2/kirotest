/**
 * StorageManager クラス - LocalStorageとの連携を管理
 * 要件 4.1 に対応
 */

import Todo from './todo.js';

/**
 * LocalStorage操作の結果を表すクラス
 */
class StorageResult {
  constructor(success, data = null, error = null) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  /**
   * 成功結果を作成
   * @param {*} data - 成功時のデータ
   * @returns {StorageResult}
   */
  static success(data = null) {
    return new StorageResult(true, data);
  }

  /**
   * エラー結果を作成
   * @param {string} error - エラーメッセージ
   * @returns {StorageResult}
   */
  static error(error) {
    return new StorageResult(false, null, error);
  }
}

/**
 * LocalStorageを使用したデータ永続化を管理するクラス
 */
class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'simple-todo-app-todos';
    this.isLocalStorageAvailable = this.checkLocalStorageSupport();
    this.fallbackData = []; // LocalStorageが使用できない場合のフォールバック
  }

  /**
   * LocalStorageのサポート状況をチェック
   * @returns {boolean} LocalStorageが使用可能な場合true
   */
  checkLocalStorageSupport() {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('LocalStorage is not available:', e.message);
      return false;
    }
  }

  /**
   * タスクをLocalStorageに保存
   * @param {Todo[]} todos - 保存するタスクの配列
   * @returns {StorageResult} 保存結果
   */
  saveTodos(todos) {
    try {
      // 入力バリデーション
      if (!Array.isArray(todos)) {
        return StorageResult.error('保存するデータは配列である必要があります');
      }

      // Todoインスタンスの検証
      for (const todo of todos) {
        if (!(todo instanceof Todo)) {
          return StorageResult.error('配列にはTodoインスタンスのみを含める必要があります');
        }
      }

      // JSON形式に変換
      const todosJson = todos.map(todo => todo.toJSON());
      const dataString = JSON.stringify(todosJson);

      if (this.isLocalStorageAvailable) {
        // LocalStorageに保存
        localStorage.setItem(this.STORAGE_KEY, dataString);
      } else {
        // フォールバック: メモリに保存
        this.fallbackData = [...todosJson];
      }

      return StorageResult.success();
    } catch (error) {
      // ストレージ容量不足やその他のエラーをハンドリング
      if (error.name === 'QuotaExceededError') {
        return StorageResult.error('ストレージ容量が不足しています。不要なデータを削除してください。');
      }
      
      // フォールバックを試行
      try {
        const todosJson = todos.map(todo => todo.toJSON());
        this.fallbackData = [...todosJson];
        return StorageResult.success();
      } catch (fallbackError) {
        return StorageResult.error(`データの保存に失敗しました: ${error.message}`);
      }
    }
  }

  /**
   * LocalStorageからタスクを読み込み
   * @returns {StorageResult} 読み込み結果（成功時はTodo配列を含む）
   */
  loadTodos() {
    try {
      let dataString = null;

      if (this.isLocalStorageAvailable) {
        // LocalStorageから読み込み
        dataString = localStorage.getItem(this.STORAGE_KEY);
      } else {
        // フォールバックから読み込み
        if (this.fallbackData.length > 0) {
          dataString = JSON.stringify(this.fallbackData);
        }
      }

      // データが存在しない場合は空配列を返す
      if (!dataString) {
        return StorageResult.success([]);
      }

      // JSON解析
      const todosJson = JSON.parse(dataString);

      // バリデーション
      if (!Array.isArray(todosJson)) {
        throw new Error('保存されたデータの形式が無効です');
      }

      // TodoインスタンスとしてRestore
      const todos = todosJson.map(todoJson => {
        try {
          return Todo.fromJSON(todoJson);
        } catch (error) {
          console.warn('無効なTodoデータをスキップしました:', todoJson, error.message);
          return null;
        }
      }).filter(todo => todo !== null);

      return StorageResult.success(todos);
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error.message);
      
      // データ破損時のフォールバック: 空配列を返す
      return StorageResult.success([]);
    }
  }

  /**
   * すべてのタスクをクリア
   * @returns {StorageResult} クリア結果
   */
  clearTodos() {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
      
      // フォールバックデータもクリア
      this.fallbackData = [];

      return StorageResult.success();
    } catch (error) {
      return StorageResult.error(`データのクリアに失敗しました: ${error.message}`);
    }
  }

  /**
   * ストレージの使用状況を取得（デバッグ用）
   * @returns {Object} ストレージ情報
   */
  getStorageInfo() {
    const info = {
      isLocalStorageAvailable: this.isLocalStorageAvailable,
      fallbackDataCount: this.fallbackData.length
    };

    if (this.isLocalStorageAvailable) {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        info.localStorageDataSize = data ? data.length : 0;
        info.hasLocalStorageData = !!data;
      } catch (error) {
        info.localStorageError = error.message;
      }
    }

    return info;
  }

  /**
   * データの整合性をチェック
   * @returns {StorageResult} チェック結果
   */
  validateStorageData() {
    const loadResult = this.loadTodos();
    
    if (!loadResult.success) {
      return StorageResult.error('データの読み込みに失敗しました');
    }

    const todos = loadResult.data;
    const invalidTodos = [];

    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i];
      try {
        // Todoインスタンスの基本的な検証
        if (!(todo instanceof Todo)) {
          invalidTodos.push({ index: i, reason: 'Todoインスタンスではありません' });
          continue;
        }

        // 必須プロパティの検証
        if (!todo.id || !todo.text) {
          invalidTodos.push({ index: i, reason: 'IDまたはテキストが不正です' });
        }
      } catch (error) {
        invalidTodos.push({ index: i, reason: error.message });
      }
    }

    if (invalidTodos.length > 0) {
      return StorageResult.error(`無効なデータが見つかりました: ${JSON.stringify(invalidTodos)}`);
    }

    return StorageResult.success({ validTodosCount: todos.length });
  }
}

export { StorageManager, StorageResult };