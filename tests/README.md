# Test Suite

This directory contains comprehensive tests for the DI framework.

## Middleware Isolation Tests

### Purpose
Verify that Express middleware isolation works correctly in different routing scenarios.

### Test Coverage

1. **Different Mount Points** - `/api` vs `/api/admin`
   - ✅ Same controller paths with different mount points
   - ✅ Independent middleware execution
   - ✅ No cross-contamination

2. **Different Base Paths** - `/users` vs `/products`
   - ✅ Completely separate routing
   - ✅ Perfect isolation
   - ✅ Independent middleware execution

3. **Path Containment** - `/order` vs `/order/extended`
   - ✅ Express "most specific first" routing
   - ✅ Correct middleware execution order
   - ✅ No unintended middleware execution

### Running Tests

```bash
# Automated testing
npm run test:middleware

# Manual testing (server stays running)
npm run test:middleware-manual

# All tests
npm run test:all
```

### Test Results

The tests verify that:
- Middleware pollution only occurs with identical final paths
- Different mount points provide perfect isolation
- Path containment follows Express routing rules correctly
- Framework warnings and detection work as expected

### Expected Output

Successful tests show:
- ✅ All middleware executions are isolated
- ✅ No unexpected middleware crossover
- ✅ Correct Express routing behavior
- ✅ Framework detection warnings (in development mode)
