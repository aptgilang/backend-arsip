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

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const {
        data: { user },
        error,
      } = await supabaseService.client.auth.getUser(token);

      if (!error && user) {
        const profile = await supabaseService.getUserById(user.id);
        c.set("user", user);
        c.set("profile", profile);
      }
    } catch (error) {
      // Silently fail for optional auth
      console.error("Optional auth failed:", error);
    }
  }

  await next();
});

export {
  authMiddleware,
  rbacMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
};
