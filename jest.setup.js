import { jest } from '@jest/globals';
import '@testing-library/jest-dom/extend-expect';

// Allow router mocks.
// eslint-disable-next-line no-undef
jest.mock('next/router', () => require('next-router-mock'));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
