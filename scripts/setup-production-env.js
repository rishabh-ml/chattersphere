#!/usr/bin/env node

/**
 * Production Environment Setup Script for ChatterSphere
 * 
 * This script helps validate and set up environment variables for production deployment.
 * Run this before deploying to ensure all required variables are properly configured.
 */

const fs = require('fs');
const path = require('path');

// Critical environment variables required for production
const CRITICAL_ENV_VARS = [
  'MONGODB_URI',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL'
];

// Optional environment variables (with fallbacks)
const OPTIONAL_ENV_VARS = [
  'REDIS_URL',
  'SENTRY_DSN',
  'CLERK_WEBHOOK_SECRET',
  'NEXT_PUBLIC_ENABLE_VOICE_CHANNELS',
  'NEXT_PUBLIC_ENABLE_DIRECT_MESSAGES',
  'RATE_LIMIT_MAX',
  'RATE_LIMIT_WINDOW_MS'
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');

  const missing = [];
  const warnings = [];

  // Check critical variables
  CRITICAL_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });

  // Check optional variables
  OPTIONAL_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });

  console.log('\n');

  // Report missing critical variables
  if (missing.length > 0) {
    console.error('❌ Missing critical environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nThese variables are required for the application to function properly.');
    console.error('Please set them in your deployment environment or .env.local file.\n');
    return false;
  }

  // Report missing optional variables
  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('\nThese variables are optional but may limit functionality:');
    console.warn('- REDIS_URL: Caching will use in-memory store (not recommended for production)');
    console.warn('- SENTRY_DSN: Error tracking will be disabled');
    console.warn('- CLERK_WEBHOOK_SECRET: Clerk webhooks will not work');
    console.warn('- Feature flags: Will use default values\n');
  }

  return true;
}

function validateEnvironmentValues() {
  console.log('🔧 Validating environment variable values...\n');

  const errors = [];

  // Validate URLs
  const urlVars = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'REDIS_URL', 'SENTRY_DSN'];
  urlVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      try {
        new URL(value);
        console.log(`✅ ${varName}: Valid URL`);
      } catch (error) {
        errors.push(`${varName}: Invalid URL format`);
      }
    }
  });

  // Validate MongoDB URI
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && !mongoUri.startsWith('mongodb')) {
    errors.push('MONGODB_URI: Must start with mongodb:// or mongodb+srv://');
  } else if (mongoUri) {
    console.log('✅ MONGODB_URI: Valid MongoDB connection string');
  }

  // Validate Clerk keys
  const clerkPublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (clerkPublishable && !clerkPublishable.startsWith('pk_')) {
    errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: Must start with pk_');
  } else if (clerkPublishable) {
    console.log('✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: Valid format');
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (clerkSecret && !clerkSecret.startsWith('sk_')) {
    errors.push('CLERK_SECRET_KEY: Must start with sk_');
  } else if (clerkSecret) {
    console.log('✅ CLERK_SECRET_KEY: Valid format');
  }

  console.log('\n');

  if (errors.length > 0) {
    console.error('❌ Environment variable validation errors:');
    errors.forEach(error => {
      console.error(`   - ${error}`);
    });
    console.error('\n');
    return false;
  }

  return true;
}

function generateProductionEnvTemplate() {
  const templatePath = path.join(process.cwd(), '.env.production.template');
  
  const template = `# Production Environment Template for ChatterSphere
# Copy this file to .env.local (for local production testing) or set these variables in your deployment platform

# Node Environment
NODE_ENV=production

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# MongoDB Database (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chattersphere?retryWrites=true&w=majority

# Clerk Authentication (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
CLERK_SECRET_KEY=sk_live_your_secret_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Storage (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Redis Cache (RECOMMENDED for production)
REDIS_URL=redis://your-redis-instance:6379

# Sentry Error Tracking (RECOMMENDED)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE_CHANNELS=false
NEXT_PUBLIC_ENABLE_DIRECT_MESSAGES=true

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Analytics (Optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
`;

  fs.writeFileSync(templatePath, template);
  console.log(`📝 Generated production environment template: ${templatePath}`);
}

function main() {
  console.log('🚀 ChatterSphere Production Environment Setup\n');

  // Load environment variables from .env.local if it exists
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    console.log('📄 Loading .env.local file...\n');
    require('dotenv').config({ path: envLocalPath });
  }

  const envCheck = checkEnvironmentVariables();
  const validationCheck = validateEnvironmentValues();

  if (envCheck && validationCheck) {
    console.log('🎉 Environment validation passed! Your app should start successfully.\n');
    
    if (process.env.NODE_ENV === 'production') {
      console.log('💡 Production deployment checklist:');
      console.log('   ✅ Environment variables validated');
      console.log('   ⚠️  Ensure Redis is available for optimal performance');
      console.log('   ⚠️  Ensure Sentry is configured for error tracking');
      console.log('   ⚠️  Test database connectivity');
      console.log('   ⚠️  Verify Clerk webhook endpoints');
    }
  } else {
    console.log('❌ Environment validation failed. Please fix the issues above before deploying.\n');
    process.exit(1);
  }

  // Generate production template if requested
  if (process.argv.includes('--generate-template')) {
    generateProductionEnvTemplate();
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkEnvironmentVariables, validateEnvironmentValues };
