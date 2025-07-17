/**
 * エラーハンドリング機能のテスト
 * 要件 1.2 に対応
 */

import TodoApp from '../js/app.js';
import { InputValidator } from '../js/validation.js';

/**
 * DOM環境のモック
 */
function createMockDOM() {
  const mockElements = {
    todoInput: {
      value: '',
      classList: {
        add: jest.fn(),
        remove: jest.fn()
      },
      addEventListener: jest.fn()
    },
    addButton: {
      addEventListener: jest.fn()
    },
    todoList: {
      innerHTML: '',
      appendChild: jest.fn(),
      addEventListener: jest.fn()
    },
    emptyMessage: {
      style: { display: 'none' }
    },
    errorMessage: {
      textContent: '',
      classList: {
        add: jest.fn(),
        remove: jest.fn()
      },
      style: { display: 'none' }
    }
  };

  // document.getElementById のモック
  global.document = {
    getElementById: jest.fn((id) => {
      const elementMap = {
        'todo-text': mockElements.todoInput,
        'add-todo': mockElements.addButton,
        'todo-list': mockElements.todoList,
        'empty-message': mockElements.emptyMessage,
        'error-message': mockElements.errorMessage
      };
      return elementMap[id] || null;
    }),
    addEventListener: jest.fn()
  };

  return mockElements;
}

