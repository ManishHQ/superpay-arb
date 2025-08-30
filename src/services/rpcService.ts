import { PublicClient } from 'viem';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryDelayMs: number;
  maxRetries: number;
}

export class RateLimitedRPCService {
  private static instance: RateLimitedRPCService;
  private requestQueue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private lastReset = Date.now();
  private requestCount = 0;
  private isProcessing = false;
  
  private config: RateLimitConfig = {
    maxRequests: 10, // Conservative limit for free tier
    windowMs: 60000, // 1 minute window
    retryDelayMs: 5000, // Wait 5 seconds before retry
    maxRetries: 3,
  };

  private constructor(private publicClient: PublicClient) {}

  public static getInstance(publicClient: PublicClient): RateLimitedRPCService {
    if (!RateLimitedRPCService.instance) {
      RateLimitedRPCService.instance = new RateLimitedRPCService(publicClient);
    }
    return RateLimitedRPCService.instance;
  }

  /**
   * Execute a rate-limited RPC call
   */
  public async execute<T>(
    rpcCall: (client: PublicClient) => Promise<T>,
    description: string = 'RPC call'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.executeWithRetry(rpcCall, description);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async executeWithRetry<T>(
    rpcCall: (client: PublicClient) => Promise<T>,
    description: string,
    attempt: number = 1
  ): Promise<T> {
    try {
      this.activeRequests++;
      console.log(`[RPC] Executing ${description} (attempt ${attempt})`);
      
      const result = await rpcCall(this.publicClient);
      console.log(`[RPC] Success: ${description}`);
      
      return result;
    } catch (error: any) {
      console.error(`[RPC] Error in ${description}:`, error);

      // Check if it's a rate limit error
      if (this.isRateLimitError(error)) {
        console.warn(`[RPC] Rate limited on ${description}, attempt ${attempt}`);
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[RPC] Retrying ${description} in ${delay}ms...`);
          
          await this.delay(delay);
          return this.executeWithRetry(rpcCall, description, attempt + 1);
        }
      }

      throw error;
    } finally {
      this.activeRequests--;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      // Reset rate limit window if needed
      const now = Date.now();
      if (now - this.lastReset >= this.config.windowMs) {
        this.requestCount = 0;
        this.lastReset = now;
        console.log('[RPC] Rate limit window reset');
      }

      // Check if we can make more requests
      if (this.requestCount >= this.config.maxRequests) {
        const waitTime = this.config.windowMs - (now - this.lastReset);
        console.log(`[RPC] Rate limit reached, waiting ${waitTime}ms`);
        await this.delay(waitTime);
        continue;
      }

      // Process next request
      const request = this.requestQueue.shift();
      if (request) {
        this.requestCount++;
        try {
          await request();
        } catch (error) {
          console.error('[RPC] Request failed:', error);
        }
        
        // Small delay between requests to be gentle on the RPC
        await this.delay(200);
      }
    }

    this.isProcessing = false;
  }

  private isRateLimitError(error: any): boolean {
    return (
      error?.cause?.status === 429 ||
      error?.status === 429 ||
      error?.message?.includes('rate-limited') ||
      error?.message?.includes('429')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  public getRateLimitStatus() {
    const now = Date.now();
    const windowRemaining = this.config.windowMs - (now - this.lastReset);
    const requestsRemaining = this.config.maxRequests - this.requestCount;

    return {
      requestCount: this.requestCount,
      requestsRemaining: Math.max(0, requestsRemaining),
      windowRemaining,
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length,
    };
  }
}