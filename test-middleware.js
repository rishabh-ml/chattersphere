// Test script to validate middleware functionality
import { NextRequest } from 'next/server';

// Mock the middleware locally to test
async function testMiddleware() {
  console.log('🧪 Testing ChatterSphere Middleware...');
  
  try {
    // Import the middleware
    const { middleware, config } = await import('./src/middleware');
    
    console.log('✅ Middleware imported successfully');
    console.log('🔧 Middleware config:', config);
    
    // Test with a mock request
    const mockUrl = new URL('http://localhost:3002/test');
    const mockRequest = new NextRequest(mockUrl);
    
    console.log('🔄 Testing middleware with mock request...');
    const response = middleware(mockRequest);
    
    if (response) {
      console.log('✅ Middleware executed successfully');
      console.log('📋 Response headers:', Array.from(response.headers.entries()));
    } else {
      console.log('❌ Middleware returned null/undefined');
    }
    
  } catch (error) {
    console.error('❌ Middleware test failed:', error);
    process.exit(1);
  }
  
  console.log('🎉 Middleware test passed!');
}

// Run the test
testMiddleware();
