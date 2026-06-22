import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ?? "";
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ?? "";

function createSafeClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[supabase] Missing credentials — Supabase calls will fail. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.");
  }
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: Platform.OS === "web" ? undefined : (AsyncStorage as unknown as Storage),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: "implicit",
      },
    });
  } catch (e) {
    console.error("[supabase] Failed to create client:", e);
    // Return a no-op client that won't crash — all methods will throw with a clear message
    return new Proxy({} as SupabaseClient, {
      get(_target, prop) {
        return (..._args: unknown[]) => {
          throw new Error(`Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env`);
        };
      },
    });
  }
}

export const supabase: SupabaseClient = createSafeClient();
