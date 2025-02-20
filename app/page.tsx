import { LeaderboardDashboard } from "@/components/leaderboard-dashboard";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex items-center justify-center gap-4 mb-8">
        <Image
          src="https://cdn.nba.com/logos/leagues/logo-nba.svg"
          alt="NBA Logo"
          width={60}
          height={60}
          className="object-contain"
        />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
          Today&apos;s Leaders
        </h1>
      </div>
      <div className="p-4">
        <LeaderboardDashboard />
      </div>
    </main>
  );
}
