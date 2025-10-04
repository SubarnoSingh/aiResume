import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Server-side Supabase client with secret key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name")?.toString();
    const file = formData.get("file") as File;

    if (!name || !file) {
      return NextResponse.json(
        { error: "Missing name or file" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    // Upload file to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("resumes")
      .upload(fileName, file);

    if (storageError) throw storageError;

    // Get public URL
    const { data } = supabase.storage.from("resumes").getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    // Insert metadata into table
    const { data: resumeData, error: dbError } = await supabase
      .from("resumes")
      .insert([{ name, file_name: file.name, file_url: publicUrl }])
      .select("*")
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ resumeId: resumeData.id, publicUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
