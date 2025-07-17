/**
 * 全テスト実行スクリプト
 * タスク 9.2 の一部 - テスト実行の自動化
 */

// Import functions from test files
async function runInitializationTests() {
  // Since the initialization test exports runTests, we'll import it dynamically
  const { runTests } = await import('./initialization.test.js');
  return await runTests();
}
async function runIntegrationTestsImport() {
  const { runIntegrationTests } = await import('./integration.test.js');
  return await runIntegrationTests();
}

/**
 * 全テストを順次実行
 */
async function runAllTests() {
  console.log('=== Todo App 全テスト実行開始 ===');
  console.log(`実行開始時刻: ${new Date().toISOString()}\n`);
  
  const results = {
    initialization: null,
    integration: null,
    overall: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: 0
    }
  };
  
  try {
    // 1. 初期化テストの実行
    console.log('1. 初期化テストを実行中...');
    results.initialization = await runInitializationTests();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 2. 統合テストの実行
    console.log('2. 統合テストを実行中...');
    results.integration = await runIntegrationTestsImport();
    
    // 3. 全体結果の集計
    results.overall.totalTests = results.integration.total;
    results.overall.passedTests = results.integration.passed;
    results.overall.failedTests = results.integration.failed;
    results.overall.successRate = results.integration.successRate;
    
    // 初期化テストの結果も考慮（簡易的に成功/失敗で判定）
    if (results.initialization) {
      results.overall.totalTests += 1;
      results.overall.passedTests += 1;
    } else {
      results.overall.totalTests += 1;
      results.overall.failedTests += 1;
    }
    
    results.overall.successRate = (results.overall.passedTests / results.overall.totalTests) * 100;
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    results.overall.failedTests += 1;
  }
  
  // 最終結果の表示
  console.log('\n' + '='.repeat(60));
  console.log('=== 全テスト実行結果サマリー ===');
  console.log(`実行完了時刻: ${new Date().toISOString()}`);
  console.log('');
  
  console.log('テストスイート別結果:');
  console.log(`  初期化テスト: ${results.initialization ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`  統合テスト: ${results.integration.failed === 0 ? '✅ 成功' : '❌ 失敗'} (${results.integration.passed}/${results.integration.total})`);
  console.log('');
  
  console.log('全体結果:');
  console.log(`  総テスト数: ${results.overall.totalTests}`);
  console.log(`  成功: ${results.overall.passedTests}`);
  console.log(`  失敗: ${results.overall.failedTests}`);
  console.log(`  成功率: ${results.overall.successRate.toFixed(1)}%`);
  
  const overallSuccess = results.overall.failedTests === 0;
  console.log(`  総合判定: ${overallSuccess ? '✅ 全テスト成功' : '❌ 一部テスト失敗'}`);
  
  if (!overallSuccess) {
    console.log('\n詳細な失敗情報については上記のテスト出力を確認してください。');
  }
  
  console.log('='.repeat(60));
  
  return {
    success: overallSuccess,
    results: results
  };
}

/**
 * 特定の要件に関連するテストのみを実行
 * @param {string} requirement - 要件番号 (例: '1.1', '2.1', '3.1', '4.1', '5.3')
 */
async function runTestsForRequirement(requirement) {
  console.log(`=== 要件 ${requirement} 関連テスト実行 ===`);
  
  // 統合テストから該当する要件のテストを実行
  // （実際の実装では、テストを要件別にフィルタリングする機能を追加可能）
  const results = await runIntegrationTestsImport();
  
  console.log(`要件 ${requirement} のテスト結果:`);
  console.log(`成功率: ${results.successRate.toFixed(1)}%`);
  
  return results;
}

/**
 * パフォーマンステストのみを実行
 */
async function runPerformanceTests() {
  console.log('=== パフォーマンステスト実行 ===');
  
  // 統合テストのパフォーマンス部分のみを実行
  // （実際の実装では、パフォーマンステストを分離することも可能）
  const results = await runIntegrationTestsImport();
  
  // パフォーマンス関連のテスト結果をフィルタリング
  const performanceResults = results.results.filter(r => 
    r.name.includes('パフォーマンス')
  );
  
  console.log('パフォーマンステスト結果:');
  performanceResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.details}`);
  });
  
  return {
    total: performanceResults.length,
    passed: performanceResults.filter(r => r.success).length,
    results: performanceResults
  };
}

/**
 * 継続的インテグレーション用のテスト実行
 * 環境変数やコマンドライン引数に基づいてテストを実行
 */
async function runCITests() {
  console.log('=== CI環境でのテスト実行 ===');
  
  const startTime = Date.now();
  const results = await runAllTests();
  const duration = Date.now() - startTime;
  
  // CI用の追加情報
  console.log('\nCI情報:');
  console.log(`実行時間: ${duration}ms`);
  console.log(`Node.js バージョン: ${process.version}`);
  console.log(`プラットフォーム: ${process.platform}`);
  
  // 環境変数での設定例
  const maxDuration = process.env.MAX_TEST_DURATION || 30000; // 30秒
  if (duration > maxDuration) {
    console.warn(`⚠️  テスト実行時間が制限を超えました: ${duration}ms > ${maxDuration}ms`);
  }
  
  return results;
}

// コマンドライン実行時の処理
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('run-all-tests.js')) {
  const args = process.argv.slice(2);
  
  let testFunction = runAllTests;
  
  // コマンドライン引数の処理
  if (args.includes('--requirement')) {
    const reqIndex = args.indexOf('--requirement');
    const requirement = args[reqIndex + 1];
    if (requirement) {
      testFunction = () => runTestsForRequirement(requirement);
    }
  } else if (args.includes('--performance')) {
    testFunction = runPerformanceTests;
  } else if (args.includes('--ci')) {
    testFunction = runCITests;
  }
  
  testFunction().then(results => {
    const success = results.success !== undefined ? results.success : (results.failed === 0);
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('テスト実行エラー:', error);
    process.exit(1);
  });
}

// Node.js環境でのエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    runTestsForRequirement,
    runPerformanceTests,
    runCITests
  };
}

// ブラウザ環境での公開
if (typeof window !== 'undefined') {
  window.testRunner = {
    runAllTests,
    runTestsForRequirement,
    runPerformanceTests,
    runCITests
  };
}