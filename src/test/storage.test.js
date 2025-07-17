/**
 * StorageManager の単体テスト
 * 要件 4.1 に対応
 */

import { StorageManager, StorageResult } from '../js/storage.js';
import Todo from '../js/todo.js';

/**
 * テスト用のモックLocalStorage
 */
class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    if (typeof value !== 'string') {
      throw new Error('Value must be a string');
    }
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

/**
 * テストスイート: StorageManager
 */
describe('StorageManager', () => {
  let storageManager;
  let originalLocalStorage;
  let mockLocalStorage;

  beforeEach(() => {
    // LocalStorageのモックを設定
    originalLocalStorage = global.localStorage;
    mockLocalStorage = new MockLocalStorage();
    global.localStorage = mockLocalStorage;
    
    storageManager = new StorageManager();
  });

  afterEach(() => {
    // LocalStorageを元に戻す
    global.localStorage = originalLocalStorage;
  });

  describe('constructor', () => {
    test('正常にインスタンスが作成される', () => {
      expect(storageManager).toBeInstanceOf(StorageManager);
      expect(storageManager.STORAGE_KEY).toBe('simple-todo-app-todos');
      expect(Array.isArray(storageManager.fallbackData)).toBe(true);
    });
  });

  describe('checkLocalStorageSupport', () => {
    test('LocalStorageが利用可能な場合はtrueを返す', () => {
      const result = storageManager.checkLocalStorageSupport();
      expect(result).toBe(true);
    });

    test('LocalStorageが利用不可能な場合はfalseを返す', () => {
      // LocalStorageを無効化
      global.localStorage = {
        setItem: () => { throw new Error('LocalStorage not available'); },
        removeItem: () => { throw new Error('LocalStorage not available'); }
      };
      
      const newStorageManager = new StorageManager();
      expect(newStorageManager.isLocalStorageAvailable).toBe(false);
    });
  });

  describe('saveTodos', () => {
    test('有効なTodo配列を正常に保存できる', () => {
      const todos = [
        new Todo('1', 'テストタスク1'),
        new Todo('2', 'テストタスク2', true)
      ];

      const result = storageManager.saveTodos(todos);
      
      expect(result).toBeInstanceOf(StorageResult);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    test('空の配列を正常に保存できる', () => {
      const result = storageManager.saveTodos([]);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    test('配列以外のデータを渡すとエラーを返す', () => {
      const result = storageManager.saveTodos('invalid data');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('保存するデータは配列である必要があります');
    });

    test('Todoインスタンス以外を含む配列を渡すとエラーを返す', () => {
      const invalidTodos = [
        new Todo('1', 'テストタスク1'),
        { id: '2', text: 'invalid todo' } // Todoインスタンスではない
      ];

      const result = storageManager.saveTodos(invalidTodos);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('配列にはTodoインスタンスのみを含める必要があります');
    });

    test('LocalStorageが利用不可能な場合はフォールバックを使用する', () => {
      // LocalStorageを無効化
      storageManager.isLocalStorageAvailable = false;
      
      const todos = [new Todo('1', 'テストタスク1')];
      const result = storageManager.saveTodos(todos);
      
      expect(result.success).toBe(true);
      expect(storageManager.fallbackData).toHaveLength(1);
      expect(storageManager.fallbackData[0].id).toBe('1');
    });
  });

  describe('loadTodos', () => {
    test('保存されたTodosを正常に読み込める', () => {
      // まずデータを保存
      const originalTodos = [
        new Todo('1', 'テストタスク1'),
        new Todo('2', 'テストタスク2', true)
      ];
      storageManager.saveTodos(originalTodos);

      // データを読み込み
      const result = storageManager.loadTodos();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toBeInstanceOf(Todo);
      expect(result.data[0].id).toBe('1');
      expect(result.data[0].text).toBe('テストタスク1');
      expect(result.data[0].completed).toBe(false);
      expect(result.data[1].id).toBe('2');
      expect(result.data[1].completed).toBe(true);
    });

    test('データが存在しない場合は空配列を返す', () => {
      const result = storageManager.loadTodos();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test('破損したデータがある場合は空配列を返す', () => {
      // 破損したJSONデータを直接設定
      mockLocalStorage.setItem('simple-todo-app-todos', 'invalid json');
      
      const result = storageManager.loadTodos();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test('LocalStorageが利用不可能な場合はフォールバックから読み込む', () => {
      // フォールバックデータを設定
      storageManager.isLocalStorageAvailable = false;
      storageManager.fallbackData = [
        { id: '1', text: 'フォールバックタスク', completed: false, createdAt: new Date().toISOString() }
      ];
      
      const result = storageManager.loadTodos();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].text).toBe('フォールバックタスク');
    });

    test('無効なTodoデータは除外される', () => {
      // 一部無効なデータを含むJSONを設定
      const mixedData = [
        { id: '1', text: '有効なタスク', completed: false, createdAt: new Date().toISOString() },
        { id: '', text: '', completed: false, createdAt: 'invalid date' }, // 無効
        { id: '3', text: '別の有効なタスク', completed: true, createdAt: new Date().toISOString() }
      ];
      mockLocalStorage.setItem('simple-todo-app-todos', JSON.stringify(mixedData));
      
      const result = storageManager.loadTodos();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // 無効なデータは除外される
      expect(result.data[0].text).toBe('有効なタスク');
      expect(result.data[1].text).toBe('別の有効なタスク');
    });
  });

  describe('clearTodos', () => {
    test('LocalStorageからデータを正常に削除できる', () => {
      // まずデータを保存
      const todos = [new Todo('1', 'テストタスク1')];
      storageManager.saveTodos(todos);
      
      // データをクリア
      const result = storageManager.clearTodos();
      
      expect(result.success).toBe(true);
      expect(mockLocalStorage.getItem('simple-todo-app-todos')).toBeNull();
    });

    test('フォールバックデータもクリアされる', () => {
      storageManager.fallbackData = [{ id: '1', text: 'test' }];
      
      const result = storageManager.clearTodos();
      
      expect(result.success).toBe(true);
      expect(storageManager.fallbackData).toEqual([]);
    });
  });

  describe('getStorageInfo', () => {
    test('ストレージ情報を正常に取得できる', () => {
      const info = storageManager.getStorageInfo();
      
      expect(info).toHaveProperty('isLocalStorageAvailable');
      expect(info).toHaveProperty('fallbackDataCount');
      expect(typeof info.isLocalStorageAvailable).toBe('boolean');
      expect(typeof info.fallbackDataCount).toBe('number');
    });

    test('LocalStorageが利用可能な場合は追加情報を含む', () => {
      const todos = [new Todo('1', 'テストタスク1')];
      storageManager.saveTodos(todos);
      
      const info = storageManager.getStorageInfo();
      
      expect(info).toHaveProperty('localStorageDataSize');
      expect(info).toHaveProperty('hasLocalStorageData');
      expect(info.hasLocalStorageData).toBe(true);
      expect(info.localStorageDataSize).toBeGreaterThan(0);
    });
  });

  describe('validateStorageData', () => {
    test('有効なデータの場合は成功を返す', () => {
      const todos = [
        new Todo('1', 'テストタスク1'),
        new Todo('2', 'テストタスク2', true)
      ];
      storageManager.saveTodos(todos);
      
      const result = storageManager.validateStorageData();
      
      expect(result.success).toBe(true);
      expect(result.data.validTodosCount).toBe(2);
    });

    test('データが存在しない場合も成功を返す', () => {
      const result = storageManager.validateStorageData();
      
      expect(result.success).toBe(true);
      expect(result.data.validTodosCount).toBe(0);
    });
  });

  describe('統合テスト', () => {
    test('保存→読み込み→削除の一連の流れが正常に動作する', () => {
      // 1. データを保存
      const originalTodos = [
        new Todo('1', 'タスク1'),
        new Todo('2', 'タスク2', true),
        new Todo('3', 'タスク3')
      ];
      
      const saveResult = storageManager.saveTodos(originalTodos);
      expect(saveResult.success).toBe(true);
      
      // 2. データを読み込み
      const loadResult = storageManager.loadTodos();
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toHaveLength(3);
      
      // 3. データの内容を検証
      const loadedTodos = loadResult.data;
      expect(loadedTodos[0].id).toBe('1');
      expect(loadedTodos[0].text).toBe('タスク1');
      expect(loadedTodos[0].completed).toBe(false);
      expect(loadedTodos[1].completed).toBe(true);
      
      // 4. データをクリア
      const clearResult = storageManager.clearTodos();
      expect(clearResult.success).toBe(true);
      
      // 5. クリア後の確認
      const finalLoadResult = storageManager.loadTodos();
      expect(finalLoadResult.success).toBe(true);
      expect(finalLoadResult.data).toEqual([]);
    });

    test('LocalStorage障害時のフォールバック動作', () => {
      // LocalStorageを無効化
      storageManager.isLocalStorageAvailable = false;
      
      const todos = [new Todo('1', 'フォールバックテスト')];
      
      // 保存（フォールバックを使用）
      const saveResult = storageManager.saveTodos(todos);
      expect(saveResult.success).toBe(true);
      
      // 読み込み（フォールバックから）
      const loadResult = storageManager.loadTodos();
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toHaveLength(1);
      expect(loadResult.data[0].text).toBe('フォールバックテスト');
    });
  });
});

// テスト実行用のヘルパー関数
export function runStorageTests() {
  console.log('StorageManager テストを実行中...');
  
  // 基本的なテストケースを手動で実行
  const testCases = [
    testBasicSaveAndLoad,
    testEmptyData,
    testInvalidData,
    testClearData
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    try {
      testCase();
      console.log(`✓ テスト ${index + 1}: 成功`);
      passedTests++;
    } catch (error) {
      console.error(`✗ テスト ${index + 1}: 失敗 - ${error.message}`);
    }
  });
  
  console.log(`\nテスト結果: ${passedTests}/${totalTests} 成功`);
  return passedTests === totalTests;
}

// 個別テスト関数
function testBasicSaveAndLoad() {
  const storageManager = new StorageManager();
  const todos = [
    new Todo('1', 'テストタスク1'),
    new Todo('2', 'テストタスク2', true)
  ];
  
  const saveResult = storageManager.saveTodos(todos);
  if (!saveResult.success) {
    throw new Error('保存に失敗しました');
  }
  
  const loadResult = storageManager.loadTodos();
  if (!loadResult.success || loadResult.data.length !== 2) {
    throw new Error('読み込みに失敗しました');
  }
}

function testEmptyData() {
  const storageManager = new StorageManager();
  const result = storageManager.loadTodos();
  
  if (!result.success || !Array.isArray(result.data)) {
    throw new Error('空データの処理に失敗しました');
  }
}

function testInvalidData() {
  const storageManager = new StorageManager();
  const result = storageManager.saveTodos('invalid');
  
  if (result.success) {
    throw new Error('無効データの検証に失敗しました');
  }
}

function testClearData() {
  const storageManager = new StorageManager();
  const todos = [new Todo('1', 'テスト')];
  
  storageManager.saveTodos(todos);
  const clearResult = storageManager.clearTodos();
  
  if (!clearResult.success) {
    throw new Error('データクリアに失敗しました');
  }
  
  const loadResult = storageManager.loadTodos();
  if (loadResult.data.length !== 0) {
    throw new Error('データが完全にクリアされていません');
  }
}