describe('エラーハンドリング機能', () => {
  let app;
  let mockElements;
  let originalLocalStorage;

  beforeEach(() => {
    // DOM環境をモック
    mockElements = createMockDOM();
    
    // LocalStorageをモック
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    
    // TodoAppインスタンスを作成
    app = new TodoApp();
    app.initializeUI();
  });

  afterEach(() => {
    // タイマーをクリア
    jest.clearAllTimers();
    // LocalStorageを復元
    global.localStorage = originalLocalStorage;
  });

  describe('入力バリデーション', () => {
    test('空のテキストでエラーメッセージが表示される', () => {
      const result = app.addTodo('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('タスクのテキストは空にできません');
    });

    test('空白のみのテキストでエラーメッセージが表示される', () => {
      const result = app.addTodo('   ');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('タスクのテキストは空にできません');
    });

    test('200文字を超えるテキストでエラーメッセージが表示される', () => {
      const longText = 'a'.repeat(201);
      const result = app.addTodo(longText);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('タスクのテキストは200文字以内で入力してください');
    });

    test('危険な文字が含まれる場合エラーメッセージが表示される', () => {
      const dangerousText = '<script>alert("xss")</script>';
      const result = app.addTodo(dangerousText);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('使用できない文字が含まれています');
    });
  });

  describe('エラーメッセージ表示機能', () => {
    test('showErrorMessage でエラーメッセージが表示される', () => {
      const errorMessage = 'テストエラーメッセージ';
      
      app.showErrorMessage(errorMessage);
      
      expect(mockElements.errorMessage.textContent).toBe(errorMessage);
      expect(mockElements.errorMessage.classList.add).toHaveBeenCalledWith('show');
      expect(mockElements.errorMessage.style.display).toBe('block');
      expect(mockElements.todoInput.classList.add).toHaveBeenCalledWith('error');
    });

    test('hideErrorMessage でエラーメッセージが非表示になる', () => {
      app.hideErrorMessage();
      
      expect(mockElements.errorMessage.classList.remove).toHaveBeenCalledWith('show');
      expect(mockElements.errorMessage.style.display).toBe('none');
      expect(mockElements.errorMessage.textContent).toBe('');
      expect(mockElements.todoInput.classList.remove).toHaveBeenCalledWith('error');
    });

    test('成功時にエラーメッセージが自動的に非表示になる', () => {
      app.showSuccessMessage('成功メッセージ');
      
      expect(mockElements.errorMessage.classList.remove).toHaveBeenCalledWith('show');
      expect(mockElements.errorMessage.style.display).toBe('none');
    });
  });

  describe('LocalStorageエラーハンドリング', () => {
    test('LocalStorage利用不可時に警告メッセージが表示される', async () => {
      // LocalStorageを無効化
      global.localStorage.setItem.mockImplementation(() => {
        throw new Error('LocalStorage not available');
      });
      
      // アプリを初期化
      await app.initialize();
      
      // 警告メッセージが表示されることを確認
      expect(mockElements.errorMessage.textContent).toContain('ブラウザのストレージが利用できません');
    });

    test('ストレージ容量不足時に適切なエラーメッセージが表示される', () => {
      // QuotaExceededErrorをシミュレート
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      app.handleStorageError('保存に失敗しました: ストレージ容量が不足しています');
      
      expect(mockElements.errorMessage.textContent).toContain('ストレージ容量が不足しています');
    });

    test('ストレージヘルスチェックが正常に動作する', () => {
      const healthCheck = app.checkStorageHealth();
      
      expect(healthCheck).toHaveProperty('healthy');
      expect(healthCheck).toHaveProperty('issues');
      expect(Array.isArray(healthCheck.issues)).toBe(true);
    });

    test('ストレージ回復機能が動作する', () => {
      const recoveryResult = app.attemptStorageRecovery();
      
      expect(typeof recoveryResult).toBe('boolean');
    });

    test('ストレージエラー時にフォールバック機能が動作する', () => {
      // LocalStorageエラーをシミュレート
      global.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      app.handleStorageError('保存に失敗しました: Storage error');
      
      expect(mockElements.errorMessage.textContent).toContain('一時的に保存されます');
    });
  });

  describe('UI統合テスト', () => {
    test('無効な入力でタスク追加を試行するとエラーが表示される', () => {
      // 空のテキストを設定
      mockElements.todoInput.value = '';
      
      // タスク追加を実行
      app.handleAddTodo();
      
      // エラーメッセージが表示されることを確認
      expect(mockElements.errorMessage.textContent).toBeTruthy();
      expect(mockElements.errorMessage.classList.add).toHaveBeenCalledWith('show');
      expect(mockElements.todoInput.classList.add).toHaveBeenCalledWith('error');
    });

    test('有効な入力でタスク追加が成功する', () => {
      // 有効なテキストを設定
      mockElements.todoInput.value = '有効なタスク';
      
      // タスク追加を実行
      app.handleAddTodo();
      
      // 入力フィールドがクリアされることを確認
      expect(mockElements.todoInput.value).toBe('');
    });
  });
});

describe('InputValidator', () => {
  describe('validateTaskText', () => {
    test('有効なテキストで成功を返す', () => {
      const result = InputValidator.validateTaskText('有効なタスク');
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    test('空のテキストでエラーを返す', () => {
      const result = InputValidator.validateTaskText('');
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('タスクのテキストは空にできません');
    });

    test('nullでエラーを返す', () => {
      const result = InputValidator.validateTaskText(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('タスクのテキストが入力されていません');
    });

    test('文字列以外でエラーを返す', () => {
      const result = InputValidator.validateTaskText(123);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('タスクのテキストは文字列である必要があります');
    });

    test('長すぎるテキストでエラーを返す', () => {
      const longText = 'a'.repeat(201);
      const result = InputValidator.validateTaskText(longText);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('タスクのテキストは200文字以内で入力してください');
    });
  });

  describe('sanitizeText', () => {
    test('HTMLタグがエスケープされる', () => {
      const input = '<script>alert("xss")</script>';
      const result = InputValidator.sanitizeText(input);
      
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('特殊文字がエスケープされる', () => {
      const input = '& < > " \'';
      const result = InputValidator.sanitizeText(input);
      
      expect(result).toBe('&amp; &lt; &gt; &quot; &#x27;');
    });

    test('通常のテキストはそのまま返される', () => {
      const input = '普通のタスク';
      const result = InputValidator.sanitizeText(input);
      
      expect(result).toBe('普通のタスク');
    });
  });
});

// 手動テスト実行用の関数
export function runErrorHandlingTests() {
  console.log('エラーハンドリング機能のテストを実行中...');
  
  const testCases = [
    testEmptyInputValidation,
    testLongInputValidation,
    testDangerousInputValidation,
    testSanitization
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    try {
      testCase();
      console.log(`✓ エラーハンドリングテスト ${index + 1}: 成功`);
      passedTests++;
    } catch (error) {
      console.error(`✗ エラーハンドリングテスト ${index + 1}: 失敗 - ${error.message}`);
    }
  });
  
  console.log(`\nエラーハンドリングテスト結果: ${passedTests}/${totalTests} 成功`);
  return passedTests === totalTests;
}

// 個別テスト関数
function testEmptyInputValidation() {
  const result = InputValidator.validateTaskText('');
  if (result.isValid) {
    throw new Error('空の入力でバリデーションが通ってしまいました');
  }
}

function testLongInputValidation() {
  const longText = 'a'.repeat(201);
  const result = InputValidator.validateTaskText(longText);
  if (result.isValid) {
    throw new Error('長すぎる入力でバリデーションが通ってしまいました');
  }
}

function testDangerousInputValidation() {
  const dangerousText = '<script>alert("xss")</script>';
  const result = InputValidator.validateTaskText(dangerousText);
  if (result.isValid) {
    throw new Error('危険な入力でバリデーションが通ってしまいました');
  }
}

function testSanitization() {
  const input = '<script>test</script>';
  const result = InputValidator.sanitizeText(input);
  if (result.includes('<script>')) {
    throw new Error('サニタイズが正しく動作していません');
  }
}