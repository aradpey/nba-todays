import sys
from pathlib import Path

# Add vendor directory to module search path
PARENT_DIR = Path(__file__).parent.absolute()
VENDOR_DIR = PARENT_DIR / "vendor"
sys.path.append(str(VENDOR_DIR))

from nba_api.stats.endpoints import LeagueGameFinder
from nba_api.live.nba.endpoints import scoreboard, boxscore
import pandas as pd
import numpy as np
from http.server import BaseHTTPRequestHandler
from http import HTTPStatus
import json
import traceback
import logging
from datetime import datetime
import time

# Configure logging with more details
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stderr)
    ],  # Send logs to stderr instead of stdout
)
logger = logging.getLogger(__name__)


def log_error(error_msg, error=None):
    """Log error with traceback if available"""
    if error:
        logger.error(f"{error_msg}: {str(error)}\nTraceback: {traceback.format_exc()}")
    else:
        logger.error(error_msg)
    # Print errors to stderr
    print(f"ERROR: {error_msg}", file=sys.stderr)
    if error:
        print(f"Exception: {str(error)}\n{traceback.format_exc()}", file=sys.stderr)


def get_player_image_url(player_id):
    return f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"


def parse_iso_duration(duration):
    """Parse ISO duration format (e.g. PT34M51.02S) into minutes and seconds"""
    if not duration or duration == "PT00M00.00S":
        return 0.0

    try:
        # Remove PT and S
        duration = duration.replace("PT", "").replace("S", "")
        # Split into minutes and seconds
        parts = duration.split("M")
        minutes = float(parts[0])
        seconds = float(parts[1]) if len(parts) > 1 else 0
        return minutes + (seconds / 60)
    except:
        return 0.0


def format_iso_duration(duration):
    """Format ISO duration format (e.g. PT34M51.02S) into MM:SS"""
    if not duration or duration == "PT00M00.00S":
        return "0:00"

    try:
        # Remove PT and S
        duration = duration.replace("PT", "").replace("S", "")
        # Split into minutes and seconds
        parts = duration.split("M")
        minutes = int(float(parts[0]))
        seconds = int(float(parts[1])) if len(parts) > 1 else 0
        return f"{minutes}:{seconds:02d}"
    except:
        return "0:00"


