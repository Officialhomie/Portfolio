/**
 * Dependency Injection Container
 * Manages service registration and resolution
 */

type Factory<T> = () => T | Promise<T>;
type ServiceKey = string;

/**
 * Smart Wallet Container
 * Simple DI container for managing dependencies
 */
export class SmartWalletContainer {
  private instances = new Map<ServiceKey, unknown>();
  private factories = new Map<ServiceKey, Factory<unknown>>();

  /**
   * Register a service instance
   */
  register<T>(key: ServiceKey, instance: T): void {
    this.instances.set(key, instance);
  }

  /**
   * Register a service factory
   */
  registerFactory<T>(key: ServiceKey, factory: Factory<T>): void {
    this.factories.set(key, factory);
  }

  /**
   * Resolve a service
   */
  resolve<T>(key: ServiceKey): T {
    // Check if instance exists
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    // Check if factory exists
    if (this.factories.has(key)) {
      const factory = this.factories.get(key) as Factory<T>;
      const instance = factory();
      
      // Cache synchronous instances
      if (instance instanceof Promise) {
        // For async factories, we can't cache immediately
        // The caller should handle the promise
        return instance as unknown as T;
      }
      
      this.instances.set(key, instance);
      return instance;
    }

    throw new Error(`Service ${key} not registered`);
  }

  /**
   * Resolve a service asynchronously (for async factories)
   */
  async resolveAsync<T>(key: ServiceKey): Promise<T> {
    // Check if instance exists
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    // Check if factory exists
    if (this.factories.has(key)) {
      const factory = this.factories.get(key) as Factory<T>;
      const instance = await factory();
      
      // Cache the instance
      this.instances.set(key, instance);
      return instance;
    }

    throw new Error(`Service ${key} not registered`);
  }

  /**
   * Check if a service is registered
   */
  has(key: ServiceKey): boolean {
    return this.instances.has(key) || this.factories.has(key);
  }

  /**
   * Clear all registered services
   */
  clear(): void {
    this.instances.clear();
    this.factories.clear();
  }
}


