import { Hono } from "hono";
import { SupabaseService } from "../services/supabase";

const supabaseService = new SupabaseService();

const authRoutes = new Hono();

// Helper function to get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// Register a new user
authRoutes.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return c.json({ error: "Name, email, and password are required" }, 400);
    }

    const user = await supabaseService.createUser({ name, email, password });
    return c.json(user, 201);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Login user
authRoutes.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    const { data, error } =
      await supabaseService.client.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return c.json({ error: error.message }, 401);
    }

    // Get user profile
    const profile = await supabaseService.getUserById(data.user.id);

    return c.json({
      user: profile,
      session: data.session,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Logout user
authRoutes.post("/logout", async (c) => {
  try {
    const { error } = await supabaseService.client.auth.signOut();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ message: "Logged out successfully" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Get current user
authRoutes.get("/user", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseService.client.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    // Get user profile
    const profile = await supabaseService.getUserById(user.id);

    return c.json(profile);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export { authRoutes };
