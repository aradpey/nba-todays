import { motion } from "framer-motion";
import Image from "next/image";

interface Team {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  score: number;
  inBonus: boolean;
  timeoutsRemaining: number;
}

interface Game {
  gameId: string;
  homeTeam: Team;
  awayTeam: Team;
  gameStatus: number;
  gameStatusText: string;
  period: number;
  gameClock: string;
  regulationPeriods: number;
}

interface LiveScoresProps {
  games: Game[];
}

export function LiveScores({ games }: LiveScoresProps) {
  if (!games.length) {
    return (
      <div className="text-center text-slate-400 p-8 bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-700/50">
        <p>Loading live scores...</p>
      </div>
    );
  }

  const getStatusColor = (gameStatus: number) => {
    switch (gameStatus) {
      case 1:
        return "text-slate-400";
      case 2:
        return "text-emerald-400 animate-pulse";
      case 3:
        return "text-slate-400";
      default:
        return "text-slate-400";
    }
  };

  const formatGameClock = (clock: string) => {
    // Handle ISO format (PT08M35.00S)
    if (clock.startsWith("PT")) {
      const minutes = clock.match(/(\d+)M/)?.[1] || "0";
      const seconds = clock.match(/(\d+)\.\d+S/)?.[1] || "00";
      return `${minutes}:${seconds.padStart(2, "0")}`;
    }
    return clock;
  };

  const getStatusText = (game: Game) => {
    if (game.gameStatus === 1) return game.gameStatusText;
    if (game.gameStatus === 2) {
      if (game.period > 4) return `OT${game.period - 4}`;
      return `Q${game.period}`;
    }
    return "Final";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {games.map((game) => (
        <motion.div
          key={game.gameId}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:bg-slate-800/70 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-sm font-medium ${getStatusColor(
                  game.gameStatus
                )}`}
              >
                {getStatusText(game)}{" "}
                {game.gameStatus === 2 && formatGameClock(game.gameClock)}
              </span>
              {game.gameStatus === 2 && (
                <span className="text-xs text-slate-400">Live</span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <Image
                    src={`https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`}
                    alt={game.awayTeam.teamName}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-300">
                    {game.awayTeam.teamCity}
                  </span>
                  <span className="text-xs text-slate-400">
                    {game.awayTeam.teamName}
                  </span>
                </div>
              </div>
              <span className="text-2xl font-bold text-white">
                {game.awayTeam.score}
              </span>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <Image
                    src={`https://cdn.nba.com/logos/nba/${game.homeTeam.teamId}/primary/L/logo.svg`}
                    alt={game.homeTeam.teamName}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-300">
                    {game.homeTeam.teamCity}
                  </span>
                  <span className="text-xs text-slate-400">
                    {game.homeTeam.teamName}
                  </span>
                </div>
              </div>
              <span className="text-2xl font-bold text-white">
                {game.homeTeam.score}
              </span>
            </div>

            {/* Additional Game Info */}
            {game.gameStatus === 2 && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>
                  <span className="block">Timeouts Left</span>
                  <div className="flex justify-between mt-1">
                    <span>{game.awayTeam.timeoutsRemaining}</span>
                    <span>{game.homeTeam.timeoutsRemaining}</span>
                  </div>
                </div>
                <div>
                  <span className="block">Bonus</span>
                  <div className="flex justify-between mt-1">
                    <span>{game.awayTeam.inBonus ? "Yes" : "No"}</span>
                    <span>{game.homeTeam.inBonus ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
