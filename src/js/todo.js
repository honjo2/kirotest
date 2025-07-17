/**
 * Todo クラス - 個別のタスクを表現するデータモデル
 * 要件 1.1, 1.2 に対応
 */
class Todo {
  /**
   * Todo インスタンスを作成
   * @param {string} id - ユニークID
   * @param {string} text - タスクのテキスト
   * @param {boolean} completed - 完了状態（デフォルト: false）
   * @param {Date} createdAt - 作成日時（デフォルト: 現在時刻）
   */
  constructor(id, text, completed = false, createdAt = new Date()) {
    // バリデーション実行
    this.validateId(id);
    this.validateText(text);
    this.validateCompleted(completed);
    this.validateCreatedAt(createdAt);

    this.id = id;
    this.text = text;
    this.completed = completed;
    this.createdAt = createdAt;
  }

  /**
   * ID のバリデーション
   * @param {string} id - 検証するID
   * @throws {Error} IDが無効な場合
   */
  validateId(id) {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('ID は空でない文字列である必要があります');
    }
  }

  /**
   * テキストのバリデーション
   * @param {string} text - 検証するテキスト
   * @throws {Error} テキストが無効な場合
   */
  validateText(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('テキストは文字列である必要があります');
    }
    
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      throw new Error('タスクのテキストは空にできません');
    }
    
    if (trimmedText.length > 200) {
      throw new Error('タスクのテキストは200文字以内である必要があります');
    }
  }

  /**
   * 完了状態のバリデーション
   * @param {boolean} completed - 検証する完了状態
   * @throws {Error} 完了状態が無効な場合
   */
  validateCompleted(completed) {
    if (typeof completed !== 'boolean') {
      throw new Error('完了状態はboolean値である必要があります');
    }
  }

  /**
   * 作成日時のバリデーション
   * @param {Date} createdAt - 検証する作成日時
   * @throws {Error} 作成日時が無効な場合
   */
  validateCreatedAt(createdAt) {
    if (!(createdAt instanceof Date) || isNaN(createdAt.getTime())) {
      throw new Error('作成日時は有効なDate オブジェクトである必要があります');
    }
  }

  /**
   * タスクの完了状態を切り替える
   * @returns {Todo} 新しい状態のTodoインスタンス（イミュータブル）
   */
  toggle() {
    return new Todo(this.id, this.text, !this.completed, this.createdAt);
  }

  /**
   * タスクのテキストを更新する
   * @param {string} newText - 新しいテキスト
   * @returns {Todo} 新しいテキストのTodoインスタンス（イミュータブル）
   */
  updateText(newText) {
    return new Todo(this.id, newText, this.completed, this.createdAt);
  }

  /**
   * TodoオブジェクトをJSON形式に変換
   * @returns {Object} JSON表現
   */
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      completed: this.completed,
      createdAt: this.createdAt.toISOString()
    };
  }

  /**
   * JSON形式からTodoインスタンスを作成
   * @param {Object} json - JSON表現
   * @returns {Todo} Todoインスタンス
   */
  static fromJSON(json) {
    return new Todo(
      json.id,
      json.text,
      json.completed,
      new Date(json.createdAt)
    );
  }

  /**
   * ユニークIDを生成する
   * @returns {string} ユニークID
   */
  static generateId() {
    return 'todo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export default Todo;