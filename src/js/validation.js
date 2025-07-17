/**
 * 入力バリデーション機能
 * 要件 1.2 に対応
 */

/**
 * バリデーション結果を表すクラス
 */
class ValidationResult {
  constructor(isValid, errorMessage = null) {
    this.isValid = isValid;
    this.errorMessage = errorMessage;
  }

  /**
   * 成功結果を作成
   * @returns {ValidationResult}
   */
  static success() {
    return new ValidationResult(true);
  }

  /**
   * エラー結果を作成
   * @param {string} message - エラーメッセージ
   * @returns {ValidationResult}
   */
  static error(message) {
    return new ValidationResult(false, message);
  }
}

/**
 * 入力バリデーション機能を提供するクラス
 */
class InputValidator {
  /**
   * タスクテキストの包括的なバリデーション
   * @param {string} text - 検証するテキスト
   * @returns {ValidationResult} バリデーション結果
   */
  static validateTaskText(text) {
    // null/undefined チェック
    if (text === null || text === undefined) {
      return ValidationResult.error('タスクのテキストが入力されていません');
    }

    // 文字列型チェック
    if (typeof text !== 'string') {
      return ValidationResult.error('タスクのテキストは文字列である必要があります');
    }

    // 空文字列チェック
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return ValidationResult.error('タスクのテキストは空にできません');
    }

    // 最大文字数チェック
    if (trimmedText.length > 200) {
      return ValidationResult.error('タスクのテキストは200文字以内で入力してください');
    }

    // 最小文字数チェック（1文字以上）
    if (trimmedText.length < 1) {
      return ValidationResult.error('タスクのテキストは1文字以上入力してください');
    }

    // 特殊文字のチェック（基本的なサニタイズ）
    if (this.containsUnsafeCharacters(trimmedText)) {
      return ValidationResult.error('使用できない文字が含まれています');
    }

    return ValidationResult.success();
  }

  /**
   * 空のテキスト入力の検証
   * @param {string} text - 検証するテキスト
   * @returns {ValidationResult} バリデーション結果
   */
  static validateNotEmpty(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return ValidationResult.error('入力は空にできません');
    }
    return ValidationResult.success();
  }

  /**
   * 最大文字数制限の検証
   * @param {string} text - 検証するテキスト
   * @param {number} maxLength - 最大文字数（デフォルト: 200）
   * @returns {ValidationResult} バリデーション結果
   */
  static validateMaxLength(text, maxLength = 200) {
    if (!text || typeof text !== 'string') {
      return ValidationResult.error('テキストが無効です');
    }

    if (text.trim().length > maxLength) {
      return ValidationResult.error(`テキストは${maxLength}文字以内で入力してください`);
    }

    return ValidationResult.success();
  }

  /**
   * 最小文字数制限の検証
   * @param {string} text - 検証するテキスト
   * @param {number} minLength - 最小文字数（デフォルト: 1）
   * @returns {ValidationResult} バリデーション結果
   */
  static validateMinLength(text, minLength = 1) {
    if (!text || typeof text !== 'string') {
      return ValidationResult.error('テキストが無効です');
    }

    if (text.trim().length < minLength) {
      return ValidationResult.error(`テキストは${minLength}文字以上入力してください`);
    }

    return ValidationResult.success();
  }

  /**
   * 危険な文字が含まれているかチェック
   * @param {string} text - 検証するテキスト
   * @returns {boolean} 危険な文字が含まれている場合true
   */
  static containsUnsafeCharacters(text) {
    // 基本的なXSS対策として、スクリプトタグや危険なHTMLタグをチェック
    const unsafePatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    return unsafePatterns.some(pattern => pattern.test(text));
  }

  /**
   * テキストをサニタイズ（HTMLエスケープ）
   * @param {string} text - サニタイズするテキスト
   * @returns {string} サニタイズされたテキスト
   */
  static sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }

  /**
   * 複数のバリデーションを組み合わせて実行
   * @param {string} text - 検証するテキスト
   * @param {Array<Function>} validators - バリデーション関数の配列
   * @returns {ValidationResult} 最初に失敗したバリデーション結果、またはすべて成功の場合は成功結果
   */
  static validateAll(text, validators) {
    for (const validator of validators) {
      const result = validator(text);
      if (!result.isValid) {
        return result;
      }
    }
    return ValidationResult.success();
  }
}

export { InputValidator, ValidationResult };