import { exec } from "child_process";
import { NextResponse } from "next/server";
import path from "path";

interface StatsCategories {
  [key: string]: string[];
}

export async function GET() {
  try {
    // First, try to install the dependencies if they're not already installed
    try {
      await new Promise((resolve, reject) => {
        exec("pip install -r requirements.txt", (error, stdout, stderr) => {
          if (error) {
            console.error("Failed to install dependencies:", error);
            console.error("stderr:", stderr);
            reject(error);
            return;
          }
          console.log("Dependencies installed successfully");
          resolve(stdout);
        });
      });
    } catch (error) {
      console.error("Error installing dependencies:", error);
      // Continue anyway as dependencies might already be installed
    }

    const stats = await new Promise<StatsCategories>((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), "app/nba_stats.py");

      exec(`python3 "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing Python script: ${error}`);
          console.error(`stderr: ${stderr}`);
          reject(error);
          return;
        }

        try {
          // Parse the output into a structured format
          const lines = stdout.split("\n");
          const categories: StatsCategories = {};
          let currentCategory = "";

          lines.forEach((line) => {
            if (line.endsWith("Leaders:")) {
              currentCategory = line.replace(" Leaders:", "").trim();
              categories[currentCategory] = [];
            } else if (line.includes("):")) {
              const playerData = line.trim();
              if (currentCategory && playerData) {
                categories[currentCategory].push(playerData);
              }
            }
          });

          if (Object.keys(categories).length === 0) {
            reject(new Error("No data parsed from Python script output"));
            return;
          }

          resolve(categories);
        } catch (parseError) {
          console.error("Error parsing Python output:", parseError);
          reject(parseError);
        }
      });
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats. Please try again later." },
      { status: 500 }
    );
  }
}
