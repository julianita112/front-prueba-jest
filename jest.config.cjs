module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest', // Para transformar archivos .js, .jsx, .ts y .tsx
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'], // Si tienes configuración adicional para pruebas
};
