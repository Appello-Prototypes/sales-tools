/**
 * Quick script to test Vercel token
 * 
 * Usage:
 *   VERCEL_TOKEN=your_token npm run test-vercel-token
 *   or
 *   npm run test-vercel-token -- your_token_here
 */

const token = process.argv[2] || process.env.VERCEL_TOKEN;

if (!token) {
  console.error('❌ No token provided');
  console.error('\nUsage:');
  console.error('  VERCEL_TOKEN=token npm run test-vercel-token');
  console.error('  or');
  console.error('  npm run test-vercel-token -- your_token_here');
  process.exit(1);
}

async function testToken() {
  try {
    const { Vercel } = await import('@vercel/sdk');
    const vercel = new Vercel({
      bearerToken: token,
    });

    console.log('🔍 Testing Vercel token...\n');
    
    const user = await vercel.users.getAuthenticatedUser();
    
    console.log('✅ Token is valid!');
    console.log(`\n📋 Account Info:`);
    console.log(`   Username: ${user.user.username || 'N/A'}`);
    console.log(`   Email: ${user.user.email || 'N/A'}`);
    console.log(`   Name: ${user.user.name || 'N/A'}`);
    
    console.log('\n💡 Save this token:');
    console.log(`   export VERCEL_TOKEN=${token}`);
    console.log(`   or add to .env.local: VERCEL_TOKEN=${token}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Token test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\n💡 The token is invalid or expired.');
      console.error('   Get a new token from: https://vercel.com/account/tokens');
    }
    
    process.exit(1);
  }
}

testToken();

