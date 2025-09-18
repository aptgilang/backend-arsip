import { createMiddleware } from "hono/factory";
import { SupabaseService } from "../services/supabase";

const supabaseService = new SupabaseService();

// Authentication middleware
const authMiddleware = createMiddleware(async (c, next) => {
  // Get token from Authorization header
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Validate token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseService.client.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    // Get user profile
    const profile = await supabaseService.getUserById(user.id);

    // Store user data in context
    c.set("user", user);
    c.set("profile", profile);

    await next();
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
});

// Role-based access control middleware
const rbacMiddleware = (roles: string[]) => {
  return createMiddleware(async (c, next) => {
    const profile = c.get("profile");

    if (!profile || !roles.includes(profile.role)) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    await next();
  });
};

// Admin only middleware
const adminMiddleware = createMiddleware(async (c, next) => {
  const profile = c.get("profile");

  if (!profile || profile.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  await next();
});

// Legacy protect middleware for backward compatibility
const protect = authMiddleware;

// Legacy isAdmin middleware for backward compatibility
const isAdmin = adminMiddleware;

export { authMiddleware, rbacMiddleware, adminMiddleware, protect, isAdmin };
