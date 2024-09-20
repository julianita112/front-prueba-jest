import '@testing-library/jest-dom';


jest.mock('axios', () => {
    return {
      create: jest.fn(() => ({
        interceptors: {
          request: {
            use: jest.fn(),
          },
          response: {
            use: jest.fn(),
          },
        },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      })),
    };
  });
  