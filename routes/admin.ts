import { Hono } from "hono";
import { SupabaseService } from "../services/supabase";

const supabaseService = new SupabaseService();

// Define context type
type Variables = {
  user: any;
};

const adminRoutes = new Hono<{ Variables: Variables }>();

// Helper function to get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// Middleware to verify admin access
adminRoutes.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Authorization token required" }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseService.client.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    // Check if user is admin
    const profile = await supabaseService.getUserById(user.id);
    if (profile.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    c.set("user", user);
    await next();
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
});

// Get system statistics
adminRoutes.get("/stats", async (c) => {
  try {
    const stats = await supabaseService.getSystemStats();
    return c.json(stats);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Get all users with pagination
adminRoutes.get("/users", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");

    const users = await supabaseService.getAllUsers(page, limit);
    return c.json(users);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Get all archives with pagination
adminRoutes.get("/archives", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");

    const archives = await supabaseService.getAllArchives(page, limit);
    return c.json(archives);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Update user role
adminRoutes.put("/users/:id/role", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { role } = body;

    if (!role || !["user", "admin"].includes(role)) {
      return c.json({ error: 'Invalid role. Must be "user" or "admin"' }, 400);
    }

    const updatedUser = await supabaseService.updateUserRole(id, role);
    return c.json(updatedUser);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Delete user
adminRoutes.delete("/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await supabaseService.deleteUser(id);
    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Delete archive (admin can delete any archive)
adminRoutes.delete("/archives/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await supabaseService.deleteArchive(id);
    return c.json({ message: "Archive deleted successfully" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export { adminRoutes };
