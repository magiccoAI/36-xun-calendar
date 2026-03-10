// Node.js环境边界测试检查器
import { readFileSync } from 'fs';
import { join } from 'path';

class BoundaryTestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      issues: []
    };
  }

  async runQuickBoundaryTests() {
    console.log('🚀 开始36旬项目边界测试 (Node.js版)...\n');

    // 1. 代码质量检查
    await this.testCodeQuality();
    
    // 2. 配置文件验证
    await this.testConfigFiles();
    
    // 3. 依赖安全性检查
    await this.testDependencies();
    
    // 4. 文件结构完整性
    await this.testFileStructure();
    
    // 5. 性能基准检查
    await this.testPerformanceBasics();

    this.generateReport();
  }

  async testCodeQuality() {
    console.log('📝 检查代码质量...');
    
    try {
      // Q001: 检查Calendar.js关键函数
      const calendarPath = join(process.cwd(), 'src/core/Calendar.js');
      const calendarContent = readFileSync(calendarPath, 'utf8');
      
      if (calendarContent.includes('getXunPeriods') && 
          calendarContent.includes('formatLocalDate') &&
          calendarContent.includes('getCurrentXun')) {
        this.recordSuccess('Q001', 'Calendar.js核心函数完整');
      } else {
        this.recordFailure('Q001', 'Calendar.js缺少核心函数');
      }

      // Q002: 检查错误处理模式
      const hasErrorHandling = calendarContent.includes('try') && 
                           calendarContent.includes('catch');
      if (hasErrorHandling) {
        this.recordSuccess('Q002', 'Calendar.js包含错误处理');
      } else {
        this.recordFailure('Q002', 'Calendar.js缺少错误处理');
      }

      // Q003: 检查State.js数据验证
      const statePath = join(process.cwd(), 'src/core/State.js');
      const stateContent = readFileSync(statePath, 'utf8');
      
      if (stateContent.includes('JSON.parse') && 
          stateContent.includes('localStorage') &&
          stateContent.includes('migrateData')) {
        this.recordSuccess('Q003', 'State.js数据管理完整');
      } else {
        this.recordFailure('Q003', 'State.js数据管理不完整');
      }

    } catch (error) {
      this.recordFailure('CODE_ERROR', '代码质量检查异常', { error: error.message });
    }
  }

  async testConfigFiles() {
    console.log('⚙️ 检查配置文件...');
    
    try {
      // C001: 检查package.json
      const packagePath = join(process.cwd(), 'package.json');
      const packageContent = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      if (packageContent.scripts && 
          packageContent.devDependencies && 
          packageContent.version) {
        this.recordSuccess('C001', 'package.json配置完整');
      } else {
        this.recordFailure('C001', 'package.json配置不完整');
      }

      // C002: 检查config.js
      const configPath = join(process.cwd(), 'src/config.js');
      try {
        const configContent = readFileSync(configPath, 'utf8');
        if (configContent.includes('CONFIG') && 
            configContent.includes('YEAR') &&
            configContent.includes('XUN_COUNT')) {
          this.recordSuccess('C002', 'config.js配置正确');
        } else {
          this.recordFailure('C002', 'config.js配置缺失');
        }
      } catch (configError) {
        this.recordFailure('C002', 'config.js文件不存在');
      }

    } catch (error) {
      this.recordFailure('CONFIG_ERROR', '配置文件检查异常', { error: error.message });
    }
  }

  async testDependencies() {
    console.log('📦 检查依赖安全性...');
    
    try {
      const packagePath = join(process.cwd(), 'package.json');
      const packageContent = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      // D001: 检查是否有已知的安全漏洞依赖
      const devDeps = Object.keys(packageContent.devDependencies || {});
      const riskyPackages = ['lodash', 'moment', 'request']; // 示例
      const foundRisky = devDeps.filter(dep => 
        riskyPackages.some(risky => dep.toLowerCase().includes(risky))
      );
      
      if (foundRisky.length === 0) {
        this.recordSuccess('D001', '无明显安全风险依赖');
      } else {
        this.recordFailure('D001', '发现潜在安全风险依赖', { packages: foundRisky });
      }

      // D002: 检查测试覆盖率配置
      if (packageContent.jest && packageContent.jest.coverageThreshold) {
        this.recordSuccess('D002', '测试覆盖率配置存在');
      } else {
        this.recordFailure('D002', '缺少测试覆盖率配置');
      }

    } catch (error) {
      this.recordFailure('DEP_ERROR', '依赖检查异常', { error: error.message });
    }
  }

  async testFileStructure() {
    console.log('📁 检查文件结构...');
    
    try {
      const requiredFiles = [
        'src/core/Calendar.js',
        'src/core/State.js',
        'src/core/app.js',
        'src/components/MacroView.js',
        'src/components/DetailView.js',
        'src/components/SummaryView.js',
        'package.json',
        'index.html'
      ];

      let missingFiles = [];
      for (const file of requiredFiles) {
        try {
          readFileSync(join(process.cwd(), file), 'utf8');
        } catch (error) {
          missingFiles.push(file);
        }
      }

      if (missingFiles.length === 0) {
        this.recordSuccess('F001', '核心文件结构完整');
      } else {
        this.recordFailure('F001', '核心文件缺失', { files: missingFiles });
      }

      // F002: 检查图片资源
      const imageDir = join(process.cwd(), 'src/images');
      try {
        const imageFiles = ['spring-bg.jpg', 'summer-bg.jpg', 'autumn-bg.jpg'];
        let missingImages = [];
        
        for (const image of imageFiles) {
          try {
            readFileSync(join(imageDir, image));
          } catch (error) {
            missingImages.push(image);
          }
        }
        
        if (missingImages.length === 0) {
          this.recordSuccess('F002', '主题图片资源完整');
        } else {
          this.recordFailure('F002', '主题图片资源缺失', { files: missingImages });
        }
      } catch (error) {
        this.recordFailure('F002', '图片目录不存在');
      }

    } catch (error) {
      this.recordFailure('FILE_ERROR', '文件结构检查异常', { error: error.message });
    }
  }

  async testPerformanceBasics() {
    console.log('⚡ 检查性能基准...');
    
    try {
      // P001: 检查文件大小
      const criticalFiles = [
        'src/core/Calendar.js',
        'src/core/State.js',
        'src/components/SummaryView.js'
      ];

      let totalSize = 0;
      for (const file of criticalFiles) {
        try {
          const content = readFileSync(join(process.cwd(), file), 'utf8');
          totalSize += content.length;
        } catch (error) {
          // 忽略文件不存在的错误
        }
      }

      const sizeKB = (totalSize / 1024).toFixed(2);
      if (totalSize < 50000) { // 小于50KB
        this.recordSuccess('P001', `核心文件大小合理 (${sizeKB}KB)`);
      } else {
        this.recordFailure('P001', '核心文件过大', { 
          size: sizeKB + 'KB',
          threshold: '50KB'
        });
      }

      // P002: 检查图片文件大小
      const imageDir = join(process.cwd(), 'src/images');
      const bgImages = ['spring-bg.jpg', 'summer-bg.jpg', 'autumn-bg.jpg'];
      let largeImages = [];

      for (const image of bgImages) {
        try {
          // 优先检查优化后的图片
          const optimizedPath = join(imageDir, 'optimized', image);
          let stats;
          
          try {
            stats = readFileSync(optimizedPath);
          } catch (error) {
            // 如果优化版本不存在，检查原始版本
            stats = readFileSync(join(imageDir, image));
          }
          
          const sizeMB = (stats.length / 1024 / 1024).toFixed(2);
          if (stats.length > 2 * 1024 * 1024) { // 大于2MB
            largeImages.push({ name: image, size: sizeMB + 'MB' });
          }
        } catch (error) {
          // 忽略文件不存在的错误
        }
      }

      if (largeImages.length === 0) {
        this.recordSuccess('P002', '背景图片大小合理');
      } else {
        this.recordFailure('P002', '背景图片过大', { images: largeImages });
      }

    } catch (error) {
      this.recordFailure('PERFORMANCE_ERROR', '性能检查异常', { error: error.message });
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
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 36旬项目边界测试报告');
    console.log('='.repeat(60));
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
      console.log('🟢 优秀 - 项目质量很高，边界处理完善');
    } else if (passRate >= 75) {
      console.log('🟡 良好 - 基础功能稳定，有改进空间');
    } else if (passRate >= 50) {
      console.log('🟠 一般 - 存在一些稳定性风险，需要优化');
    } else {
      console.log('🔴 需要关注 - 存在较多问题，建议重构');
    }
    
    console.log('\n📈 改进建议:');
    if (this.results.failed > 0) {
      console.log('  1. 实施完整的错误边界处理');
      console.log('  2. 添加输入验证和数据清理');
      console.log('  3. 优化大文件和图片资源');
      console.log('  4. 增加单元测试覆盖率');
      console.log('  5. 实施性能监控和日志');
    }
    
    console.log('='.repeat(60));
  }
}

// 运行测试
const runner = new BoundaryTestRunner();
runner.runQuickBoundaryTests().catch(console.error);
