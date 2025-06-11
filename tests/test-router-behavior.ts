import express from 'express';

const app = express();

// 测试1：默认配置 - 会有中间件污染
console.log('\n=== 测试1: 默认配置 ===');
const router1_default = express.Router();
const router2_default = express.Router();

router1_default.use((req, res, next) => {
  console.log('Router1 (默认) 中间件被调用:', req.path);
  next();
});

router1_default.post('/cart', (req, res) => {
  res.send('Cart from router1 (default)');
});

router2_default.post('/category', (req, res) => {
  res.send('Category from router2 (default)');
});

app.use('/shop-default', router1_default);
app.use('/shop-default', router2_default);

// 测试2：严格配置 - 尝试避免中间件污染
console.log('\n=== 测试2: 严格配置 ===');
const strictOptions = { 
  strict: true, 
  caseSensitive: true, 
  mergeParams: false 
};

const router1_strict = express.Router(strictOptions);
const router2_strict = express.Router(strictOptions);

router1_strict.use((req, res, next) => {
  console.log('Router1 (严格) 中间件被调用:', req.path);
  next();
});

router1_strict.post('/cart', (req, res) => {
  res.send('Cart from router1 (strict)');
});

router2_strict.post('/category', (req, res) => {
  res.send('Category from router2 (strict)');
});

app.use('/shop-strict', router1_strict);
app.use('/shop-strict', router2_strict);

// 测试3：不同的挂载方式 - 完全避免路径冲突
console.log('\n=== 测试3: 不同挂载路径 ===');
const router1_separate = express.Router();
const router2_separate = express.Router();

router1_separate.use((req, res, next) => {
  console.log('Router1 (独立路径) 中间件被调用:', req.path);
  next();
});

router1_separate.post('/', (req, res) => {  // 注意这里改为 '/'
  res.send('Cart from router1 (separate)');
});

router2_separate.post('/', (req, res) => {  // 注意这里改为 '/'
  res.send('Category from router2 (separate)');
});

// 挂载到不同的路径
app.use('/shop-separate/cart', router1_separate);
app.use('/shop-separate/category', router2_separate);

// 测试4：使用路径特异性
console.log('\n=== 测试4: 路径特异性 ===');
const router1_specific = express.Router();
const router2_specific = express.Router();

// 只为特定路径添加中间件
router1_specific.use('/cart', (req, res, next) => {
  console.log('Router1 (特定路径) 中间件被调用:', req.path);
  next();
});

router1_specific.post('/cart', (req, res) => {
  res.send('Cart from router1 (specific)');
});

router2_specific.post('/category', (req, res) => {
  res.send('Category from router2 (specific)');
});

app.use('/shop-specific', router1_specific);
app.use('/shop-specific', router2_specific);

app.listen(3001, () => {
  console.log('Test server running on port 3001');
  console.log('\n测试路径:');
  console.log('POST http://localhost:3001/shop-default/cart');
  console.log('POST http://localhost:3001/shop-default/category');
  console.log('POST http://localhost:3001/shop-strict/cart');
  console.log('POST http://localhost:3001/shop-strict/category');
  console.log('POST http://localhost:3001/shop-separate/cart');
  console.log('POST http://localhost:3001/shop-separate/category');
  console.log('POST http://localhost:3001/shop-specific/cart');
  console.log('POST http://localhost:3001/shop-specific/category');
});
