import { decodeBuildTemplate } from 'gw2buildlink';

const originalChatCode = '[&DQENPS46URlhHSYPVx2KAHgdSAE2AUcBiRI3AQAAAAAAAAAAAAAAAAAAAAADCQE1AFcAAA==]';
const generatedChatCode = '[&DQENPy4/UT9hHWEdVx1XHXgdeB02ATYBiRKJEgAAAAAAAAAAAAAAAAAAAAAAAA==]';

console.log('=== DECODING ORIGINAL (from game) ===');
try {
  const result = await decodeBuildTemplate(originalChatCode);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n=== DECODING GENERATED (from our app) ===');
try {
  const result = await decodeBuildTemplate(generatedChatCode);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}
