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
    return { error: error.message };
  }

  // Create profile
  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: fullName,
    });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    return {
      success: true,
      error: "Vérifiez votre email pour confirmer votre inscription.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signIn(
  prevState: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
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

    return { hostId: newHost.id, error: null };
  }

  return { hostId: null, error: fetchError?.message || "Erreur inconnue" };
}
