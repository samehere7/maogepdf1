# 📊 生产环境监控和日志配置

## 🔍 Vercel Analytics 设置

### 1. 开启 Vercel Analytics
```javascript
// 在 next.config.js 中添加
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  // 开启 Vercel Analytics
  analytics: {
    provider: 'vercel'
  }
}

module.exports = nextConfig
```

### 2. Web Vitals 监控
```javascript
// 在 pages/_app.js 或 app/layout.js 中添加
import { Analytics } from '@vercel/analytics/react';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

## 📈 性能监控指标

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: 页面主要内容加载时间
- **FID (First Input Delay)**: 首次输入延迟
- **CLS (Cumulative Layout Shift)**: 累积布局偏移

### 自定义指标
- API响应时间
- PDF处理时间
- 用户活跃度
- 错误率

## 🚨 错误监控

### 1. 前端错误捕获
```javascript
// utils/errorTracking.js
export const trackError = (error, context = {}) => {
  console.error('[错误追踪]', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });

  // 可以集成第三方错误监控服务
  // 如 Sentry, LogRocket 等
};

// 全局错误处理
window.addEventListener('error', (event) => {
  trackError(event.error, {
    type: 'uncaught_error',
    filename: event.filename,
    lineno: event.lineno
  });
});
```

### 2. API错误监控
```javascript
// lib/api-monitor.js
export const monitorApiCall = async (apiName, apiFunction) => {
  const startTime = Date.now();
  
  try {
    const result = await apiFunction();
    const duration = Date.now() - startTime;
    
    console.log(`[API监控] ${apiName} 成功`, {
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`[API监控] ${apiName} 失败`, {
      error: error.message,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
};
```

## 📋 日志配置

### 1. 结构化日志格式
```javascript
// utils/logger.js
export const logger = {
  info: (message, context = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  },
  
  error: (message, error, context = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        message: error?.message,
        stack: error?.stack
      },
      context,
      timestamp: new Date().toISOString()
    }));
  },
  
  warn: (message, context = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  }
};
```

### 2. API路由日志中间件
```javascript
// middleware/logging.js
export function withLogging(handler) {
  return async (req, res) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    logger.info('API请求开始', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']
    });
    
    try {
      await handler(req, res);
      
      const duration = Date.now() - startTime;
      logger.info('API请求完成', {
        requestId,
        status: res.statusCode,
        duration: `${duration}ms`
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API请求失败', error, {
        requestId,
        duration: `${duration}ms`
      });
      throw error;
    }
  };
}
```

## 🎯 关键业务指标监控

### 1. 用户行为监控
```javascript
// utils/analytics.js
export const trackUserAction = (action, properties = {}) => {
  const event = {
    action,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId(),
      sessionId: getSessionId()
    }
  };
  
  // 发送到分析服务
  console.log('[用户行为]', event);
};

// 使用示例
trackUserAction('pdf_upload', {
  fileSize: file.size,
  fileType: file.type
});

trackUserAction('chat_message_sent', {
  messageLength: message.length,
  pdfId: currentPdfId
});
```

### 2. 业务指标仪表板
```javascript
// components/AdminDashboard.js
const MetricCard = ({ title, value, trend }) => (
  <div className="metric-card">
    <h3>{title}</h3>
    <div className="value">{value}</div>
    <div className={`trend ${trend}`}>
      {trend === 'up' ? '↗️' : '↘️'}
    </div>
  </div>
);

// 关键指标
const keyMetrics = [
  { title: '日活用户', value: '1,234', trend: 'up' },
  { title: 'PDF上传数', value: '567', trend: 'up' },
  { title: '聊天消息数', value: '8,901', trend: 'up' },
  { title: '支付转化率', value: '12.3%', trend: 'down' }
];
```

## 🔔 告警配置

### 1. 关键错误告警
```javascript
// utils/alerting.js
export const criticalErrorAlert = (error, context) => {
  const alertData = {
    level: 'critical',
    error: error.message,
    context,
    timestamp: new Date().toISOString()
  };
  
  // 发送告警到各种渠道
  sendSlackAlert(alertData);
  sendEmailAlert(alertData);
  
  console.error('[关键错误告警]', alertData);
};

// 阈值监控
export const checkThresholds = (metrics) => {
  if (metrics.errorRate > 0.05) {
    criticalErrorAlert(new Error('错误率过高'), {
      errorRate: metrics.errorRate,
      threshold: 0.05
    });
  }
  
  if (metrics.responseTime > 5000) {
    criticalErrorAlert(new Error('响应时间过长'), {
      responseTime: metrics.responseTime,
      threshold: 5000
    });
  }
};
```

### 2. 健康检查端点
```javascript
// pages/api/health.js
export default async function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks: {}
  };
  
  try {
    // 数据库连接检查
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
  }
  
  try {
    // AI服务检查
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
    });
    health.checks.ai_service = response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    health.checks.ai_service = 'unhealthy';
    health.status = 'unhealthy';
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}
```

## 📊 监控仪表板

### 推荐工具
1. **Vercel Analytics** - 基础性能监控
2. **Sentry** - 错误追踪和性能监控
3. **LogRocket** - 用户会话重放
4. **Datadog** - 全栈监控
5. **New Relic** - 应用性能监控

### 自建简单仪表板
```javascript
// components/SimpleMonitoring.js
export const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState({});
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30秒更新
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="monitoring-dashboard">
      <h2>系统监控</h2>
      <div className="metrics-grid">
        <MetricCard 
          title="活跃用户"
          value={metrics.activeUsers}
          trend={metrics.userTrend}
        />
        <MetricCard 
          title="API响应时间"
          value={`${metrics.avgResponseTime}ms`}
          trend={metrics.responseTrend}
        />
        <MetricCard 
          title="错误率"
          value={`${metrics.errorRate}%`}
          trend={metrics.errorTrend}
        />
      </div>
    </div>
  );
};
```

---

**部署后立即设置监控，确保生产环境稳定运行！**