import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  try {
    const headersList = headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    console.log("Fetching stats from Python endpoint...");
    const response = await fetch(`${baseUrl}/api/python/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error from Python endpoint:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch stats from Python endpoint" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Received data from Python endpoint:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats. Please try again later." },
      { status: 500 }
    );
  }
}
