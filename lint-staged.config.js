module.exports = {
  '*.{ts}': [
    'eslint --fix --max-warnings 0', // Fail on any warnings or errors
    'prettier --write',
  ],
};