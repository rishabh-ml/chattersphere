module.exports = {
  // Run ESLint on JS, TS, JSX, and TSX files
  '**/*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  
  // Run Prettier on other file types
  '**/*.{json,md,css}': ['prettier --write'],
  
  // Run TypeScript type checking on TS files
  '**/*.{ts,tsx}': () => 'tsc --noEmit',
};
