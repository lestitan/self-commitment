// Mock implementations of Next.js server components for testing
export class MockRequest {
  private url: string;
  private method: string;
  private headers: Headers;
  private body: any;

  constructor(url: string, init?: RequestInit) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }

  async json() {
    return JSON.parse(this.body as string);
  }
}

export class MockResponse {
  public status: number;
  public headers: Headers;
  private body: any;

  constructor() {
    this.status = 200;
    this.headers = new Headers();
  }

  json(data: any) {
    this.body = data;
    return {
      status: this.status,
      json: async () => this.body,
    };
  }
}

export function createMockRequest(url: string, init?: RequestInit) {
  return new MockRequest(url, init) as unknown as Request;
}

export function createMockResponse() {
  return new MockResponse() as unknown as Response;
}