// Supabase configuration for database operations
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
export const supabaseConfig = {
  url: process.env.SUPABASE_URL || "",
  key: process.env.SUPABASE_KEY || "",
  serviceKey: process.env.SUPABASE_SERVICE_KEY || "",
};

// Validate Supabase configuration
export const validateSupabaseConfig = () => {
  if (!supabaseConfig.url) {
    throw new Error(
      "SUPABASE_URL is required. Please check your environment variables."
    );
  }

  if (!supabaseConfig.key) {
    throw new Error(
      "SUPABASE_KEY is required. Please check your environment variables."
    );
  }

  return true;
};

// Create Supabase client
export const createSupabaseClient = () => {
  validateSupabaseConfig();
  return createClient(supabaseConfig.url, supabaseConfig.key);
};

// Create admin Supabase client (with service key)
export const createSupabaseAdminClient = () => {
  validateSupabaseConfig();
  return createClient(
    supabaseConfig.url,
    supabaseConfig.serviceKey || supabaseConfig.key
  );
};

// Database connection function (replaces MongoDB connection)
const DB = () => {
  try {
    validateSupabaseConfig();
    console.log("✅ Supabase configuration validated successfully");
    return true;
  } catch (error) {
    console.error("❌ Supabase configuration error:", error);
    return false;
  }
};

export default DB;
