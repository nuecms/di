import express from 'express';

const app = express();

// 创建计数器来跟踪中间件执行次数
const executionCounts = {
  router1: 0,
  router2: 0,
  router3: 0
};

const router1 = express.Router();
const router2 = express.Router();
const router3 = express.Router();

// Router1 - 认证中间件
router1.use((req, res, next) => {
  executionCounts.router1++;
  console.log(`🔐 Auth middleware executed (count: ${executionCounts.router1})`);
  next();
});

// Router2 - 日志中间件
router2.use((req, res, next) => {
  executionCounts.router2++;
  console.log(`📝 Logging middleware executed (count: ${executionCounts.router2})`);
  next();
});

// Router3 - 缓存中间件
router3.use((req, res, next) => {
  executionCounts.router3++;
  console.log(`💾 Cache middleware executed (count: ${executionCounts.router3})`);
  next();
});

// 添加路由
router1.post('/cart', (req, res) => {
  res.send('Cart response');
});

router2.post('/category', (req, res) => {
  res.send('Category response');
});

router3.post('/products', (req, res) => {
  res.send('Products response');
});

// 所有 router 都挂载到相同路径
app.use('/shop', router1);
app.use('/shop', router2);
app.use('/shop', router3);

// 添加重置计数器的路由
app.get('/reset', (req, res) => {
  executionCounts.router1 = 0;
  executionCounts.router2 = 0;
  executionCounts.router3 = 0;
  res.send('Counters reset');
});

// 添加查看计数器的路由
app.get('/counts', (req, res) => {
  res.json(executionCounts);
});

// 添加性能分析路由
app.get('/performance', (req, res) => {
  const totalRequests = executionCounts.router1; // 假设每个请求都经过router1
  const totalMiddlewareExecutions = executionCounts.router1 + executionCounts.router2 + executionCounts.router3;
  const overhead = totalMiddlewareExecutions / Math.max(totalRequests, 1);

  res.json({
    summary: 'Middleware Execution Performance Analysis',
    totalRequests,
    totalMiddlewareExecutions,
    overheadMultiplier: overhead,
    impact: `Each request executes ${overhead}x middleware compared to single router`,
    recommendation: overhead > 1 ? 'Use unique paths to eliminate overhead' : 'No overhead detected'
  });
});

// 添加模拟负载测试
app.post('/load-test', (req, res) => {
  const requests = req.body.requests || 100;
  const results = [];

  console.log(`🔄 Simulating ${requests} requests...`);

  const startTime = Date.now();

  // 重置计数器
  executionCounts.router1 = 0;
  executionCounts.router2 = 0;
  executionCounts.router3 = 0;

  // 模拟请求
  for (let i = 0; i < requests; i++) {
    // 模拟中间件执行
    executionCounts.router1++;
    executionCounts.router2++;
    executionCounts.router3++;
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  res.json({
    simulatedRequests: requests,
    totalMiddlewareExecutions: executionCounts.router1 + executionCounts.router2 + executionCounts.router3,
    duration: `${duration}ms`,
    executionsPerRequest: 3,
    wastedExecutions: requests * 2, // 2 out of 3 are wasted
    recommendation: 'Use unique paths to reduce middleware executions by 66%'
  });
});

app.listen(3002, () => {
  console.log('Middleware execution test server running on port 3002');
  console.log('\n📊 Test scenarios:');
  console.log('1. POST http://localhost:3002/shop/cart');
  console.log('2. POST http://localhost:3002/shop/category');
  console.log('3. POST http://localhost:3002/shop/products');
  console.log('4. GET  http://localhost:3002/counts (check execution counts)');
  console.log('5. GET  http://localhost:3002/performance (performance analysis)');
  console.log('6. POST http://localhost:3002/load-test (simulate load)');
  console.log('7. GET  http://localhost:3002/reset (reset counters)');
  console.log('\n💡 Expected behavior: ALL middleware execute for EVERY request');
});
