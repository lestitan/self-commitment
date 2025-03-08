import { NextRequest, NextResponse } from 'next/server';
import { MockRequest, MockResponse } from './api-test-helpers';

// Mock Next.js Request/Response
global.Request = MockRequest as any;
global.Response = MockResponse as any;
global.Headers = Headers;

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: MockRequest,
  NextResponse: {
    json: (body: any, init?: ResponseInit) => {
      const response = new MockResponse();
      if (init?.status) {
        response.status = init.status;
      }
      return response.json(body);
    }
  }
}));