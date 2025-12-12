import { createClient } from './dist/client/index.js';

console.log('Successfully imported createClient:', typeof createClient);

if (typeof createClient !== 'function') {
  console.error('FAILED: createClient is not a function');
  process.exit(1);
}

console.log('Test PASSED');
