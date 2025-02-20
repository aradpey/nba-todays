from nba_api.stats.endpoints import LeagueGameFinder, BoxScoreTraditionalV2
from nba_api.live.nba.endpoints import scoreboard
from datetime import datetime
import pandas as pd
import sys
from collections import defaultdict


def get_player_image_url(player_id):
    """Get the NBA.com headshot URL for a player."""
    return f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"


def format_minutes(minutes_str):
    try:
        print(
            f"DEBUG: Formatting minutes value: '{minutes_str}' (type: {type(minutes_str)})"
        )
        if pd.isna(minutes_str) or not str(minutes_str).strip():
            print("DEBUG: Empty or NaN minutes value")
            return "0:00"

        # Clean up the input string
        minutes_str = str(minutes_str)
        if "." in minutes_str and ":" in minutes_str:
            # Handle format like "33.000000:46"
            base_minutes = minutes_str.split(":")[0]
            seconds = minutes_str.split(":")[1]
            minutes = int(float(base_minutes))
            result = f"{minutes}:{int(seconds):02d}"
            print(f"DEBUG: Special format - Result: {result}")
            return result
        elif ":" in minutes_str:
            # Handle MM:SS format
            parts = minutes_str.split(":")
            minutes = int(parts[0])
            seconds = int(parts[1])
            result = f"{minutes}:{seconds:02d}"
            print(f"DEBUG: MM:SS format - Result: {result}")
            return result
        else:
            # Handle decimal format
            total_minutes = float(minutes_str)
            minutes = int(total_minutes)
            seconds = int((total_minutes - minutes) * 60)
            result = f"{minutes}:{seconds:02d}"
            print(f"DEBUG: Decimal format - Result: {result}")
            return result
    except Exception as e:
        print(f"Error formatting minutes: {e}", file=sys.stderr)
        return "0:00"


def get_todays_stats():
    try:
        print("Fetching today's NBA game data...")

        # Get today's games
        games = scoreboard.ScoreBoard()
        games_dict = games.get_dict()

        if not games_dict["scoreboard"]["games"]:
            print("No games available for today.")
            return

        # Initialize containers for player stats
        all_player_stats = []

        # Process each game
        for game in games_dict["scoreboard"]["games"]:
            game_id = game["gameId"]
            try:
                # Get detailed box score for the game
                box_score = BoxScoreTraditionalV2(game_id=game_id)
                player_stats = box_score.get_data_frames()[0]  # Player stats

                # Calculate FG% and round to nearest whole number
                player_stats["FG_PCT"] = (
                    ((player_stats["FGM"] / player_stats["FGA"]) * 100)
                    .round()
                    .fillna(0)
                )

                # Calculate 3P% and round to nearest whole number
                player_stats["FG3_PCT"] = (
                    ((player_stats["FG3M"] / player_stats["FG3A"]) * 100)
                    .round()
                    .fillna(0)
                )

                # Calculate FT% and round to nearest whole number
                player_stats["FT_PCT"] = (
                    ((player_stats["FTM"] / player_stats["FTA"]) * 100)
                    .round()
                    .fillna(0)
                )

                print(f"\nDEBUG: Game {game_id} minutes data:")
                print(f"Minutes column present: {'MIN' in player_stats.columns}")
                if "MIN" in player_stats.columns:
                    print("Sample of raw minutes data:")
                    print(player_stats[["PLAYER_NAME", "MIN"]].head())
                all_player_stats.append(player_stats)
            except Exception as e:
                print(f"Error fetching stats for game {game_id}: {e}", file=sys.stderr)
                continue

        if not all_player_stats:
            print("No player statistics available yet.")
            return

        # Combine all player stats
        combined_stats = pd.concat(all_player_stats)

        print("\nDEBUG: Combined stats minutes data before formatting:")
        print(combined_stats[["PLAYER_NAME", "MIN"]].head())

        # Create a numeric minutes column for sorting
        combined_stats["MIN_SORT"] = combined_stats["MIN"].apply(
            lambda x: float(str(x).split(":")[0]) if pd.notna(x) else 0
        )

        # Format minutes for display
        combined_stats["MIN"] = combined_stats["MIN"].apply(format_minutes)

        print("\nDEBUG: Combined stats minutes data after formatting:")
        print(combined_stats[["PLAYER_NAME", "MIN", "MIN_SORT"]].head())

        # Define categories and their corresponding columns
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

        print("\nTop 30 Players in Each Category:")
        print("=" * 50)

        # Process each category
        for category_name, column in categories.items():
            print(f"\n{category_name} Leaders:")
            print("-" * 30)

            try:
                if category_name == "Minutes":
                    # Use the numeric minutes column for sorting
                    top_players = combined_stats.nlargest(30, "MIN_SORT", keep="all")
                elif category_name == "FG%":
                    # Only include players who attempted at least 1 field goal
                    valid_players = combined_stats[combined_stats["FGA"] > 0]
                    top_players = valid_players.nlargest(30, column)
                    for idx, player in top_players.iterrows():
                        value = f"{int(player[column])}% ({int(player['FGM'])}/{int(player['FGA'])})"
                        player_image = get_player_image_url(player["PLAYER_ID"])
                        print(
                            f"{player['PLAYER_NAME']} ({player['TEAM_ABBREVIATION']}): {value} ||| {player_image}"
                        )
                elif category_name == "3P%":
                    # Only include players who attempted at least 1 three pointer
                    valid_players = combined_stats[combined_stats["FG3A"] > 0]
                    top_players = valid_players.nlargest(30, column)
                    for idx, player in top_players.iterrows():
                        value = f"{int(player[column])}% ({int(player['FG3M'])}/{int(player['FG3A'])})"
                        player_image = get_player_image_url(player["PLAYER_ID"])
                        print(
                            f"{player['PLAYER_NAME']} ({player['TEAM_ABBREVIATION']}): {value} ||| {player_image}"
                        )
                elif category_name == "FT%":
                    # Only include players who attempted at least 1 free throw
                    valid_players = combined_stats[combined_stats["FTA"] > 0]
                    top_players = valid_players.nlargest(30, column)
                    for idx, player in top_players.iterrows():
                        value = f"{int(player[column])}% ({int(player['FTM'])}/{int(player['FTA'])})"
                        player_image = get_player_image_url(player["PLAYER_ID"])
                        print(
                            f"{player['PLAYER_NAME']} ({player['TEAM_ABBREVIATION']}): {value} ||| {player_image}"
                        )
                else:
                    # Ensure numeric conversion for all other stats
                    combined_stats[column] = (
                        pd.to_numeric(combined_stats[column], errors="coerce")
                        .fillna(0)
                        .astype(int)
                    )
                    # Filter out players with no minutes played
                    active_players = combined_stats[combined_stats["MIN_SORT"] > 0]
                    top_players = active_players.nlargest(30, column)

                # Display top 30 players (only for non-percentage stats)
                if category_name not in ["FG%", "3P%", "FT%"]:
                    for idx, player in top_players.iterrows():
                        if category_name == "Minutes":
                            value = player["MIN"]  # Use formatted minutes for display
                        else:
                            value = int(player[column])

                        player_image = get_player_image_url(player["PLAYER_ID"])
                        print(
                            f"{player['PLAYER_NAME']} ({player['TEAM_ABBREVIATION']}): {value} ||| {player_image}"
                        )

            except Exception as e:
                print(f"Error processing {category_name}: {str(e)}", file=sys.stderr)
                if category_name == "Turnovers":
                    print("DEBUG: Available columns:", list(combined_stats.columns))
                continue

    except Exception as e:
        print(f"Error in main function: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    get_todays_stats()
