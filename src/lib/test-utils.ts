// Mock Next.js Request and Response
export class MockNextRequest {
  url: string;
  method: string;
  headers: Map<string, string>;
  nextUrl: { searchParams: URLSearchParams };
  private body: any;

  constructor(url: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.nextUrl = { searchParams: new URLSearchParams(url.split('?')[1] || '') };
    this.body = options.body ? JSON.parse(options.body) : {};
  }

  async json() {
    return Promise.resolve(this.body);
  }
}

export class MockNextResponse {
  status: number;
  data: any;
  headers: Map<string, string>;

  constructor(data: any, options: { status?: number; headers?: Record<string, string> } = {}) {
    this.data = data;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
  }

  async json() {
    return Promise.resolve(this.data);
  }

  static json(data: any, options: { status?: number; headers?: Record<string, string> } = {}) {
    return new MockNextResponse(data, options);
  }
}

// Mock mongoose
export const mockMongoose = {
  Types: {
    ObjectId: {
      isValid: jest.fn().mockReturnValue(true),
    },
  },
  model: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  })),
};

// Mock Clerk auth
export const mockAuth = jest.fn().mockResolvedValue({
  userId: 'user_123',
});

// Mock database connection
export const mockDbConnect = jest.fn().mockResolvedValue(undefined);

// Mock User model
export const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

// Mock Community model
export const mockCommunityModel = {
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

// Mock Membership model
export const mockMembershipModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
};

// Mock Post model
export const mockPostModel = {
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
};

// Mock Comment model
export const mockCommentModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
};

// Mock Notification model
export const mockNotificationModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
};

// Setup function to reset all mocks
export function resetAllMocks() {
  jest.clearAllMocks();
  
  // Reset auth mock
  mockAuth.mockResolvedValue({ userId: 'user_123' });
  
  // Reset database connection mock
  mockDbConnect.mockResolvedValue(undefined);
  
  // Reset mongoose mock
  mockMongoose.Types.ObjectId.isValid.mockReturnValue(true);
}
