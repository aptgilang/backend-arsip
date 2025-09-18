import { config } from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
//
import { DB } from "./config";
import { authRoutes, archiveRoutes, userRoutes, adminRoutes } from "./routes";
import { errorHandler, notFound } from "./middlewares";

// Load environment variables
config();

// Initialize the Hono app
const app = new Hono({ strict: false });

// Config Supabase - Validate configuration
if (typeof process !== "undefined") {
  DB();
}

// Logger middleware
app.use(logger());

// Compress middleware
app.use(
  compress({
    encoding: "gzip",
    threshold: 1024, // Minimum size to compress (1KB)
  })
);

// CORS configuration
app.use(
  "*",
  cors({
    origin: "*", // Specify allowed origins (update for production)
    allowMethods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
    credentials: true,
    maxAge: 86400, // Cache preflight for 1 day
  })
);

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    message: "Archive API is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API documentation endpoint
app.get("/api", (c) => {
  const apiRoutes = [
    {
      method: "POST",
      path: "/api/auth/register",
      description: "Register a new user",
      auth: false,
      admin: false,
    },
    {
      method: "POST",
      path: "/api/auth/login",
      description: "User login",
      auth: false,
      admin: false,
    },
    {
      method: "POST",
      path: "/api/auth/logout",
      description: "User logout",
      auth: true,
      admin: false,
    },
    {
      method: "GET",
      path: "/api/auth/user",
      description: "Get current user",
      auth: true,
      admin: false,
    },
    {
      method: "GET",
      path: "/api/users/profile",
      description: "Get user profile",
      auth: true,
      admin: false,
    },
    {
      method: "PUT",
      path: "/api/users/profile",
      description: "Update user profile",
      auth: true,
      admin: false,
    },
    {
      method: "GET",
      path: "/api/users",
      description: "Get all users",
      auth: true,
      admin: true,
    },
    {
      method: "GET",
      path: "/api/archives",
      description: "Get user archives",
      auth: true,
      admin: false,
    },
    {
      method: "POST",
      path: "/api/archives",
      description: "Create new archive",
      auth: true,
      admin: false,
    },
    {
      method: "GET",
      path: "/api/archives/:id",
      description: "Get archive by ID",
      auth: true,
      admin: false,
    },
    {
      method: "PUT",
      path: "/api/archives/:id",
      description: "Update archive",
      auth: true,
      admin: false,
    },
    {
      method: "DELETE",
      path: "/api/archives/:id",
      description: "Delete archive",
      auth: true,
      admin: false,
    },
    {
      method: "GET",
      path: "/api/admin/stats",
      description: "Get system statistics",
      auth: true,
      admin: true,
    },
  ];

  return c.json({
    title: "Archive Management API",
    version: "1.0.0",
    description: "API for managing archives with Supabase backend",
    routes: apiRoutes,
  });
});

// API routes
app.route("/api/auth", authRoutes);
app.route("/api/archives", archiveRoutes);
app.route("/api/users", userRoutes);
app.route("/api/admin", adminRoutes);

// Error Handler
app.onError(errorHandler);

// Not Found Handler
app.notFound(notFound);

// Determine the environment
const port = process.env?.PORT || 8000;

// Export for both Bun and Cloudflare Workers
export default {
  port,
  fetch: app.fetch,
};
