'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const signUpSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export type AuthState = {
  error?: string
  success?: boolean
  fieldErrors?: Record<string, string[]>
}

export async function signUp(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()
  
  const rawData = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  // Validate input
  const validatedFields = signUpSchema.safeParse(rawData)
  
  if (!validatedFields.success) {
    return {
      error: 'Veuillez corriger les erreurs ci-dessous',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { firstName, lastName, email, password } = validatedFields.data

  // Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Un compte existe déjà avec cet email' }
    }
    return { error: error.message }
  }

  // Le trigger on_auth_user_created_host créera automatiquement l'entrée host
  // Mais on peut aussi le faire manuellement si le trigger n'existe pas encore
  if (data.user) {
    // Vérifier si le host existe déjà
    const { data: existingHost } = await supabase
      .from('hosts')
      .select('id')
      .eq('user_id', data.user.id)
      .single()

    // Créer le host s'il n'existe pas
    if (!existingHost) {
      const { error: hostError } = await supabase.from('hosts').insert({
        user_id: data.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
      })

      if (hostError) {
        console.error('Error creating host profile:', hostError)
        // Ne pas bloquer l'inscription, le host peut être créé plus tard
      }
    }
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    return { 
      success: true, 
      error: 'Vérifiez votre email pour confirmer votre inscription' 
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signIn(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()
  
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Validate input
  const validatedFields = signInSchema.safeParse(rawData)
  
  if (!validatedFields.success) {
    return {
      error: 'Veuillez corriger les erreurs ci-dessous',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login')) {
      return { error: 'Email ou mot de passe incorrect' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Veuillez confirmer votre email avant de vous connecter' }
    }
    return { error: error.message }
  }

  // S'assurer que le profil host existe (au cas où le trigger n'aurait pas fonctionné)
  if (data.user) {
    const { data: existingHost } = await supabase
      .from('hosts')
      .select('id')
      .eq('user_id', data.user.id)
      .single()

    if (!existingHost) {
      // Créer le host maintenant
      await supabase.from('hosts').insert({
        user_id: data.user.id,
        email: data.user.email!,
        first_name: data.user.user_metadata?.first_name || 'User',
        last_name: data.user.user_metadata?.last_name || '',
      })
    }
  }

  // Get redirect URL from form or default to dashboard
  const redirectTo = formData.get('redirectTo') as string || '/dashboard'
  
  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function getHostProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: host } = await supabase
    .from('hosts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return host
}

export async function getHostId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: host } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return host?.id || null
}

export async function updateHostProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Non authentifié' }
  }

  const updates = {
    first_name: formData.get('firstName') as string,
    last_name: formData.get('lastName') as string,
    phone: formData.get('phone') as string || null,
    bio: formData.get('bio') as string || null,
    languages: formData.getAll('languages') as string[],
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('hosts')
    .update(updates)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/profile')
  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email requis' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Un email de réinitialisation a été envoyé' }
}

// Fonction pour obtenir le host_id de manière sécurisée
export async function ensureHostExists(): Promise<{ hostId: string | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { hostId: null, error: 'Non authentifié' }
  }

  // Chercher le host existant
  let { data: host } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Si pas de host, le créer
  if (!host) {
    const { data: newHost, error } = await supabase
      .from('hosts')
      .insert({
        user_id: user.id,
        email: user.email!,
        first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
        last_name: user.user_metadata?.last_name || '',
      })
      .select('id')
      .single()

    if (error) {
      return { hostId: null, error: error.message }
    }
    
    host = newHost
  }

  return { hostId: host.id }
}
