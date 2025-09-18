// Supabase service for database operations
import { createClient } from "@supabase/supabase-js";

export class SupabaseService {
  public client: any;
  private adminClient: any;

  constructor() {
    // Environment variables
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    // Validate environment variables
    if (!SUPABASE_URL) {
      throw new Error(
        "SUPABASE_URL is required. Please check your .env.local file."
      );
    }

    if (!SUPABASE_KEY) {
      throw new Error(
        "SUPABASE_KEY is required. Please check your .env.local file."
      );
    }

    // Initialize Supabase clients
    this.client = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.adminClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY || SUPABASE_KEY
    );
  }

  // User operations
  async getUserById(id: string) {
    const { data, error } = await this.client
      .from("profiles")
      .select("id, name, role, email, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async createUser(userData: any) {
    const { data, error } = await this.adminClient.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        name: userData.name,
      },
    });

    if (error) throw new Error(error.message);

    // Create profile
    const { data: profileData, error: profileError } = await this.client
      .from("profiles")
      .insert({
        id: data.user.id,
        name: userData.name,
        email: userData.email,
        role: "user",
      })
      .select()
      .single();

    if (profileError) throw new Error(profileError.message);
    return profileData;
  }

  async updateUser(id: string, userData: any) {
    const { data, error } = await this.client
      .from("profiles")
      .update(userData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.client
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async updateUserRole(id: string, role: string) {
    const { data, error } = await this.client
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteUser(id: string) {
    // Delete user profile first
    const { error: profileError } = await this.client
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) throw new Error(profileError.message);

    // Delete user from auth
    const { error: authError } = await this.adminClient.auth.admin.deleteUser(
      id
    );

    if (authError) throw new Error(authError.message);
    return { success: true };
  }

  // Archive operations
  async getArchives(userId: string) {
    const { data, error } = await this.client
      .from("archive_items")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async getAllArchives(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.client
      .from("archive_items")
      .select("*, profiles!archive_items_created_by_fkey(name)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getArchiveById(id: string) {
    const { data, error } = await this.client
      .from("archive_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async createArchive(archiveData: any) {
    const { data, error } = await this.client
      .from("archive_items")
      .insert(archiveData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateArchive(id: string, archiveData: any) {
    const { data, error } = await this.client
      .from("archive_items")
      .update(archiveData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteArchive(id: string) {
    const { data, error } = await this.client
      .from("archive_items")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    return data;
  }

  async searchArchives(userId: string, query: string) {
    const { data, error } = await this.client
      .from("archive_items")
      .select("*")
      .eq("created_by", userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // System statistics
  async getSystemStats() {
    const [usersResult, archivesResult] = await Promise.all([
      this.client.from("profiles").select("*", { count: "exact", head: true }),
      this.client
        .from("archive_items")
        .select("*", { count: "exact", head: true }),
    ]);

    if (usersResult.error) throw new Error(usersResult.error.message);
    if (archivesResult.error) throw new Error(archivesResult.error.message);

    return {
      totalUsers: usersResult.count,
      totalArchives: archivesResult.count,
      timestamp: new Date().toISOString(),
    };
  }
}