def get_todays_stats():
    start_time = time.time()
    logger.info("Starting stats fetch")

    try:
        logger.info("Fetching scoreboard data...")
        games = scoreboard.ScoreBoard()
        games_dict = games.get_dict()

        logger.info(f"Found {len(games_dict['scoreboard']['games'])} games")

        # Process live game scores
        live_games = []
        for game in games_dict["scoreboard"]["games"]:
            game_info = {
                "gameId": game["gameId"],
                "homeTeam": {
                    "teamId": game["homeTeam"]["teamId"],
                    "teamName": game["homeTeam"]["teamName"],
                    "teamCity": game["homeTeam"]["teamCity"],
                    "teamTricode": game["homeTeam"]["teamTricode"],
                    "score": game["homeTeam"]["score"],
                    "inBonus": game["homeTeam"].get("inBonus", False),
                    "timeoutsRemaining": game["homeTeam"].get("timeoutsRemaining", 0),
                },
                "awayTeam": {
                    "teamId": game["awayTeam"]["teamId"],
                    "teamName": game["awayTeam"]["teamName"],
                    "teamCity": game["awayTeam"]["teamCity"],
                    "teamTricode": game["awayTeam"]["teamTricode"],
                    "score": game["awayTeam"]["score"],
                    "inBonus": game["awayTeam"].get("inBonus", False),
                    "timeoutsRemaining": game["awayTeam"].get("timeoutsRemaining", 0),
                },
                "gameStatus": game["gameStatus"],
                "gameStatusText": game["gameStatusText"],
                "period": game["period"],
                "gameClock": game["gameClock"],
                "regulationPeriods": game["regulationPeriods"],
            }
            live_games.append(game_info)

        # Get both in-progress and completed games for stats
        active_games = [
            game
            for game in games_dict["scoreboard"]["games"]
            if game["gameStatus"] in [2, 3]  # 2 = in progress, 3 = completed
        ]

        logger.info(f"Found {len(active_games)} active or completed games")

        if not active_games:
            logger.warning("No active or completed games available for today")
            return {
                "stats": {},
                "games": live_games,
                "message": "No games are currently active or completed. Check back later for today's stats.",
            }

        all_player_stats = []
        has_valid_stats = False

        # Process each active game
        for game in active_games:
            game_id = game["gameId"]
            try:
                logger.info(f"Processing game {game_id} (status: {game['gameStatus']})")

                # Use live boxscore endpoint
                box = boxscore.BoxScore(game_id)
                box_data = box.get_dict()

                # Process both home and away team players
                players_data = []

                # Add home team players
                for player in box_data["game"]["homeTeam"]["players"]:
                    if player["statistics"]["minutes"] != "PT00M00.00S":
                        player_dict = {
                            "PLAYER_NAME": player["name"],
                            "PLAYER_ID": player["personId"],
                            "TEAM_ABBREVIATION": game["homeTeam"]["teamTricode"],
                            "MIN": player["statistics"]["minutes"],
                            "PTS": player["statistics"]["points"],
                            "REB": player["statistics"]["reboundsTotal"],
                            "AST": player["statistics"]["assists"],
                            "STL": player["statistics"]["steals"],
                            "BLK": player["statistics"]["blocks"],
                            "TO": player["statistics"]["turnovers"],
                            "FGM": player["statistics"]["fieldGoalsMade"],
                            "FGA": player["statistics"]["fieldGoalsAttempted"],
                            "FG3M": player["statistics"]["threePointersMade"],
                            "FG3A": player["statistics"]["threePointersAttempted"],
                            "FTM": player["statistics"]["freeThrowsMade"],
                            "FTA": player["statistics"]["freeThrowsAttempted"],
                        }
                        players_data.append(player_dict)

                # Add away team players
                for player in box_data["game"]["awayTeam"]["players"]:
                    if player["statistics"]["minutes"] != "PT00M00.00S":
                        player_dict = {
                            "PLAYER_NAME": player["name"],
                            "PLAYER_ID": player["personId"],
                            "TEAM_ABBREVIATION": game["awayTeam"]["teamTricode"],
                            "MIN": player["statistics"]["minutes"],
                            "PTS": player["statistics"]["points"],
                            "REB": player["statistics"]["reboundsTotal"],
                            "AST": player["statistics"]["assists"],
                            "STL": player["statistics"]["steals"],
                            "BLK": player["statistics"]["blocks"],
                            "TO": player["statistics"]["turnovers"],
                            "FGM": player["statistics"]["fieldGoalsMade"],
                            "FGA": player["statistics"]["fieldGoalsAttempted"],
                            "FG3M": player["statistics"]["threePointersMade"],
                            "FG3A": player["statistics"]["threePointersAttempted"],
                            "FTM": player["statistics"]["freeThrowsMade"],
                            "FTA": player["statistics"]["freeThrowsAttempted"],
                        }
                        players_data.append(player_dict)

                # Convert to DataFrame
                if players_data:
                    player_stats = pd.DataFrame(players_data)
                    has_valid_stats = True
                    logger.info(f"Found valid stats for game {game_id}")

                    # Add game status
                    game_status = (
                        "Final"
                        if game["gameStatus"] == 3
                        else f"Q{game['period']} {game['gameStatusText']}"
                    )
                    player_stats["GAME_STATUS"] = game_status

                    # Calculate percentages
                    player_stats["FG_PCT"] = pd.Series(
                        np.where(
                            player_stats["FGA"] > 0,
                            (player_stats["FGM"] / player_stats["FGA"] * 100).round(1),
                            0,
                        )
                    ).fillna(0)

                    player_stats["FG3_PCT"] = pd.Series(
                        np.where(
                            player_stats["FG3A"] > 0,
                            (player_stats["FG3M"] / player_stats["FG3A"] * 100).round(
                                1
                            ),
                            0,
                        )
                    ).fillna(0)

                    player_stats["FT_PCT"] = pd.Series(
                        np.where(
                            player_stats["FTA"] > 0,
                            (player_stats["FTM"] / player_stats["FTA"] * 100).round(1),
                            0,
                        )
                    ).fillna(0)

                    logger.info(
                        f"Game {game_id} processed stats shape: {player_stats.shape}"
                    )
                    all_player_stats.append(player_stats)
                    logger.info(f"Successfully processed game {game_id}")
                else:
                    logger.info(f"No player data available for game {game_id}")
            except Exception as e:
                log_error(f"Error processing game {game_id}", e)
                continue

        if not all_player_stats:
            logger.warning("No player statistics available")
            return {
                "stats": {},
                "games": live_games,
                "message": "No player statistics available yet",
            }

        if not has_valid_stats:
            logger.warning("Games are in progress but no valid statistics yet")
            return {
                "stats": {},
                "games": live_games,
                "message": "Games are currently in progress, but statistics are not yet available. Please check back in a few minutes.",
            }

        # Combine all stats
        logger.info("Combining all player stats")
        combined_stats = pd.concat(all_player_stats)
        logger.info(f"Combined stats shape: {combined_stats.shape}")

        # Format minutes for sorting and display
        combined_stats["MIN_SORT"] = combined_stats["MIN"].apply(parse_iso_duration)
        combined_stats["MIN"] = combined_stats["MIN"].apply(format_iso_duration)

        categories = {
            "Points": "PTS",
            "Rebounds": "REB",
            "Assists": "AST",
            "Steals": "STL",
            "Blocks": "BLK",
            "Minutes": "MIN",
            "Turnovers": "TO",
            "Field Goal %": "FG_PCT",
            "3-Point %": "FG3_PCT",
            "Free Throw %": "FT_PCT",
        }

        results = {}
        logger.info("Processing statistics by category")

        for category_name, column in categories.items():
            try:
                logger.info(f"Processing {category_name} category with column {column}")
                if category_name == "Minutes":
                    top_players = combined_stats.nlargest(30, "MIN_SORT", keep="all")
                elif category_name in ["Field Goal %", "3-Point %", "Free Throw %"]:
                    attempts_col = {
                        "Field Goal %": "FGA",
                        "3-Point %": "FG3A",
                        "Free Throw %": "FTA",
                    }[category_name]
                    made_col = attempts_col.replace("A", "M")
                    # Filter players with minimum attempts
                    valid_players = combined_stats[
                        (combined_stats[attempts_col] >= 3)
                        & (combined_stats["MIN_SORT"] > 0)
                    ]
                    if len(valid_players) > 0:
                        top_players = valid_players.nlargest(30, column, keep="all")
                    else:
                        top_players = pd.DataFrame()
                else:
                    active_players = combined_stats[combined_stats["MIN_SORT"] > 0]
                    top_players = active_players.nlargest(30, column, keep="all")

                results[category_name] = []

                for _, player in top_players.iterrows():
                    if category_name == "Minutes":
                        value = player["MIN"]
                    elif category_name in ["Field Goal %", "3-Point %", "Free Throw %"]:
                        attempts_col = {
                            "Field Goal %": "FGA",
                            "3-Point %": "FG3A",
                            "Free Throw %": "FTA",
                        }[category_name]
                        made_col = attempts_col.replace("A", "M")
                        pct = player[column]
                        made = int(player[made_col])
                        attempts = int(player[attempts_col])
                        value = f"{pct:.1f}% ({made}/{attempts})"
                        logger.info(
                            f"Percentage stat for {player['PLAYER_NAME']}: {value}"
                        )
                    else:
                        value = str(int(player[column]))

                    # Include game status in player info
                    player_info = f"{player['PLAYER_NAME']} ({player['TEAM_ABBREVIATION']}) [{player['GAME_STATUS']}]: {value} ||| {get_player_image_url(player['PLAYER_ID'])}"
                    results[category_name].append(player_info)
                    logger.info(f"Added player info: {player_info}")

                logger.info(f"Successfully processed {category_name} category")
            except Exception as e:
                log_error(f"Error processing {category_name} category", e)
                continue

        logger.info(f"Final results categories: {list(results.keys())}")

        end_time = time.time()
        logger.info(
            f"Stats processing completed in {end_time - start_time:.2f} seconds"
        )
        return {"stats": results, "games": live_games}

    except Exception as e:
        log_error("Error in main stats function", e)
        return {"error": str(e), "games": []}


if __name__ == "__main__":
    try:
        result = get_todays_stats()
        # Ensure only the JSON output goes to stdout
        print(json.dumps(result), file=sys.stdout)
        sys.stdout.flush()
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stdout)
        sys.stdout.flush()
