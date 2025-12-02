#!/usr/bin/env node
/**
 * Quick test to see if analytics API responds
 */

const http = require('http');

const testUrl = 'http://localhost:3002/api/admin/intelligence/analytics?timeRange=30d';

console.log('Testing analytics API...');
console.log('URL:', testUrl);
console.log('');

const startTime = Date.now();
const req = http.get(testUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const duration = Date.now() - startTime;
    console.log(`Status: ${res.statusCode}`);
    console.log(`Duration: ${duration}ms`);
    console.log('');
    
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log('✅ API responded successfully!');
        console.log('Response keys:', Object.keys(json));
        if (json.overview) {
          console.log('Total analyzed:', json.overview.totalAnalyzed || 0);
        }
      } catch (e) {
        console.log('Response (first 200 chars):', data.substring(0, 200));
      }
    } else {
      console.log('Response:', data.substring(0, 500));
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.setTimeout(15000, () => {
  console.error('❌ Request timed out after 15 seconds');
  req.destroy();
  process.exit(1);
});


