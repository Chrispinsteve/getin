"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthState = {
  error?: string;
  success?: boolean;
  message?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    firstName?: string[];
    lastName?: string[];
  };
};

// =====================================================
// DESIGN DECISION: DB IS SOURCE OF TRUTH FOR PROFILES
// =====================================================
// - Profile creation happens ONLY in the database trigger
// - App code ONLY reads profiles, never inserts
// - This eliminates race conditions and double source of truth
// =====================================================

// =====================================================
// SIGN UP
// =====================================================
export async function signUp(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const mode = formData.get("mode") as string | null;
  const redirectTo = formData.get("redirectTo") as string | null;

  console.log("[AUTH] Signup attempt:", { email, mode });

  if (password !== confirmPassword) {
    return {
      error: "Les mots de passe ne correspondent pas",
      fieldErrors: {
        confirmPassword: ["Les mots de passe ne correspondent pas"],
      },
    };
  }

  const fullName = `${firstName} ${lastName}`.trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    console.error("[AUTH] Signup error:", error);
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Erreur lors de la création du compte" };
  }

  console.log("[AUTH] User created:", data.user.id);

  // Email confirmation required
  if (!data.session) {
    return {
      success: true,
      message: "Vérifiez votre email pour confirmer votre inscription.",
    };
  }

  let destination = "/";

  if (redirectTo?.trim()) {
    destination = redirectTo;
  } else if (mode === "host") {
    destination = "/become-a-host";
  } else if (mode === "guest") {
    destination = "/guest/voyages";
  }

  console.log("[AUTH] Signup redirect:", destination);
  redirect(destination);
}

// =====================================================
// SIGN IN
// =====================================================
export async function signIn(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const mode = formData.get("mode") as string | null;
  const redirectTo = formData.get("redirectTo") as string | null;

  console.log("[AUTH] Sign-in attempt:", { email, mode });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[AUTH] Sign-in error:", error);
    return { error: error.message };
  }

  const userId = data.user.id;
  console.log("[AUTH] Authenticated:", userId);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[AUTH] Profile fetch error:", profileError);
  }

  if (!profile) {
    console.warn("[AUTH] Profile missing, defaulting to guest:", userId);
  }

  const roles = profile?.roles ?? ["guest"];
  const isHost = roles.includes("host");

  let destination = "/";

  if (redirectTo?.trim()) {
    destination = redirectTo;
  } else if (mode === "host") {
    destination = isHost ? "/dashboard" : "/become-a-host";
  } else if (mode === "guest") {
    destination = "/guest/voyages";
  }

  console.log("[AUTH] Sign-in redirect:", destination);
  redirect(destination);
}

// =====================================================
// SIGN OUT
// =====================================================
export async function signOut() {
  const supabase = await createClient();
  console.log("[AUTH] Sign out");
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// =====================================================
// GET USER
// =====================================================
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// =====================================================
// ENSURE HOST EXISTS
// =====================================================
// This is the ONLY place host records are created
// Called from:
// - /become-a-host onboarding
// - Listing creation flow
// =====================================================
export async function ensureHostExists(): Promise<{
  hostId: string | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { hostId: null, error: "Non authentifié" };
  }

  console.log("[HOST] Ensure host for user:", user.id);

  const { data: existingHost, error: fetchError } = await supabase
    .from("hosts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("[HOST] Host fetch error:", fetchError);
    return { hostId: null, error: fetchError.message };
  }

  if (existingHost) {
    return { hostId: existingHost.id, error: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const nameSource =
    profile?.full_name || user.email?.split("@")[0] || "";
  const [firstName, ...rest] = nameSource.split(" ");
  const lastName = rest.join(" ");

  const { data: newHost, error: createError } = await supabase
    .from("hosts")
    .insert({
      user_id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
    })
    .select("id")
    .single();

  if (createError) {
    console.error("[HOST] Host creation error:", createError);
    return { hostId: null, error: createError.message };
  }

  console.log("[HOST] Host created:", newHost.id);
  return { hostId: newHost.id, error: null };
}
