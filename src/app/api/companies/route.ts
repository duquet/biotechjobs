import { NextResponse } from "next/server";
import { db } from "@/db";
import { biotechCompanies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const companies = await db.select().from(biotechCompanies);
    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Convert empty string timestamps to null
    const fixTimestamp = (val: any) => (val === "" ? null : val);
    const fixedData = {
      ...data,
      contactDate: fixTimestamp(data.contactDate),
      createdAt: fixTimestamp(data.createdAt),
      updatedAt: fixTimestamp(data.updatedAt),
    };

    console.log("[API] Attempting to insert company:", fixedData);
    const result = await db
      .insert(biotechCompanies)
      .values(fixedData)
      .returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("[API] Error inserting company:", error);
    return NextResponse.json(
      { error: "Failed to create company", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    const result = await db
      .update(biotechCompanies)
      .set(updateData)
      .where(eq(biotechCompanies.id, id))
      .returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    await db
      .delete(biotechCompanies)
      .where(eq(biotechCompanies.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
