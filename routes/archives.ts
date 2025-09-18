import { Hono } from "hono";
import { SupabaseService } from "../services/supabase";
import { StorageService } from "../services/storage";

const supabaseService = new SupabaseService();
const storageService = new StorageService();

// Define custom context type
type Variables = {
  userId: string;
};

const archiveRoutes = new Hono<{ Variables: Variables }>();

// Helper function to get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// Middleware to get user ID from auth
archiveRoutes.use("*", async (c, next) => {
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

    c.set("userId", user.id);
    await next();
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
});

// Get all archives (with pagination)
archiveRoutes.get("/", async (c) => {
  try {
    const userId = c.get("userId");
    const archives = await supabaseService.getArchives(userId);
    return c.json(archives);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Get specific archive
archiveRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const archive = await supabaseService.getArchiveById(id);

    if (!archive) {
      return c.json({ error: "Archive not found" }, 404);
    }

    // Check if user owns this archive
    if (archive.created_by !== userId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    return c.json(archive);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Create new archive item
archiveRoutes.post("/", async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();

    const archiveData = {
      ...body,
      created_by: userId,
    };

    const archive = await supabaseService.createArchive(archiveData);
    return c.json(archive, 201);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Update archive item
archiveRoutes.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const body = await c.req.json();

    // Check if user owns this archive
    const existingArchive = await supabaseService.getArchiveById(id);
    if (!existingArchive || existingArchive.created_by !== userId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const archive = await supabaseService.updateArchive(id, body);
    return c.json(archive);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Delete archive item
archiveRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");

    // Check if user owns this archive
    const existingArchive = await supabaseService.getArchiveById(id);
    if (!existingArchive || existingArchive.created_by !== userId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // Delete associated file if it exists
    if (existingArchive.file_url) {
      try {
        await storageService.deleteFile(existingArchive.file_url);
      } catch (error) {
        // Log error but continue with archive deletion
        console.error("Error deleting file:", error);
      }
    }

    await supabaseService.deleteArchive(id);
    return c.json({ message: "Archive deleted successfully" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Search archives
archiveRoutes.get("/search", async (c) => {
  try {
    const userId = c.get("userId");
    const query = c.req.query("q") || "";

    const archives = await supabaseService.searchArchives(userId, query);
    return c.json(archives);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Upload file for archive
archiveRoutes.post("/upload", async (c) => {
  try {
    const userId = c.get("userId");
    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    const uploadResult = await storageService.uploadFile(file, userId);
    return c.json(uploadResult);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export { archiveRoutes };
