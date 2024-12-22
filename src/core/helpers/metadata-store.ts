export type ProxyHandler<T> = {
  get?(target: T, prop: string | symbol, value: any): any;
  set?(target: T, prop: string | symbol, value: any, oldValue: any): boolean;
  deleteProperty?(target: T, prop: string | symbol): boolean;
};

export function createDeepProxy(target, handler: ProxyHandler<object> = {}) {
  const isObject = (val) => val && typeof val === 'object';

  const proxyHandler = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      // Recursively create deep proxies for nested objects
      if (isObject(value)) {
        return createDeepProxy(value, handler);
      }

      // Call the custom handler if defined
      if (handler.get) {
        const result = handler.get(target, prop, value);
        return result !== undefined ? result : value; // Fallback to default value if undefined
      }

      // Default behavior: return the value directly
      return value;
    },
    set(target, prop, value, receiver) {
      const oldValue = Reflect.get(target, prop, receiver);
      const success = Reflect.set(target, prop, value, receiver);
      if (success && handler.set) {
        handler.set(target, prop, value, oldValue);
      }
      return success;
    },
    deleteProperty(target, prop) {
      const success = Reflect.deleteProperty(target, prop);
      if (success && handler.deleteProperty) {
        handler.deleteProperty(target, prop);
      }
      return success;
    },
  };

  return new Proxy(target, proxyHandler);
}


export function createMetadata(
  target: object,
  metadataKey: string | symbol,
  initializer: () => object = () => ({})
): object {
  // Ensure metadata exists or initialize it
  const ensureMetadata = () => {
    let existingMetadata = Reflect.getMetadata(metadataKey, target);
    if (!existingMetadata) {
      existingMetadata = initializer();
      Reflect.defineMetadata(metadataKey, existingMetadata, target);
    }
    return existingMetadata;
  };

  // Fetch or initialize metadata
  const metadata = ensureMetadata();
  const handler = {
    set(target, prop, value) {
      const success = Reflect.set(target, prop, value);
      if (success) {
        Reflect.defineMetadata(metadataKey, metadata, target); // Sync metadata
      }
      return success;
    },
    get(target, prop) {
      return Reflect.get(target, prop); // Ensure consistent retrieval
    },
    deleteProperty(target, prop) {
      const success = Reflect.deleteProperty(target, prop);
      if (success) {
        Reflect.defineMetadata(metadataKey, metadata, target); // Sync metadata after deletion
      }
      return success;
    },
  };

  // Return a deep proxy for the metadata
  return createDeepProxy(metadata, handler);
}
