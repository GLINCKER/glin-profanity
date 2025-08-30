#!/usr/bin/env node

// Test script to verify CJS/ESM dual mode compatibility
console.log('🧪 Testing CJS/ESM Dual Mode Compatibility\n');

console.log('=== ESM Import Test ===');
try {
  const { ProfanityFilter, checkProfanity } = await import('./packages/js/dist/index.js');
  console.log('✅ ESM import successful');
  
  const filter = new ProfanityFilter();
  const result = filter.checkProfanity('This is a clean test');
  console.log('✅ ESM ProfanityFilter class works:', !result.containsProfanity);
  
  const directResult = checkProfanity('This is a clean test');
  console.log('✅ ESM checkProfanity function works:', !directResult.containsProfanity);
  
} catch (error) {
  console.error('❌ ESM test failed:', error.message);
}

console.log('\n=== CJS Require Test ===');
try {
  // Using dynamic import to test CJS in ESM context
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  
  const { ProfanityFilter, checkProfanity } = require('./packages/js/dist/index.cjs');
  console.log('✅ CJS require successful');
  
  const filter = new ProfanityFilter();
  const result = filter.checkProfanity('This is a clean test');
  console.log('✅ CJS ProfanityFilter class works:', !result.containsProfanity);
  
  const directResult = checkProfanity('This is a clean test');
  console.log('✅ CJS checkProfanity function works:', !directResult.containsProfanity);
  
} catch (error) {
  console.error('❌ CJS test failed:', error.message);
}

console.log('\n✨ All dual mode tests completed!');