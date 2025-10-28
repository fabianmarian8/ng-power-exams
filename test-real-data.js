/**
 * Test script for real data sources
 * Tests scrapers and parsers without running full app
 */

console.log('🔍 Testing Real Data Sources...\n');

// Test 1: CORS Proxy availability
console.log('1️⃣ Testing CORS Proxy...');
const testProxy = async () => {
  try {
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.example.com');
    const response = await fetch(proxyUrl);
    console.log('   ✅ CORS Proxy (AllOrigins):', response.ok ? 'Working' : 'Failed');
    return response.ok;
  } catch (error) {
    console.log('   ❌ CORS Proxy Error:', error.message);
    return false;
  }
};

// Test 2: RSS Feed
console.log('\n2️⃣ Testing RSS Feed (Punch Nigeria)...');
const testRSS = async () => {
  try {
    const rssUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('http://punchng.com/feed');
    const response = await fetch(rssUrl);
    const text = await response.text();
    const hasRSS = text.includes('<rss') || text.includes('<feed');
    console.log('   ✅ RSS Feed:', hasRSS ? 'Valid XML received' : 'Invalid response');
    console.log('   📊 Response length:', text.length, 'bytes');
    return hasRSS;
  } catch (error) {
    console.log('   ❌ RSS Feed Error:', error.message);
    return false;
  }
};

// Test 3: Ikeja Electric Fault Log
console.log('\n3️⃣ Testing Ikeja Electric Scraper...');
const testIkeja = async () => {
  try {
    const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.ikejaelectric.com/fault-log');
    const response = await fetch(url);
    const html = await response.text();
    const hasContent = html.length > 1000; // Should have substantial content
    console.log('   ✅ Ikeja Electric:', response.ok ? 'Accessible' : 'Failed');
    console.log('   📊 Page size:', html.length, 'bytes');

    // Look for common patterns
    const hasFault = html.toLowerCase().includes('fault') ||
                     html.toLowerCase().includes('outage') ||
                     html.toLowerCase().includes('feeder');
    console.log('   🔍 Contains fault data:', hasFault ? 'Yes' : 'No');

    return response.ok && hasContent;
  } catch (error) {
    console.log('   ❌ Ikeja Electric Error:', error.message);
    return false;
  }
};

// Test 4: IBEDC Outage Information
console.log('\n4️⃣ Testing IBEDC Scraper...');
const testIBEDC = async () => {
  try {
    const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.ibedc.com/outage-information');
    const response = await fetch(url);
    const html = await response.text();
    console.log('   ✅ IBEDC:', response.ok ? 'Accessible' : 'Failed');
    console.log('   📊 Page size:', html.length, 'bytes');

    const hasOutage = html.toLowerCase().includes('outage') ||
                      html.toLowerCase().includes('oyo') ||
                      html.toLowerCase().includes('ogun');
    console.log('   🔍 Contains outage data:', hasOutage ? 'Yes' : 'No');

    return response.ok;
  } catch (error) {
    console.log('   ❌ IBEDC Error:', error.message);
    return false;
  }
};

// Test 5: Environment Configuration
console.log('\n5️⃣ Testing Environment Configuration...');
const testEnv = () => {
  const mockData = process.env.VITE_USE_MOCK_DATA;
  console.log('   📝 VITE_USE_MOCK_DATA:', mockData || 'not set');
  console.log('   ✅ Should use real data:', mockData === 'false' ? 'Yes' : 'No (using mock)');
  return mockData === 'false';
};

// Run all tests
(async () => {
  const results = {
    proxy: await testProxy(),
    rss: await testRSS(),
    ikeja: await testIkeja(),
    ibedc: await testIBEDC(),
    env: testEnv()
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(50));

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${test.toUpperCase()}`);
  });

  console.log('='.repeat(50));
  console.log(`\n🎯 Score: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed! Real data sources are working.');
  } else if (passed > 0) {
    console.log('⚠️  Some tests failed, but data sources are partially working.');
  } else {
    console.log('❌ All tests failed. Check network connection and CORS proxy.');
  }

  console.log('\n💡 Next steps:');
  console.log('   1. Open http://localhost:8080 in your browser');
  console.log('   2. Navigate to Power Outages page');
  console.log('   3. Check browser console for scraping logs');
  console.log('   4. Verify data is loading from real sources');
})();
