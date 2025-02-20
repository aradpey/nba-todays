from nba_api.stats.endpoints import LeagueGameFinder, BoxScoreTraditionalV2
from nba_api.live.nba.endpoints import scoreboard
from datetime import datetime
import pandas as pd
import sys
from collections import defaultdict
from http.server import BaseHTTPRequestHandler
import json


def get_player_image_url(player_id):
    """Get the NBA.com headshot URL for a player."""
    return f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"


def format_minutes(minutes_str):
    try:
        if pd.isna(minutes_str) or not str(minutes_str).strip():
            return "0:00"

        minutes_str = str(minutes_str)
        if "." in minutes_str and ":" in minutes_str:
            base_minutes = minutes_str.split(":")[0]
            seconds = minutes_str.split(":")[1]
            minutes = int(float(base_minutes))
            return f"{minutes}:{int(seconds):02d}"
        elif ":" in minutes_str:
            parts = minutes_str.split(":")
            minutes = int(parts[0])
            seconds = int(parts[1])
            return f"{minutes}:{seconds:02d}"
        else:
            total_minutes = float(minutes_str)
            minutes = int(total_minutes)
            seconds = int((total_minutes - minutes) * 60)
            return f"{minutes}:{seconds:02d}"
    except Exception as e:
        print(f"Error formatting minutes: {e}", file=sys.stderr)
        return "0:00"


def get_todays_stats():
    try:
        games = scoreboard.ScoreBoard()
        games_dict = games.get_dict()

        if not games_dict["scoreboard"]["games"]:
            return {"error": "No games available for today."}

        all_player_stats = []

        for game in games_dict["scoreboard"]["games"]:
            game_id = game["gameId"]
            try:
                box_score = BoxScoreTraditionalV2(game_id=game_id)
                player_stats = box_score.get_data_frames()[0]

                player_stats["FG_PCT"] = (
                    ((player_stats["FGM"] / player_stats["FGA"]) * 100)
                    .round()
                    .fillna(0)
                )
                player_stats["FG3_PCT"] = (
                    ((player_stats["FG3M"] / player_stats["FG3A"]) * 100)
                    .round()
                    .fillna(0)
                )
                player_stats["FT_PCT"] = (
                    ((player_stats["FTM"] / player_stats["FTA"]) * 100)
                    .round()
                    .fillna(0)
                )

                all_player_stats.append(player_stats)
            except Exception as e:
                print(f"Error fetching stats for game {game_id}: {e}", file=sys.stderr)
                continue

        if not all_player_stats:
            return {"error": "No player statistics available yet."}

        combined_stats = pd.concat(all_player_stats)
        combined_stats["MIN_SORT"] = combined_stats["MIN"].apply(
            lambda x: float(str(x).split(":")[0]) if pd.notna(x) else 0
        )
        combined_stats["MIN"] = combined_stats["MIN"].apply(format_minutes)

        categories = {
            "Points": "PTS",
            "Rebounds": "REB",
            "Assists": "AST",
            "Steals": "STL",
            "Blocks": "BLK",
            "Minutes": "MIN",
            "Turnovers": "TO",
            "FG%": "FG_PCT",
            "3P%": "FG3_PCT",
            "FT%": "FT_PCT",
        }

        results = {}

        for category_name, column in categories.items():
            try:
                if category_name == "Minutes":
                    top_players = combined_stats.nlargest(30, "MIN_SORT", keep="all")
                elif category_name == "FG%":
                    valid_players = combined_stats[combined_stats["FGA"] > 0]
                    top_players = valid_players.nlargest(30, column)
                elif category_name == "3P%":
                    valid_players = combined_stats[combined_stats["FG3A"] > 0]
                    top_players = valid_players.nlargest(30, column)
                elif category_name == "FT%":
                    valid_players = combined_stats[combined_stats["FTA"] > 0]
                    top_players = valid_players.nlargest(30, column)
                else:
                    combined_stats[column] = (
                        pd.to_numeric(combined_stats[column], errors="coerce")
                        .fillna(0)
                        .astype(int)
                    )
                    active_players = combined_stats[combined_stats["MIN_SORT"] > 0]
                    top_players = active_players.nlargest(30, column)

                results[category_name] = []

                for _, player in top_players.iterrows():
                    if category_name == "Minutes":
                        value = player["MIN"]
                    elif category_name in ["FG%", "3P%", "FT%"]:
                        attempts_col = {"FG%": "FGA", "3P%": "FG3A", "FT%": "FTA"}[
                            category_name
                        ]
                        made_col = attempts_col.replace("A", "M")
                        value = f"{int(player[column])}% ({int(player[made_col])}/{int(player[attempts_col])})"
                    else:
                        value = str(int(player[column]))

                    player_info = f"{player['PLAYER_NAME']} ({player['TEAM_ABBREVIATION']}): {value} ||| {get_player_image_url(player['PLAYER_ID'])}"
                    results[category_name].append(player_info)

            except Exception as e:
                print(f"Error processing {category_name}: {str(e)}", file=sys.stderr)
                continue

        return {"stats": results}

    except Exception as e:
        print(f"Error in main function: {e}", file=sys.stderr)
        return {"error": str(e)}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()

        result = get_todays_stats()
        self.wfile.write(json.dumps(result).encode())
