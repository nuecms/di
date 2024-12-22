import { describe, it, expect, vi } from 'vitest';
import { createDeepProxy, createMetadata } from '../';

describe('createDeepProxy', () => {
  it('should create a deep proxy that correctly proxies nested objects', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
      },
    };
    const proxy = createDeepProxy(obj);

    // Test direct properties
    expect(proxy.a).toBe(1);

    // Test nested properties (should create a deep proxy)
    expect(proxy.b.c).toBe(2);

    // Modify a nested property
    proxy.b.c = 3;
    expect(proxy.b.c).toBe(3);
  });

  it('should call custom handler on get, set, and delete operations', () => {
    const handler = {
      get: vi.fn(),
      set: vi.fn(),
      deleteProperty: vi.fn(),
    };

    const obj = { a: 1 };
    const proxy = createDeepProxy(obj, handler);

    // Test get
    expect(proxy.a).toBe(1);
    expect(handler.get).toHaveBeenCalled();

    // Test set
    proxy.a = 2;
    expect(proxy.a).toBe(2);
    expect(handler.set).toHaveBeenCalled();

    // Test delete
    delete proxy.a;
    expect(handler.deleteProperty).toHaveBeenCalled();
  });

  it('should handle deep nesting with multiple levels', () => {
    const obj = { a: { b: { c: 3 } } };
    const proxy = createDeepProxy(obj);

    // Test accessing deep properties
    expect(proxy.a.b.c).toBe(3);

    // Test modifying deep properties
    proxy.a.b.c = 4;
    expect(proxy.a.b.c).toBe(4);
  });
});

describe('createMetadata', () => {
  it('should create and fetch metadata correctly', () => {
    const target = {};
    const metadataKey = 'testMetadata';

    // Create metadata for the target
    const metadata = createMetadata(target, metadataKey, () => ({ key: 'value' }));

    // Test that metadata is created and accessible
    expect(Reflect.getMetadata(metadataKey, target)).toEqual({ key: 'value' });
    expect(metadata.key).toBe('value');
  });

  it('should initialize metadata only once', () => {
    const target = {};
    const metadataKey = 'testMetadata';

    // Create metadata for the target
    const metadata1 = createMetadata(target, metadataKey, () => ({ key1: 'value1' }));
    const metadata2 = createMetadata(target, metadataKey);

    // Check that the metadata does not get reinitialized
    expect(metadata1).toStrictEqual(metadata2);
    expect(metadata1.key1).toBe('value1');
  });

  it('should synchronize metadata after property modifications', () => {
    const target = {};
    const metadataKey = 'testMetadata';
    const metadata = createMetadata(target, metadataKey, () => ({ key: 'value' }));

    // Modify the metadata
    metadata.key = 'newValue';

    // Check that the metadata is updated correctly
    expect(Reflect.getMetadata(metadataKey, target).key).toBe('newValue');
  });

  it('should synchronize metadata after property deletion', () => {
    const target = {};
    const metadataKey = 'testMetadata';
    const metadata = createMetadata(target, metadataKey, () => ({ key: 'value' }));

    // Delete a property
    delete metadata.key;

    // Check that the metadata is updated after deletion
    expect(Reflect.getMetadata(metadataKey, target)).toEqual({});
  });
});
