import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { profileUpdateSchema, guestPreferencesSchema } from "@/lib/validations/guest"

// GET - Get guest profile and preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json(
        { success: false, error: "Failed to fetch profile" },
        { status: 500 }
      )
    }

    // Get guest preferences
    const { data: preferences } = await supabase
      .from("guest_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // Get analytics
    const { data: analytics } = await supabase
      .from("guest_analytics")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // Get verification status
    const { data: verifications } = await supabase
      .from("verification_requests")
      .select("verification_type, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    const verificationStatus = {
      email: profile?.email_verified || false,
      phone: profile?.phone_verified || false,
      id: profile?.id_verified || false,
      pending: verifications?.filter(v => v.status === "pending" || v.status === "in_review")
        .map(v => v.verification_type) || [],
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          ...profile,
          email: user.email,
        },
        preferences,
        analytics,
        verification_status: verificationStatus,
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update profile or preferences
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const section = body.section // 'profile' or 'preferences'

    if (section === "profile") {
      const validation = profileUpdateSchema.safeParse(body.data)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        )
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .update({
          ...validation.data,
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating profile:", error)
        return NextResponse.json(
          { success: false, error: "Failed to update profile" },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: profile })
    }

    if (section === "preferences") {
      const validation = guestPreferencesSchema.safeParse(body.data)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        )
      }

      // Upsert preferences
      const { data: preferences, error } = await supabase
        .from("guest_preferences")
        .upsert({
          user_id: user.id,
          ...validation.data,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error updating preferences:", error)
        return NextResponse.json(
          { success: false, error: "Failed to update preferences" },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: preferences })
    }

    return NextResponse.json(
      { success: false, error: "Invalid section" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Upload profile photo or ID document
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string // 'avatar' or 'id_document'

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: JPG, PNG, WebP, PDF" },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum 10MB" },
        { status: 400 }
      )
    }

    const bucket = type === "avatar" ? "avatars" : "id-documents"
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { success: false, error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    // Update profile
    if (type === "avatar") {
      await supabase
        .from("profiles")
        .update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    } else if (type === "id_document") {
      const documentType = formData.get("document_type") as string

      // Create verification request
      await supabase.from("verification_requests").insert({
        user_id: user.id,
        verification_type: "id_document",
        document_url: urlData.publicUrl,
        document_type: documentType,
        status: "pending",
      })

      await supabase
        .from("profiles")
        .update({
          id_document_url: urlData.publicUrl,
          id_document_type: documentType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        type,
      },
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
