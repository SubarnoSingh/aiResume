import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pdf } from "pdf-parse";

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
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

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error: storageError } = await supabase.storage
      .from("resumes")
      .upload(fileName, file);

    if (storageError) throw storageError;

    const { data: publicUrlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    

    const { data: resumeData, error: dbError } = await supabase
      .from("resumes")
      .insert([
        {
          name,
          file_name: file.name,
          file_url: publicUrl,
        },
      ])
      .select("*")
      .single();

    console.log("Data sent to DB:", { name, fileName: file.name, publicUrl });

    if (dbError) throw dbError;

    return NextResponse.json({ resumeId: resumeData.id, publicUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
