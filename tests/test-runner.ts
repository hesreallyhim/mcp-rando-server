import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running MCP Rando Server Tests...\n');

// Import all test files
const testFiles = await glob('**/*.test.ts', { 
  cwd: __dirname,
  absolute: true 
});

for (const testFile of testFiles) {
  console.log(`Loading test file: ${testFile}`);
  await import(testFile);
}

console.log('\nAll tests completed.');
