// Simple script to verify the deployment has the correct contract address
const https = require('https');

const url = 'https://frontend-eight-navy-19.vercel.app';

console.log('🔍 Checking Vercel deployment...');
console.log('URL:', url);

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // Check if the new contract address is in the deployed code
    const newContractId = 'CBL6M6NXHSQJ6CJYIMV6FNEBNK3IRWLNQOFEM76FFGR6VGBRVXAPUA2V';
    const xlmTokenId = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
    const oldContractId = 'CAKHYOFVLMGRO66VA2GQ6YG4FJZN3N4QGWMM342P3645RQZDKE6PAQUZ';
    
    console.log('\n📋 Checking for contract addresses...');
    
    if (data.includes(newContractId)) {
      console.log('✅ NEW XLM contract address found!');
      console.log('   Contract:', newContractId);
    } else {
      console.log('❌ New XLM contract address NOT found');
    }
    
    if (data.includes(oldContractId)) {
      console.log('⚠️  Old USDC contract address still present');
      console.log('   Old Contract:', oldContractId);
    } else {
      console.log('✅ Old USDC contract address removed');
    }
    
    if (data.includes(xlmTokenId)) {
      console.log('✅ XLM token address found!');
      console.log('   XLM Token:', xlmTokenId);
    } else {
      console.log('❌ XLM token address not found');
    }
    
    console.log('\n📋 Checking for UI features...');
    
    if (data.includes('Become VC') || data.includes('💼')) {
      console.log('✅ VC functionality detected!');
    } else {
      console.log('❌ VC functionality not detected');
    }
    
    if (data.includes('XLM') && !data.includes('USDC')) {
      console.log('✅ XLM migration complete - no USDC references!');
    } else if (data.includes('XLM') && data.includes('USDC')) {
      console.log('⚠️  Mixed XLM/USDC references found');
    } else {
      console.log('❌ Still showing USDC references');
    }
    
    console.log('\n🚀 Deployment check complete!');
    
    // Check response status
    console.log('📊 Response Status:', res.statusCode);
    console.log('📦 Content Length:', data.length, 'bytes');
  });
}).on('error', (err) => {
  console.log('❌ Error checking deployment:', err.message);
});