// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: "/",
    query: {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js server
jest.mock("next/server", () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || "GET",
    headers: new Map(Object.entries(init?.headers || {})),
    json: jest
      .fn()
      .mockImplementation(() => Promise.resolve(init?.body ? JSON.parse(init.body) : {})),
    nextUrl: { searchParams: new URLSearchParams() },
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
      headers: new Map(),
    })),
  },
}));

// Mock Clerk authentication
jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(() => ({ userId: "test-user-id" })),
  currentUser: jest.fn(() => ({
    id: "test-user-id",
    username: "testuser",
    firstName: "Test",
    lastName: "User",
    imageUrl: "https://example.com/avatar.jpg",
  })),
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "test-user-id",
  })),
  useUser: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "test-user-id",
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      imageUrl: "https://example.com/avatar.jpg",
    },
  })),
  ClerkProvider: ({ children }) => children,
  SignIn: () => <div>Sign In</div>,
  SignUp: () => <div>Sign Up</div>,
}));

// Mock Clerk server
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn().mockResolvedValue({ userId: "test-user-id" }),
  clerkClient: {
    users: {
      getUser: jest.fn().mockResolvedValue({
        id: "test-user-id",
        firstName: "Test",
        lastName: "User",
        imageUrl: "https://example.com/avatar.jpg",
        emailAddresses: [{ emailAddress: "test@example.com" }],
      }),
    },
  },
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock SWR
jest.mock("swr", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: undefined,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  })),
  SWRConfig: ({ children }) => children,
}));

// Mock database connection
jest.mock("@/lib/dbConnect", () => jest.fn().mockResolvedValue(undefined));

// Mock Mongoose models
jest.mock("@/models/User", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("@/models/Community", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock("@/models/Membership", () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock("@/models/Post", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock("@/models/Comment", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock("@/models/Notification", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  updateMany: jest.fn(),
  countDocuments: jest.fn(),
}));

// Mock mongoose
jest.mock("mongoose", () => ({
  connect: jest.fn(),
  connection: {
    on: jest.fn(),
    once: jest.fn(),
  },
  Schema: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnThis(),
  })),
  model: jest.fn(),
  Types: {
    ObjectId: {
      isValid: jest.fn().mockReturnValue(true),
    },
  },
}));

// Mock Redis
jest.mock("@/lib/redis", () => ({
  getRedis: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
  withCache: jest.fn((key, fn) => fn()),
  invalidateCache: jest.fn(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.NODE_ENV = "test";

// Add TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    status: 200,
    statusText: "OK",
    headers: new Headers(),
  })
);

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning: ReactDOM.render") ||
      args[0].includes("Warning: React.createElement") ||
      args[0].includes("Error: Not implemented"))
  ) {
    return;
  }
  originalConsoleError(...args);
};
