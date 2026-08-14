import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Shared Inbox" },
      {
        name: "description",
        content: "Sign in to the AI shared inbox for your team.",
      },
      { property: "og:title", content: "Sign in — Shared Inbox" },
      {
        property: "og:description",
        content: "Sign in to the AI shared inbox for your team.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
    // onAuthStateChange will trigger router invalidation
  };

  const handleGoogleSignIn = async () => {
    const result = await lovable.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setError(result.error.message); return; }
    if (result.tokens) {
      await supabase.auth.setSession({
        access_token: result.tokens.access_token,
        refresh_token: result.tokens.refresh_token,
      });
    }
    // If result.redirected is true, the browser is already navigating to the provider.
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Shared Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to review and send AI drafts.</p>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            Continue with Google
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or use email</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" onClick={handleEmailSignIn} disabled={loading || !email || !password}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </div>
    </main>
  );
}
