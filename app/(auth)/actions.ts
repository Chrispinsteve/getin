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

/**
 * Intent-based signup
 * 
 * mode=guest → redirect to /guest/voyages (or provided redirect)
 * mode=host → redirect to /become-a-host (or provided redirect)
 * no mode → default to guest experience (/)
 */
export async function signUp(
  prevState: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const mode = formData.get("mode") as string | null;
  const redirectTo = formData.get("redirectTo") as string | null;

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
    console.error("Signup error:", error);
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Erreur lors de la création du compte" };
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    return {
      success: true,
      error: "Vérifiez votre email pour confirmer votre inscription.",
    };
  }

  // Create profile record with default guest role
  // This ensures the profile exists even if database trigger fails
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: data.user.id,
      full_name: fullName,
      email: email,
      roles: ["guest"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    // Don't fail signup if profile creation fails - log and continue
    // The profile may have been created by a database trigger
  }

  revalidatePath("/", "layout");

  // Intent-based redirect - check for non-empty string
  let destination = "/";
  
  if (redirectTo && redirectTo.trim() !== "") {
    // Explicit redirect takes priority (must be non-empty)
    destination = redirectTo;
  } else if (mode === "host") {
    // Host intent → onboarding
    destination = "/become-a-host";
  } else if (mode === "guest") {
    // Guest intent → trips page
    destination = "/guest/voyages";
  }
  // Default (no mode) → homepage

  redirect(destination);
}

/**
 * Intent-based sign in
 * 
 * mode=guest → redirect to guest zone
 * mode=host → redirect to host zone (dashboard if host, become-a-host if not)
 * no mode → respect redirectTo or default to homepage
 */
export async function signIn(
  prevState: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const mode = formData.get("mode") as string | null;
  const redirectTo = formData.get("redirectTo") as string | null;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Get user roles - with fallback if profile doesn't exist
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", data.user.id)
    .single();

  // If profile doesn't exist, create it with default guest role
  if (profileError && profileError.code === "PGRST116") {
    console.log("Creating missing profile for user:", data.user.id);
    await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || "",
        roles: ["guest"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  }

  const roles = profile?.roles || ["guest"];
  const isHost = roles.includes("host");

  revalidatePath("/", "layout");

  // Determine destination based on intent - check for non-empty string
  let destination = "/";

  if (redirectTo && redirectTo.trim() !== "") {
    // Explicit redirect takes priority (must be non-empty)
    destination = redirectTo;
  } else if (mode === "host") {
    // Host intent → dashboard if already host, otherwise onboarding
    destination = isHost ? "/dashboard" : "/become-a-host";
  } else if (mode === "guest") {
    // Guest intent → trips page
    destination = "/guest/voyages";
  }
  // Default (no mode) → homepage

  redirect(destination);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Ensure host profile exists - called during host onboarding
 * Creates host record and adds host role to profile
 */
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

  // Check if host profile exists
  const { data: existingHost, error: fetchError } = await supabase
    .from("hosts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingHost) {
    return { hostId: existingHost.id, error: null };
  }

  // If no host profile exists, create one
  if (fetchError && fetchError.code === "PGRST116") {
    // Get user profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, roles")
      .eq("id", user.id)
      .single();

    const names = (profile?.full_name || user.email?.split("@")[0] || "").split(" ");
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
      console.error("Error creating host:", createError);
      return { hostId: null, error: createError.message };
    }

    // Add host role to profile if not already present
    const currentRoles = profile?.roles || ["guest"];
    if (!currentRoles.includes("host")) {
      await supabase
        .from("profiles")
        .update({ roles: [...currentRoles, "host"] })
        .eq("id", user.id);
    }

    return { hostId: newHost.id, error: null };
  }

  return { hostId: null, error: fetchError?.message || "Erreur inconnue" };
}
