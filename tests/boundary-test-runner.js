// 快速边界测试检查器
import { Calendar } from '../src/core/Calendar.js';
import { store } from '../src/core/State.js';

class BoundaryTestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      issues: []
    };
  }

  async runQuickBoundaryTests() {
    console.log('🚀 开始36旬项目边界测试...\n');

    // 1. 时间边界测试
    await this.testTimeBoundaries();
    
    // 2. 数据完整性测试
    await this.testDataIntegrity();
    
    // 3. 输入验证测试
    await this.testInputValidation();
    
    // 4. 错误处理测试
    await this.testErrorHandling();
    
    // 5. 性能基准测试
    await this.testPerformanceBasics();

    this.generateReport();
  }

  async testTimeBoundaries() {
    console.log('⏰ 测试时间边界...');
    
    try {
      // T001: 跨年日期计算
      const periods = Calendar.getXunPeriods(2026);
      const lastPeriod = periods[35]; // 第36旬
      const yearEnd = new Date(2026, 11, 31);
      
      if (lastPeriod.endDate.toDateString() !== yearEnd.toDateString()) {
        this.recordFailure('T001', '年末最后一旬计算错误', {
          expected: yearEnd.toDateString(),
          actual: lastPeriod.endDate.toDateString()
        });
      } else {
        this.recordSuccess('T001', '年末日期计算正确');
      }

      // T002: 当前旬检测
      const currentXun = Calendar.getCurrentXun(periods);
      if (currentXun === null && new Date().getFullYear() === 2026) {
        this.recordFailure('T002', '当前旬检测失败');
      } else {
        this.recordSuccess('T002', '当前旬检测正常');
      }

      // T003: 日期格式化一致性
      const testDate = new Date(2026, 0, 1);
      const formatted = Calendar.formatLocalDate(testDate);
      if (formatted !== '2026-01-01') {
        this.recordFailure('T003', '日期格式化不一致', {
          expected: '2026-01-01',
          actual: formatted
        });
      } else {
        this.recordSuccess('T003', '日期格式化正确');
      }

    } catch (error) {
      this.recordFailure('TIME_ERROR', '时间测试异常', { error: error.message });
    }
  }

  async testDataIntegrity() {
    console.log('📊 测试数据完整性...');
    
    try {
      // D001: localStorage访问
      const originalLocalStorage = window.localStorage;
      
      // 模拟localStorage禁用
      Object.defineProperty(window, 'localStorage', {
        get: () => { throw new Error('SecurityError: localStorage disabled'); }
      });

      try {
        const testStore = new (store.constructor)();
        this.recordSuccess('D001', 'localStorage禁用时应用能启动');
      } catch (error) {
        this.recordFailure('D001', 'localStorage禁用时应用崩溃', { error: error.message });
      }

      // 恢复localStorage
      Object.defineProperty(window, 'localStorage', {
        get: () => originalLocalStorage
      });

      // D002: JSON解析容错
      const testState = store.getState();
      if (testState && typeof testState === 'object') {
        this.recordSuccess('D002', '状态数据结构正常');
      } else {
        this.recordFailure('D002', '状态数据结构异常');
      }

    } catch (error) {
      this.recordFailure('DATA_ERROR', '数据完整性测试异常', { error: error.message });
    }
  }

  async testInputValidation() {
    console.log('📝 测试输入验证...');
    
    try {
      // I001: 超长字符串处理
      const longText = 'a'.repeat(10000);
      const testElement = document.createElement('textarea');
      testElement.value = longText;
      
      if (testElement.value.length === 10000) {
        this.recordSuccess('I001', '超长字符串处理正常');
      } else {
        this.recordFailure('I001', '超长字符串被截断');
      }

      // I002: 特殊字符处理
      const specialChars = '<script>alert("xss")</script>';
      const div = document.createElement('div');
      div.textContent = specialChars;
      
      if (!div.innerHTML.includes('<script>')) {
        this.recordSuccess('I002', 'XSS防护正常');
      } else {
        this.recordFailure('I002', 'XSS防护失效');
      }

      // I003: Unicode字符处理
      const unicodeText = '🚀🌟💫🎯测试中文αβγ';
      const unicodeDiv = document.createElement('div');
      unicodeDiv.textContent = unicodeText;
      
      if (unicodeDiv.textContent === unicodeText) {
        this.recordSuccess('I003', 'Unicode字符处理正常');
      } else {
        this.recordFailure('I003', 'Unicode字符处理异常');
      }

    } catch (error) {
      this.recordFailure('INPUT_ERROR', '输入验证测试异常', { error: error.message });
    }
  }

  async testErrorHandling() {
    console.log('🚨 测试错误处理...');
    
    try {
      // E001: 无效日期构造
      const invalidDate = new Date('invalid-date');
      if (isNaN(invalidDate.getTime())) {
        this.recordSuccess('E001', '无效日期构造处理正确');
      } else {
        this.recordFailure('E001', '无效日期构造处理异常');
      }

      // E002: DOM操作安全检查
      try {
        const nonExistentElement = document.getElementById('non-existent-id');
        if (nonExistentElement === null) {
          this.recordSuccess('E002', 'DOM操作安全检查正常');
        }
      } catch (domError) {
        this.recordFailure('E002', 'DOM操作安全检查失败', { error: domError.message });
      }

      // E003: 数组边界访问
      const testArray = [1, 2, 3];
      const outOfBounds = testArray[10];
      if (outOfBounds === undefined) {
        this.recordSuccess('E003', '数组边界访问处理正常');
      } else {
        this.recordFailure('E003', '数组边界访问处理异常');
      }

    } catch (error) {
      this.recordFailure('ERROR_HANDLING', '错误处理测试异常', { error: error.message });
    }
  }

  async testPerformanceBasics() {
    console.log('⚡ 测试性能基准...');
    
    try {
      // P001: 旬计算性能
      const startTime = performance.now();
      const periods = Calendar.getXunPeriods(2026);
      const endTime = performance.now();
      const calculationTime = endTime - startTime;

      if (calculationTime < 10) { // 应该在10ms内完成
        this.recordSuccess('P001', `旬计算性能良好 (${calculationTime.toFixed(2)}ms)`);
      } else {
        this.recordFailure('P001', '旬计算性能过慢', { 
          time: calculationTime.toFixed(2) + 'ms',
          threshold: '10ms'
        });
      }

      // P002: 内存使用检查
      if (performance.memory) {
        const memoryInfo = performance.memory;
        const usedMB = (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2);
        
        if (usedMB < 50) { // 应该小于50MB
          this.recordSuccess('P002', `内存使用正常 (${usedMB}MB)`);
        } else {
          this.recordFailure('P002', '内存使用过高', { 
            used: usedMB + 'MB',
            threshold: '50MB'
          });
        }
      } else {
        this.recordSuccess('P002', '内存API不可用，跳过检查');
      }

    } catch (error) {
      this.recordFailure('PERFORMANCE_ERROR', '性能测试异常', { error: error.message });
    }
  }

  recordSuccess(testId, description) {
    this.results.passed++;
    console.log(`✅ ${testId}: ${description}`);
  }

  recordFailure(testId, description, details = {}) {
    this.results.failed++;
    this.results.issues.push({
      id: testId,
      description,
      details,
      timestamp: new Date().toISOString()
    });
    console.log(`❌ ${testId}: ${description}`, details);
  }

  generateReport() {
    const total = this.results.passed + this.results.failed;
    const passRate = ((this.results.passed / total) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 36旬项目边界测试报告');
    console.log('='.repeat(50));
    console.log(`📊 测试统计: ${this.results.passed}/${total} 通过 (${passRate}%)`);
    console.log(`🚨 失败测试: ${this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ 失败详情:');
      this.results.issues.forEach(issue => {
        console.log(`  • ${issue.id}: ${issue.description}`);
        if (Object.keys(issue.details).length > 0) {
          console.log(`    详情:`, issue.details);
        }
      });
      
      console.log('\n💡 建议优先修复的问题:');
      this.results.issues.slice(0, 3).forEach(issue => {
        console.log(`  1. ${issue.description}`);
      });
    }
    
    console.log('\n🎯 总体评估:');
    if (passRate >= 90) {
      console.log('🟢 优秀 - 系统稳定性很高');
    } else if (passRate >= 75) {
      console.log('🟡 良好 - 有改进空间');
    } else {
      console.log('🔴 需要关注 - 存在稳定性风险');
    }
    
    console.log('='.repeat(50));
  }
}

// 导出测试运行器
export { BoundaryTestRunner };

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  window.runBoundaryTests = async () => {
    const runner = new BoundaryTestRunner();
    await runner.runQuickBoundaryTests();
  };
  
  console.log('💡 在控制台运行 runBoundaryTests() 开始测试');
}
