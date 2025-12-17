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

  // Profile is created automatically by database trigger
  // Just ensure user was created
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

  revalidatePath("/", "layout");
  // Redirect guests to browse listings, they can access /voyages after login
  redirect("/listings");
}

export async function signIn(
  prevState: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirectTo") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Determine redirect based on user roles
  let destination = redirectTo || "/listings";
  
  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", data.user.id)
      .single();
    
    const roles = profile?.roles || ["guest"];
    
    if (!redirectTo) {
      // Default redirect based on role
      if (roles.includes("host") && !roles.includes("guest")) {
        destination = "/dashboard";
      } else if (roles.includes("guest")) {
        destination = "/voyages";
      }
    }
  }

  revalidatePath("/", "layout");
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
      .select("full_name")
      .eq("id", user.id)
      .single();

    const names = (profile?.full_name || user.email?.split("@")[0] || "").split(
      " ",
    );
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

    // Add host role to profile
    await supabase
      .from("profiles")
      .update({ 
        roles: supabase.rpc ? undefined : ["guest", "host"]  // Will be handled by trigger
      })
      .eq("id", user.id);

    return { hostId: newHost.id, error: null };
  }

  return { hostId: null, error: fetchError?.message || "Erreur inconnue" };
}
