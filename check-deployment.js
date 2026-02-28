// Check if the XLM version is deployed
const https = require('https');

const checkDeployment = async () => {
  console.log('🔍 Checking Vercel deployment for XLM migration...');
  console.log('URL: https://frontend-eight-navy-19.vercel.app\n');

  try {
    // First check the main page
    const response = await fetch('https://frontend-eight-navy-19.vercel.app');
    const html = await response.text();
    
    console.log('📋 HTML Response Analysis:');
    console.log('- Status:', response.status);
    console.log('- Content Length:', html.length, 'bytes');
    
    // Check for React app structure
    if (html.includes('<div id="root">') && html.includes('script')) {
      console.log('✅ React app structure detected');
      
      // Extract script sources
      const scriptMatches = html.match(/src="([^"]*\.js[^"]*)"/g);
      if (scriptMatches) {
        console.log('📦 JavaScript bundles found:', scriptMatches.length);
        
        // Try to fetch the main JS bundle
        const mainScript = scriptMatches.find(s => s.includes('index-') || s.includes('main-'));
        if (mainScript) {
          const scriptUrl = mainScript.match(/src="([^"]*)"/)[1];
          const fullScriptUrl = scriptUrl.startsWith('/') 
            ? `https://frontend-eight-navy-19.vercel.app${scriptUrl}`
            : scriptUrl;
          
          console.log('🔍 Checking main bundle:', fullScriptUrl);
          
          try {
            const jsResponse = await fetch(fullScriptUrl);
            const jsContent = await jsResponse.text();
            
            // Check for contract addresses
            const newContract = 'CBL6M6NXHSQJ6CJYIMV6FNEBNK3IRWLNQOFEM76FFGR6VGBRVXAPUA2V';
            const xlmToken = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
            const oldContract = 'CAKHYOFVLMGRO66VA2GQ6YG4FJZN3N4QGWMM342P3645RQZDKE6PAQUZ';
            
            console.log('\n🎯 Contract Address Check:');
            
            if (jsContent.includes(newContract)) {
              console.log('✅ NEW XLM contract found!');
            } else {
              console.log('❌ NEW XLM contract NOT found');
            }
            
            if (jsContent.includes(xlmToken)) {
              console.log('✅ XLM token address found!');
            } else {
              console.log('❌ XLM token address NOT found');
            }
            
            if (jsContent.includes(oldContract)) {
              console.log('⚠️  Old USDC contract still present');
            } else {
              console.log('✅ Old USDC contract removed');
            }
            
            // Check for XLM vs USDC references
            const xlmCount = (jsContent.match(/XLM/g) || []).length;
            const usdcCount = (jsContent.match(/USDC/g) || []).length;
            
            console.log('\n💰 Token References:');
            console.log('- XLM mentions:', xlmCount);
            console.log('- USDC mentions:', usdcCount);
            
            if (xlmCount > usdcCount) {
              console.log('✅ XLM migration successful!');
            } else {
              console.log('⚠️  Still has USDC references');
            }
            
          } catch (jsError) {
            console.log('❌ Error fetching JS bundle:', jsError.message);
          }
        }
      }
    } else {
      console.log('❌ No React app structure found');
    }
    
    console.log('\n🚀 Deployment check complete!');
    
  } catch (error) {
    console.log('❌ Error checking deployment:', error.message);
  }
};

// Use node-fetch if available, otherwise use a simple approach
if (typeof fetch === 'undefined') {
  // Fallback for older Node versions
  const https = require('https');
  
  global.fetch = (url) => {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          text: () => Promise.resolve(data)
        }));
      }).on('error', reject);
    });
  };
}

checkDeployment();