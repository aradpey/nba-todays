"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { IntroAnimation } from "./intro-animation";
import { motion } from "framer-motion";

interface Stats {
  [key: string]: string[];
}

interface PlayerStats {
  name: string;
  team: string;
  Points: string;
  Rebounds: string;
  Assists: string;
  Steals: string;
  Blocks: string;
  "Field Goals": string;
  "3-Pointers": string;
  "Free Throws": string;
}

const getStatSuffix = (category: string): string => {
  const suffixes: { [key: string]: string } = {
    Points: "PTS",
    Rebounds: "REB",
    Assists: "AST",
    Steals: "STL",
    Blocks: "BLK",
    "Field Goals": "FGM",
    "3-Pointers": "3's",
    "Free Throws": "FT's",
  };
  return suffixes[category] || "";
};

export function LeaderboardDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending" | null;
  }>({ key: "", direction: null });

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        const data = await response.json();
        if (isMounted) {
          setStats(data.stats);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to fetch stats");
          console.error("Error fetching stats:", err);
          setLoading(false);
        }
      }
    };

    fetchStats();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleIntroComplete = () => {
    setTimeout(() => setShowIntro(false), 100);
  };

  // Always show intro when loading or showing intro animation
  if (showIntro || loading) {
    return (
      <IntroAnimation
        onAnimationComplete={handleIntroComplete}
        isLoading={loading}
      />
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4 animate-fade-in">
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-4 animate-fade-in">
        <p>No stats available</p>
      </div>
    );
  }

  const categories = Object.keys(stats);

  // Helper function to get unique players and their stats
  const getAllPlayersStats = () => {
    const players = new Map();

    categories.forEach((category) => {
      stats[category].forEach((player) => {
        const [playerInfo, valueAndImage] = player.split(": ");
        const [value] = valueAndImage.split(" ||| ");
        const teamAbbr = playerInfo.split(" (")[1].replace(")", "");
        const playerName = playerInfo.split(" (")[0];

        if (!players.has(playerName)) {
          players.set(playerName, {
            name: playerName,
            team: teamAbbr,
            Points: "-",
            Rebounds: "-",
            Assists: "-",
            Steals: "-",
            Blocks: "-",
            "Field Goals": "-",
            "3-Pointers": "-",
            "Free Throws": "-",
          });
        }

        players.get(playerName)[category] = value;
      });
    });

    return Array.from(players.values());
  };

  const sortData = (data: PlayerStats[], key: keyof PlayerStats) => {
    return [...data].sort((a, b) => {
      const aValue = a[key] === "-" ? -Infinity : parseFloat(a[key]);
      const bValue = b[key] === "-" ? -Infinity : parseFloat(b[key]);

      if (sortConfig.direction === "ascending") {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
  };

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" | null = "descending";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "descending") {
        direction = "ascending";
      } else if (sortConfig.direction === "ascending") {
        direction = "descending";
      }
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: string) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? " ↑" : " ↓";
    }
    return "";
  };

  return (
    <motion.div
      className="container mx-auto p-4 min-h-screen bg-slate-900 rounded-3xl border border-slate-700/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Tabs defaultValue={categories[0]} className="w-full">
        <div className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/70 rounded-xl mb-6 p-1">
          <TabsList className="w-full flex justify-between gap-1 bg-transparent">
            {[...categories, "All Stats"].map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="flex-1 py-3 text-base font-medium tracking-wide transition-all duration-300
                          data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500/80 data-[state=active]:to-purple-600/80
                          data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105
                          data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/10
                          rounded-lg"
              >
                {category === "All Stats" ? "ALL STATS" : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* All Stats Tab */}
        <TabsContent
          value="All Stats"
          className="transition-all duration-500 data-[state=inactive]:opacity-0 data-[state=active]:opacity-100"
        >
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white text-center">
                Complete Player Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="p-4 text-left text-slate-300">Player</th>
                      <th className="p-4 text-left text-slate-300">Team</th>
                      {[
                        { key: "Points", label: "PTS" },
                        { key: "Rebounds", label: "REB" },
                        { key: "Assists", label: "AST" },
                        { key: "Steals", label: "STL" },
                        { key: "Blocks", label: "BLK" },
                        { key: "Field Goals", label: "FGM" },
                        { key: "3-Pointers", label: "3's" },
                        { key: "Free Throws", label: "FT's" },
                      ].map(({ key, label }) => (
                        <th
                          key={key}
                          className="p-4 text-center text-slate-300 cursor-pointer hover:text-white transition-colors"
                          onClick={() => requestSort(key)}
                        >
                          {label}
                          {getSortIndicator(key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortConfig.key
                      ? sortData(
                          getAllPlayersStats(),
                          sortConfig.key as keyof PlayerStats
                        ).map((player) => (
                          <tr
                            key={player.name}
                            className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="p-4 font-medium text-white">
                              {player.name}
                            </td>
                            <td className="p-4 text-slate-300">
                              {player.team}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player.Points}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player.Rebounds}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player.Assists}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player.Steals}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player.Blocks}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player["Field Goals"]}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player["3-Pointers"]}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player["Free Throws"]}
                            </td>
                          </tr>
                        ))
                      : getAllPlayersStats().map((player) => (
                          <tr
                            key={player.name}
                            className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="p-4 font-medium text-white">
                              {player.name}
                            </td>
                            <td className="p-4 text-slate-300">
                              {player.team}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player.Points}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player.Rebounds}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player.Assists}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player.Steals}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player.Blocks}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player["Field Goals"]}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player["3-Pointers"]}
                            </td>
                            <td className="p-4 text-center text-slate-300">
                              {player["Free Throws"]}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Existing Category Tabs */}
        {categories.map((category) => (
          <TabsContent
            key={category}
            value={category}
            className="transition-all duration-500 data-[state=inactive]:opacity-0 data-[state=active]:opacity-100"
          >
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white text-center">
                  {category} Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {stats[category].map((player, index) => {
                    const [playerInfo, valueAndImage] = player.split(": ");
                    const [value, imageUrl] = valueAndImage.split(" ||| ");
                    const teamAbbr = playerInfo.split(" (")[1].replace(")", "");

                    return (
                      <div
                        key={index}
                        className="relative flex items-center p-8 rounded-lg overflow-hidden
                                 bg-gradient-to-r from-gray-900/90 to-slate-950/90
                                 hover:from-gray-900 hover:to-slate-950
                                 transition-all duration-300 group min-h-[220px]
                                 animate-slide-in"
                        style={{
                          animationDelay: `${index * 100}ms`,
                        }}
                      >
                        {/* Huge Background Team Logo */}
                        <div
                          className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.12] transition-opacity duration-300"
                          style={{
                            backgroundImage: `url(https://cdn.nba.com/logos/nba/${getTeamId(
                              teamAbbr
                            )}/primary/L/logo.svg)`,
                            backgroundSize: "800px",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            transform: "scale(2)",
                          }}
                        />

                        {/* Single Large Team Logo on Right */}
                        <div
                          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-60 group-hover:opacity-70 transition-opacity duration-300"
                          style={{
                            width: "180px",
                            height: "180px",
                            backgroundImage: `url(https://cdn.nba.com/logos/nba/${getTeamId(
                              teamAbbr
                            )}/primary/L/logo.svg)`,
                            backgroundSize: "contain",
                            backgroundPosition: "center right",
                            backgroundRepeat: "no-repeat",
                          }}
                        />

                        <div className="flex items-center gap-10 z-10 flex-1">
                          {/* Ranking Number */}
                          <div className="mr-8">
                            <div className="relative flex items-center justify-center w-20 h-20">
                              <div className="absolute inset-0 bg-white/10 rounded-xl backdrop-blur-sm" />
                              <div className="relative text-6xl font-black bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                                #{index + 1}
                              </div>
                            </div>
                          </div>

                          {/* Player Image */}
                          <div className="relative w-52 h-52 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shadow-xl">
                            <Image
                              src={imageUrl || "/player-placeholder.svg"}
                              alt={`${playerInfo} headshot`}
                              fill
                              sizes="(max-width: 208px) 100vw, 208px"
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/player-placeholder.svg";
                              }}
                            />
                          </div>

                          {/* Player Info */}
                          <div className="flex flex-col bg-white/10 backdrop-blur-sm px-6 py-4 rounded-2xl">
                            <span className="font-bold text-white text-3xl">
                              {playerInfo.split(" (")[0]}
                            </span>
                            <span className="text-xl text-slate-300 mt-1 font-medium">
                              {teamAbbr}
                            </span>
                          </div>

                          {/* Stats Value (Right-aligned) */}
                          <div className="ml-auto mr-40">
                            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl transition-all duration-300 group-hover:bg-white/15">
                              <span className="text-6xl font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent drop-shadow-lg">
                                {value}{" "}
                                <span className="text-3xl">
                                  {getStatSuffix(category)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}

// Helper function to get team ID from abbreviation
function getTeamId(abbr: string): number {
  const teamIds: { [key: string]: number } = {
    ATL: 1610612737,
    BOS: 1610612738,
    BKN: 1610612751,
    CHA: 1610612766,
    CHI: 1610612741,
    CLE: 1610612739,
    DAL: 1610612742,
    DEN: 1610612743,
    DET: 1610612765,
    GSW: 1610612744,
    HOU: 1610612745,
    IND: 1610612754,
    LAC: 1610612746,
    LAL: 1610612747,
    MEM: 1610612763,
    MIA: 1610612748,
    MIL: 1610612749,
    MIN: 1610612750,
    NOP: 1610612740,
    NYK: 1610612752,
    OKC: 1610612760,
    ORL: 1610612753,
    PHI: 1610612755,
    PHX: 1610612756,
    POR: 1610612757,
    SAC: 1610612758,
    SAS: 1610612759,
    TOR: 1610612761,
    UTA: 1610612762,
    WAS: 1610612764,
  };
  return teamIds[abbr] || 0;
}
