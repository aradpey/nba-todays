import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";

export async function GET(): Promise<Response> {
  try {
    console.log("Executing Python stats function...");

    return await new Promise<Response>((resolve, reject) => {
      const pythonPath = process.env.VERCEL ? "python3" : "python";
      const pythonProcess = spawn(pythonPath, [
        join(process.cwd(), "api", "python", "stats.py"),
      ]);

      let dataString = "";
      let errorString = "";

      pythonProcess.stdout.on("data", (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorString += data.toString();
        console.error("Python error:", data.toString());
      });

      pythonProcess.on("error", (error) => {
        console.error("Failed to start Python process:", error);
        resolve(
          NextResponse.json(
            { error: "Failed to start Python process" },
            { status: 500 }
          )
        );
      });

      pythonProcess.on("close", (code) => {
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
          resolve(NextResponse.json(data));
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
