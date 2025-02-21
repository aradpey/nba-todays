import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";
import type { ChildProcess } from "child_process";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    console.log("Executing Python stats function...");

    return await new Promise<Response>((resolve) => {
      const pythonProcess: ChildProcess = spawn("python3", [
        join(process.cwd(), "api", "python", "stats.py"),
      ]);

      let dataString = "";
      let errorString = "";
      let headers: Record<string, string> = {};
      let isReadingHeaders = true;

      pythonProcess.stdout?.on("data", (data: Buffer) => {
        const output = data.toString();
        if (isReadingHeaders) {
          // Split the output into lines
          const lines = output.split("\n");
          for (const line of lines) {
            if (line.trim() === "") {
              isReadingHeaders = false;
              continue;
            }
            if (isReadingHeaders && line.includes(":")) {
              const [key, value] = line.split(":", 2);
              headers[key.trim()] = value.trim();
            } else {
              dataString += line + "\n";
            }
          }
        } else {
          dataString += output;
        }
      });

      pythonProcess.stderr?.on("data", (data: Buffer) => {
        errorString += data.toString();
        console.error("Python error:", data.toString());
      });

      pythonProcess.on("error", (error: Error) => {
        console.error("Failed to start Python process:", error);
        resolve(
          NextResponse.json(
            { error: "Failed to start Python process" },
            { status: 500 }
          )
        );
      });

      pythonProcess.on("close", (code: number | null) => {
        console.log("Python process exited with code:", code);

        if (code !== 0) {
          console.error("Error output:", errorString);
          resolve(
            NextResponse.json(
              { error: "Failed to fetch stats from Python script" },
              { status: 500 }
            )
          );
          return;
        }

        try {
          // Find the last valid JSON object in the output
          const jsonMatch = dataString.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No valid JSON found in output");
          }
          const jsonStr = jsonMatch[0];
          const data = JSON.parse(jsonStr);

          // Create response with CORS headers
          const response = NextResponse.json(data);
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });

          resolve(response);
        } catch (error) {
          console.error("Error parsing Python output:", error);
          console.error("Raw output:", dataString);
          resolve(
            NextResponse.json(
              { error: "Failed to parse stats data" },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats. Please try again later." },
      { status: 500 }
    );
  }
}
