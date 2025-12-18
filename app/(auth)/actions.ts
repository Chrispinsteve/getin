"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    firstName?: string[];
    lastName?: string[];
  };
};

// =====================================================
// HELPER: Ensure profile exists (idempotent)
// =====================================================
async function ensureProfileExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string,
  fullName: string = ""
): Promise<{ success: boolean; error?: string }> {
  console.log("[AUTH] Ensuring profile exists for user:", userId);

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: email,
        full_name: fullName,
        roles: ["guest"],
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      }
    );

  if (error) {
    console.error("[AUTH] Profile creation/update failed:", error);
    return { success: false, error: error.message };
  }

  console.log("[AUTH] Profile ensured successfully");
  return { success: true };
}

// =====================================================
// SIGNUP
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

  console.log("[AUTH] Signup attempt for:", email, "mode:", mode);

  // Validate passwords match
  if (password !== confirmPassword) {
    return {
      error: "Les mots de passe ne correspondent pas",
      fieldErrors: {
        confirmPassword: ["Les mots de passe ne correspondent pas"],
      },
    };
  }

  const fullName = `${firstName} ${lastName}`.trim();

  // Step 1: Create auth user
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
    console.error("[AUTH] Signup auth error:", error);
    return { error: error.message };
  }

  if (!data.user) {
    console.error("[AUTH] Signup failed: no user returned");
    return { error: "Erreur lors de la création du compte" };
  }

  console.log("[AUTH] Auth user created:", data.user.id);

  // Step 2: Check if email confirmation is required
  if (data.user && !data.session) {
    console.log("[AUTH] Email confirmation required");
    return {
      success: true,
      error: "Vérifiez votre email pour confirmer votre inscription.",
    };
  }

  // Step 3: Ensure profile exists (atomic, handles race with trigger)
  const profileResult = await ensureProfileExists(
    supabase,
    data.user.id,
    email,
    fullName
  );

  if (!profileResult.success) {
    console.error("[AUTH] Profile creation failed but continuing...");
    // Don't fail signup - the trigger may have created it
  }

  revalidatePath("/", "layout");

  // Step 4: Determine redirect destination
  let destination = "/";

  if (redirectTo && redirectTo.trim() !== "") {
    destination = redirectTo;
  } else if (mode === "host") {
    destination = "/become-a-host";
  } else if (mode === "guest") {
    destination = "/guest/voyages";
  }

  console.log("[AUTH] Signup complete, redirecting to:", destination);
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

  console.log("[AUTH] Sign in attempt for:", email, "mode:", mode);

  // Step 1: Authenticate
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[AUTH] Sign in auth error:", error);
    return { error: error.message };
  }

  console.log("[AUTH] Auth successful for user:", data.user.id);

  // Step 2: Ensure profile exists (handles legacy users without profiles)
  await ensureProfileExists(
    supabase,
    data.user.id,
    data.user.email || email,
    data.user.user_metadata?.full_name || ""
  );

  // Step 3: Get user roles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    console.error("[AUTH] Profile fetch failed:", profileError);
    // Continue with default roles - profile should have been created above
  }

  const roles = profile?.roles || ["guest"];
  const isHost = roles.includes("host");

  console.log("[AUTH] User roles:", roles, "isHost:", isHost);

  revalidatePath("/", "layout");

  // Step 4: Determine redirect destination
  let destination = "/";

  if (redirectTo && redirectTo.trim() !== "") {
    destination = redirectTo;
  } else if (mode === "host") {
    destination = isHost ? "/dashboard" : "/become-a-host";
  } else if (mode === "guest") {
    destination = "/guest/voyages";
  }

  console.log("[AUTH] Sign in complete, redirecting to:", destination);
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
// This is the ONLY place where host records are created
// Called when: user starts host onboarding OR creates a listing
// =====================================================
export async function ensureHostExists(): Promise<{
  hostId: string | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // Step 1: Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[HOST] Not authenticated");
    return { hostId: null, error: "Non authentifié" };
  }

  console.log("[HOST] Ensuring host exists for user:", user.id);

  // Step 2: Ensure profile exists first (required)
  await ensureProfileExists(
    supabase,
    user.id,
    user.email || "",
    user.user_metadata?.full_name || ""
  );

  // Step 3: Check if host record already exists
  const { data: existingHost, error: fetchError } = await supabase
    .from("hosts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingHost) {
    console.log("[HOST] Host already exists:", existingHost.id);
    return { hostId: existingHost.id, error: null };
  }

  // Step 4: Create host record if it doesn't exist (PGRST116 = not found)
  if (fetchError && fetchError.code === "PGRST116") {
    console.log("[HOST] Creating new host record");

    // Get profile for name data
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const names = (
      profile?.full_name ||
      user.email?.split("@")[0] ||
      ""
    ).split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";

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
      console.error("[HOST] Host creation failed:", createError);
      return { hostId: null, error: createError.message };
    }

    console.log("[HOST] Host created successfully:", newHost.id);
    // Note: The database trigger will automatically add 'host' role to profile
    return { hostId: newHost.id, error: null };
  }

  // Unexpected error
  console.error("[HOST] Unexpected error:", fetchError);
  return { hostId: null, error: fetchError?.message || "Erreur inconnue" };
}
