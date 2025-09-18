// Storage service for file operations with Supabase
import { createClient } from "@supabase/supabase-js";

export class StorageService {
  private client: any;

  constructor() {
    // Environment variables
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;

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

    // Initialize Supabase client
    this.client = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  // Upload file
  async uploadFile(file: File, userId: string) {
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await this.client.storage
      .from("archive-files")
      .upload(fileName, file);

    if (error) throw new Error(error.message);

    // Get public URL
    const { data: urlData } = this.client.storage
      .from("archive-files")
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    };
  }

  // Delete file
  async deleteFile(fileUrl: string) {
    // Extract file path from URL
    const url = new URL(fileUrl);
    const filePath = url.pathname.split("/").slice(2).join("/");

    const { data, error } = await this.client.storage
      .from("archive-files")
      .remove([filePath]);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Get file URL
  async getFileUrl(filePath: string) {
    const { data } = this.client.storage
      .from("archive-files")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // List files for a user
  async listUserFiles(userId: string) {
    const { data, error } = await this.client.storage
      .from("archive-files")
      .list(userId);

    if (error) throw new Error(error.message);
    return data;
  }

  // Get file info
  async getFileInfo(filePath: string) {
    const { data, error } = await this.client.storage
      .from("archive-files")
      .list("", {
        search: filePath,
      });

    if (error) throw new Error(error.message);
    return data[0] || null;
  }
}
