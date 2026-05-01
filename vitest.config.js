import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', 'dist/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: [
        'models/Alert.js',
        'models/products/**/*.js',
        'controllers/feedbackController.js',
        'middleware/auth.js',
        'middleware/validation.js'
      ],
      reporter: ['text', 'html', 'json']
    }
  }
});
