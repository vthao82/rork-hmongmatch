import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ?? "";
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ?? "";

const hasCreds = !!supabaseUrl && !!supabaseAnonKey;

if (!hasCreds) {
  console.log("[supabase] No credentials configured — Supabase calls will be no-ops. (DB will move to Firestore.)");
}

// Build a no-op stub that returns Supabase-shaped responses without throwing.
// Any .from(...).select/insert/update/upsert/etc. resolves with { data: null, error: null }.
// auth.getUser/getSession resolves with { data: { user: null, session: null }, error: null }.
function buildNoopClient(): SupabaseClient {
  const chainable: any = new Proxy(
    function () {
      // Calling the chain resolves to a Supabase-shaped empty response
      return Promise.resolve({ data: null, error: null });
    },
    {
      get(_t, prop) {
        if (prop === "then") return undefined; // not a thenable directly
        return chainable;
      },
      apply() {
        return Promise.resolve({ data: null, error: null });
      },
    }
  );

  const stub = {
    from: () => chainable,
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (_cb: unknown) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  };

  return stub as unknown as SupabaseClient;
}

function createSafeClient(): SupabaseClient {
  if (!hasCreds) return buildNoopClient();
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
    console.log("[supabase] Could not create client, using no-op stub:", e);
    return buildNoopClient();
  }
}

export const supabase: SupabaseClient = createSafeClient();
