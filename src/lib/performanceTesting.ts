/**
 * Performance Testing Utilities
 *
 * This file contains utilities for testing the performance of API endpoints
 * and database operations.
 */

/**
 * Measures the execution time of a function
 * @param fn The function to measure
 * @param args Arguments to pass to the function
 * @returns The result of the function and the execution time in milliseconds
 */
export async function measureExecutionTime<T>(
  fn: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<{ result: T; executionTime: number }> {
  const startTime = Date.now();
  const result = await fn(...args);
  const executionTime = Date.now() - startTime;
  return { result, executionTime };
}

/**
 * Runs a performance test on a function
 * @param fn The function to test
 * @param args Arguments to pass to the function
 * @param iterations Number of iterations to run
 * @returns Performance metrics
 */
export async function runPerformanceTest<T>(
  fn: (...args: any[]) => Promise<T>,
  args: any[] = [],
  iterations: number = 10
): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
  results: { executionTime: number; success: boolean; error?: any }[];
}> {
  const results: { executionTime: number; success: boolean; error?: any }[] = [];

  for (let i = 0; i < iterations; i++) {
    try {
      const startTime = Date.now();
      await fn(...args);
      const executionTime = Date.now() - startTime;
      results.push({ executionTime, success: true });
    } catch (error) {
      results.push({ executionTime: 0, success: false, error });
    }
  }

  const successfulResults = results.filter((r) => r.success);
  const executionTimes = successfulResults.map((r) => r.executionTime);

  const totalTime = executionTimes.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / executionTimes.length || 0;
  const minTime = Math.min(...executionTimes, Infinity);
  const maxTime = Math.max(...executionTimes, 0);

  return {
    averageTime,
    minTime,
    maxTime,
    totalTime,
    results,
  };
}

/**
 * Compares the performance of two functions
 * @param fnA The first function to test
 * @param fnB The second function to test
 * @param args Arguments to pass to both functions
 * @param iterations Number of iterations to run
 * @returns Comparison metrics
 */
export async function comparePerformance<T>(
  fnA: (...args: any[]) => Promise<T>,
  fnB: (...args: any[]) => Promise<T>,
  args: any[] = [],
  iterations: number = 10
): Promise<{
  fnA: {
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  };
  fnB: {
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  };
  difference: {
    averageTime: number;
    percentage: number;
  };
  fasterFunction: "A" | "B";
}> {
  const resultA = await runPerformanceTest(fnA, args, iterations);
  const resultB = await runPerformanceTest(fnB, args, iterations);

  const difference = {
    averageTime: Math.abs(resultA.averageTime - resultB.averageTime),
    percentage:
      resultA.averageTime > 0 && resultB.averageTime > 0
        ? Math.abs(
            ((resultA.averageTime - resultB.averageTime) /
              Math.min(resultA.averageTime, resultB.averageTime)) *
              100
          )
        : 0,
  };

  return {
    fnA: {
      averageTime: resultA.averageTime,
      minTime: resultA.minTime,
      maxTime: resultA.maxTime,
      totalTime: resultA.totalTime,
    },
    fnB: {
      averageTime: resultB.averageTime,
      minTime: resultB.minTime,
      maxTime: resultB.maxTime,
      totalTime: resultB.totalTime,
    },
    difference,
    fasterFunction: resultA.averageTime <= resultB.averageTime ? "A" : "B",
  };
}

/**
 * Simulates a load test on an API endpoint
 * @param url The URL to test
 * @param options Fetch options
 * @param concurrentRequests Number of concurrent requests
 * @param totalRequests Total number of requests to make
 * @returns Load test metrics
 */
export async function simulateLoadTest(
  url: string,
  options: RequestInit = {},
  concurrentRequests: number = 10,
  totalRequests: number = 100
): Promise<{
  totalTime: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  successRate: number;
  statusCodes: Record<number, number>;
  errors: any[];
}> {
  const startTime = Date.now();
  const results: {
    responseTime: number;
    status: number;
    success: boolean;
    error?: any;
  }[] = [];
  const statusCodes: Record<number, number> = {};
  const errors: any[] = [];

  // Create batches of concurrent requests
  const batches = Math.ceil(totalRequests / concurrentRequests);

  for (let i = 0; i < batches; i++) {
    const batchSize = Math.min(concurrentRequests, totalRequests - i * concurrentRequests);
    const batchPromises = Array(batchSize)
      .fill(0)
      .map(async () => {
        try {
          const requestStartTime = Date.now();
          const response = await fetch(url, options);
          const responseTime = Date.now() - requestStartTime;

          // Track status codes
          statusCodes[response.status] = (statusCodes[response.status] || 0) + 1;

          results.push({
            responseTime,
            status: response.status,
            success: response.ok,
          });

          return { success: response.ok, status: response.status };
        } catch (error) {
          errors.push(error);
          results.push({
            responseTime: 0,
            status: 0,
            success: false,
            error,
          });

          return { success: false, error };
        }
      });

    await Promise.all(batchPromises);
  }

  const totalTime = Date.now() - startTime;
  const successfulRequests = results.filter((r) => r.success);
  const successRate = (successfulRequests.length / totalRequests) * 100;
  const responseTimes = results.filter((r) => r.responseTime > 0).map((r) => r.responseTime);
  const averageResponseTime =
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length || 0;
  const requestsPerSecond = (totalRequests / totalTime) * 1000;

  return {
    totalTime,
    averageResponseTime,
    requestsPerSecond,
    successRate,
    statusCodes,
    errors,
  };
}

/**
 * Runs a database query performance test
 * @param queryFn The query function to test
 * @param iterations Number of iterations to run
 * @returns Query performance metrics
 */
export async function testDatabaseQueryPerformance<T>(
  queryFn: () => Promise<T>,
  iterations: number = 10
): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
  results: { executionTime: number; success: boolean; error?: any }[];
}> {
  return runPerformanceTest(queryFn, [], iterations);
}

/**
 * Compares the performance of two database queries
 * @param queryA The first query function to test
 * @param queryB The second query function to test
 * @param iterations Number of iterations to run
 * @returns Comparison metrics
 */
export async function compareDatabaseQueries<T>(
  queryA: () => Promise<T>,
  queryB: () => Promise<T>,
  iterations: number = 10
): Promise<{
  queryA: {
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  };
  queryB: {
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  };
  difference: {
    averageTime: number;
    percentage: number;
  };
  fasterQuery: "A" | "B";
}> {
  const result = await comparePerformance(queryA, queryB, [], iterations);

  return {
    queryA: result.fnA,
    queryB: result.fnB,
    difference: result.difference,
    fasterQuery: result.fasterFunction,
  };
}
