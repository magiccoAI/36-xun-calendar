export class BackgroundLoader {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.currentTheme = null;
    this.isMobile = this.detectMobile();
    
    // 预加载关键资源
    this.preloadCritical();
  }

  detectMobile() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  preloadCritical() {
    // 预加载默认主题的移动端背景
    const defaultTheme = 'spring';
    this.loadTheme(defaultTheme, true);
  }

  async loadTheme(themeName, isPreload = false) {
    if (this.cache.has(themeName)) {
      const cachedImageUrl = this.cache.get(themeName);
      if (!isPreload) {
        this.applyBackground(cachedImageUrl, themeName);
      }
      return cachedImageUrl;
    }

    if (this.loadingPromises.has(themeName)) {
      const loadingPromise = this.loadingPromises.get(themeName);
      const imageUrl = await loadingPromise;
      if (!isPreload && imageUrl) {
        this.applyBackground(imageUrl, themeName);
      }
      return imageUrl;
    }

    const loadPromise = this.loadThemeImage(themeName, isPreload);
    this.loadingPromises.set(themeName, loadPromise);

    try {
      const imageUrl = await loadPromise;
      this.cache.set(themeName, imageUrl);
      this.loadingPromises.delete(themeName);
      if (!isPreload && imageUrl) {
        this.applyBackground(imageUrl, themeName);
      }
      return imageUrl;
    } catch (error) {
      console.error(`Failed to load theme ${themeName}:`, error);
      this.loadingPromises.delete(themeName);
      return null;
    }
  }

  async loadThemeImage(themeName, isPreload = false) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // 移动端使用压缩版本
      const imagePath = this.isMobile 
        ? `src/images/mobile/${themeName}-bg-small.jpg`
        : this.supportsWebP() 
          ? `src/images/webp/${themeName}-bg.webp`
          : `src/images/optimized/${themeName}-bg.jpg`;

      img.onload = () => {
        resolve(imagePath);
      };

      img.onerror = () => {
        // 降级到原始图片
        const fallbackPath = themeName === 'winter' 
          ? `src/images/optimized/winter-body.jpg`  // Winter特殊处理
          : `src/images/${themeName}-bg.jpg`;
        const fallbackImg = new Image();
        
        fallbackImg.onload = () => {
          resolve(fallbackPath);
        };
        
        fallbackImg.onerror = reject;
        fallbackImg.src = fallbackPath;
      };

      img.src = imagePath;
    });
  }

  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  applyBackground(imageUrl, themeName) {
    const body = document.body;
    
    // 添加加载状态
    body.classList.add('theme-loading');
    
    // 预加载图片后再应用
    const img = new Image();
    img.onload = () => {
      // 移除加载状态
      setTimeout(() => {
        body.classList.remove('theme-loading');
        body.classList.add(`theme-${themeName}`);
        
        // 移除旧主题
        const oldTheme = this.currentTheme;
        if (oldTheme && oldTheme !== themeName) {
          body.classList.remove(`theme-${oldTheme}`);
        }
        
        // 特殊处理winter主题的双层背景
        if (themeName === 'winter') {
          // winter主题需要特殊处理，因为有两层背景
          const winterBodyPath = this.isMobile 
            ? 'src/images/mobile/winter-bg-small.jpg'
            : this.supportsWebP() 
              ? 'src/images/webp/winter-body.webp'
              : 'src/images/optimized/winter-body.jpg';
              
          const winterTopPath = this.isMobile
            ? 'src/images/mobile/winter-bg-small.jpg'
            : this.supportsWebP() 
              ? 'src/images/webp/winter-top.webp'
              : 'src/images/optimized/winter-top.jpg';
          
          // 设置body背景
          body.style.backgroundImage = `url('${winterBodyPath}')`;
          body.style.backgroundRepeat = 'repeat';
          body.style.backgroundSize = '300px 300px';
          
          // 设置::after伪元素的背景
          const afterStyle = document.createElement('style');
          afterStyle.textContent = `
            body.theme-winter::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 450px;
              background-image: url('${winterTopPath}');
              background-size: cover;
              background-position: center;
              z-index: -1;
              mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
              -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
            }
          `;
          document.head.appendChild(afterStyle);
        } else {
          // 其他主题直接设置背景图片
          body.style.backgroundImage = `url('${imageUrl}')`;
          body.style.backgroundRepeat = 'no-repeat';
          body.style.backgroundSize = 'cover';
          body.style.backgroundPosition = 'center';
        }
        
        this.currentTheme = themeName;
      }, 300); // 短暂延迟以显示加载效果
    };
    
    img.onerror = () => {
      body.classList.remove('theme-loading');
      console.error(`Failed to apply background for theme ${themeName}`);
    };
    
    img.src = imageUrl;
  }

  // 预加载下一个可能的主题
  preloadNextTheme(currentTheme) {
    const themes = ['spring', 'summer', 'autumn', 'winter'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    this.loadTheme(nextTheme, true);
  }

  // 根据季节自动预加载
  seasonalPreload() {
    const month = new Date().getMonth();
    let seasonalTheme;
    
    if (month >= 2 && month <= 4) seasonalTheme = 'spring';
    else if (month >= 5 && month <= 7) seasonalTheme = 'summer';
    else if (month >= 8 && month <= 10) seasonalTheme = 'autumn';
    else seasonalTheme = 'winter';
    
    this.loadTheme(seasonalTheme, true);
  }

  // 清理缓存以释放内存
  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  // 获取缓存统计
  getCacheStats() {
    return {
      cached: this.cache.size,
      loading: this.loadingPromises.size,
      isMobile: this.isMobile,
      supportsWebP: this.supportsWebP()
    };
  }
}

// 单例模式
export const backgroundLoader = new BackgroundLoader();
