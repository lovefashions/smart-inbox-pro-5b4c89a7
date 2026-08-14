import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

export const lovable = createLovableAuth();

export async function signInWithOAuth(provider: "google" | "apple" | "microsoft" | "lovable", redirect_uri?: string) {
  const result = await lovable.signInWithOAuth(provider, redirect_uri ? { redirect_uri } : undefined);
  if (result.error) {
    throw result.error;
  }
  if (result.tokens) {
    await supabase.auth.setSession({
      access_token: result.tokens.access_token,
      refresh_token: result.tokens.refresh_token,
    });
  }
  // If result.redirected is true, the browser is already navigating away.
}
