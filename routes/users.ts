import { Hono } from "hono";
import { SupabaseService } from "../services/supabase";

const supabaseService = new SupabaseService();

// Define context type
type Variables = {
  user: any;
};

const userRoutes = new Hono<{ Variables: Variables }>();

// Helper function to get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// Middleware to verify user authentication
userRoutes.use("*", async (c, next) => {
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

    // Store user in context
    c.set("user", user);
    await next();
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
});

// Get user profile
userRoutes.get("/profile", async (c) => {
  try {
    const user = c.get("user");
    const profile = await supabaseService.getUserById(user.id);
    return c.json(profile);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Update user profile
userRoutes.put("/profile", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const updatedProfile = await supabaseService.updateUser(user.id, body);
    return c.json(updatedProfile);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Get all users (admin only)
userRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const profile = await supabaseService.getUserById(user.id);

    if (profile.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    const users = await supabaseService.getAllUsers();
    return c.json(users);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Get user by ID (admin only)
userRoutes.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const profile = await supabaseService.getUserById(user.id);

    if (profile.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    const id = c.req.param("id");
    const targetUser = await supabaseService.getUserById(id);

    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(targetUser);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Delete user (admin only)
userRoutes.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const profile = await supabaseService.getUserById(user.id);

    if (profile.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    const id = c.req.param("id");
    await supabaseService.deleteUser(id);

    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export { userRoutes };
