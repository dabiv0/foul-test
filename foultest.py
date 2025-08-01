import os
import subprocess
import time
import itertools
import threading
from datetime import datetime
import configparser

# --- Configuration ---
config = configparser.ConfigParser()
# --- THIS IS THE FIX ---
# This tells the parser to keep the original capitalization of keys
config.optionxform = lambda option: option
config.read('foultest.ini')

settings = config['Settings']
paths = config['Paths']
bot_defaults = config['BotDefaults']
version_a_config = config['VersionA']
version_b_config = config['VersionB']

RUN_TOURNAMENT = settings.getboolean('RunTournament')
GAMES_PER_MATCHUP = settings.getint('GamesPerMatchup')
RESULTS_FILE = settings['ResultsFile']

TEAMS_SUBDIRECTORY = paths['TeamsSubdirectory']
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PATH_TO_VERSION_A = os.path.join(SCRIPT_DIR, paths['PathToVersionA'])
PATH_TO_VERSION_B = os.path.join(SCRIPT_DIR, paths['PathToVersionB'])


# --- Helper Functions ---
def write_env_file(target_env_path, team_name, bot_specific_config):
    """Generates an env file from the config."""
    with open(target_env_path, 'w') as f:
        # Write default bot settings
        for key, val in bot_defaults.items():
            f.write(f"{key}={val}\n")
        
        # Write bot-specific settings, excluding TEAM_NAME to avoid duplicates
        for key, val in bot_specific_config.items():
            if key != 'TEAM_NAME':
                f.write(f"{key}={val}\n")
            
        # Write the team name for the current matchup
        f.write(f"TEAM_NAME={team_name}\n")

def get_username_from_config(bot_specific_config):
    """Helper function to read the PS_USERNAME from the config."""
    # --- THIS IS A FIX ---
    # The key is now uppercase
    return bot_specific_config['PS_USERNAME']

def discover_teams(base_path):
    """Scans the teams directory and returns a list of team names."""
    teams_dir_to_scan = os.path.join(base_path, TEAMS_SUBDIRECTORY)
    
    if not os.path.isdir(teams_dir_to_scan):
        print(f"Error: Teams directory not found at {teams_dir_to_scan}")
        return []
    else:
        print(f"Looking for teams at {teams_dir_to_scan}")

    team_name_prefix = os.path.relpath(teams_dir_to_scan, os.path.join(base_path, "teams/teams"))
    
    team_names = []
    for filename in os.listdir(teams_dir_to_scan):
        name_without_extension = os.path.splitext(filename)[0]
        relative_path = os.path.join(team_name_prefix, name_without_extension).replace('\\', '/')
        team_names.append(relative_path)
            
    print(f"Discovered {len(team_names)} teams: {team_names}")
    return team_names

def stream_reader(pipe, prefix, result_queue):
    for line in iter(pipe.readline, ''):
        output = f"[{prefix}]: {line.strip()}"
        print(output)
        if "Won with team:" in output:
            result_queue.append(prefix)
    pipe.close()

def log_result_to_file(team_a, team_b, winner):
    """Appends the result of a single game to the CSV log file."""
    print("logging")
    if not os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE, 'w') as f:
            f.write("timestamp,version_a_team,version_b_team,winner\n")

    with open(RESULTS_FILE, 'a') as f:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        team_a_name = os.path.basename(team_a)
        team_b_name = os.path.basename(team_b)
        f.write(f"{timestamp},{team_a_name},{team_b_name},{winner}\n")
        f.flush()
        print("done logging")

def watch_and_parse_log(log_dir, opponent_username, version_name, result_queue, process):
    """
    Waits for a log file and parses it for the winner.
    """
    print(f"[{version_name}]: Watching for log file in '{log_dir}'...")
    log_file_path = None
    
    for _ in range(60):
        if process.poll() is not None: break
        
        try:
            files_in_dir = os.listdir(log_dir)
            matching_files = [f for f in files_in_dir if f.endswith(f"_{opponent_username}.log")]
            if matching_files:
                latest_file = max([(os.path.join(log_dir, f), os.path.getctime(os.path.join(log_dir, f))) for f in matching_files], key=lambda item: item[1])
                log_file_path = latest_file[0]
        except FileNotFoundError:
            time.sleep(0.5)
            continue
        
        if log_file_path: break
        time.sleep(0.5)

    if not log_file_path:
        print(f"[{version_name}]: Process finished or timed out before log file was found.")
        return

    print(f"[{version_name}]: Found log file: {os.path.basename(log_file_path)}")
    
    with open(log_file_path, 'r', encoding='utf-8') as f:
        my_username = get_username_from_config(version_a_config if version_name == "Version A" else version_b_config)
        while process.poll() is None:
            line = f.readline()
            if not line:
                time.sleep(0.1)
                continue
            
            if "INFO     Winner: " in line:
                winner_name = line.split("Winner: ")[1].strip()
                if winner_name.lower() == my_username.lower(): 
                    result_queue.append(version_name)
                return

        print(f"[{version_name}]: Process finished. Reading final log entries...")
        for line in f:
            if "INFO     Winner: " in line:
                winner_name = line.split("Winner: ")[1].strip()
                if winner_name.lower() != my_username.lower():
                    result_queue.append(version_name)
                return

    print(f"[{version_name}]: Log tailing finished.")


def run_matchup(team_a, team_b):
    print(f"\n--- Starting Matchup: {os.path.basename(team_a)} (A) vs. {os.path.basename(team_b)} (B) ---")
    
    env_a_target = os.path.join(PATH_TO_VERSION_A, "env")
    env_b_target = os.path.join(PATH_TO_VERSION_B, "env")
    
    result_queue = []
    
    try:
        write_env_file(env_a_target, team_a, version_a_config)
        write_env_file(env_b_target, team_b, version_b_config)
        
        envi = os.environ.copy()
        envi["PYTHONUTF8"] = "1"

        acceptor_process = subprocess.Popen(
            ['python', '-u', 'run_bot.py', PATH_TO_VERSION_A],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', env=envi
        )
        
        time.sleep(3)
        
        challenger_process = subprocess.Popen(
            ['python', '-u', 'run_bot.py', PATH_TO_VERSION_B],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', env=envi
        )
        
        print("Giving bots time to start the battle...")
        time.sleep(10)
        
        acceptor_username = get_username_from_config(version_a_config)
        challenger_username = get_username_from_config(version_b_config)
        
        acceptor_thread = threading.Thread(target=watch_and_parse_log, args=(os.path.join(PATH_TO_VERSION_A, "logs"), challenger_username, "Version A", result_queue, acceptor_process))
        challenger_thread = threading.Thread(target=watch_and_parse_log, args=(os.path.join(PATH_TO_VERSION_B, "logs"), acceptor_username, "Version B", result_queue, challenger_process))
        acceptor_thread.start()
        challenger_thread.start()

        challenger_process.wait()
        acceptor_process.wait()
        challenger_thread.join()
        acceptor_thread.join()

    finally:
        pass

    return result_queue[0] if result_queue else "DRAW/ERROR"

def main():
    start_time = time.monotonic()
    
    if RUN_TOURNAMENT:
        teams = discover_teams(PATH_TO_VERSION_A)
        if not teams:
            print("No teams found. Exiting.")
            return

        matchups = list(itertools.permutations(teams, 2)) if len(teams) > 1 else [(teams[0], teams[0])]
        
        print(f"\n--- Starting Tournament: {len(matchups)} matchups, {GAMES_PER_MATCHUP} games each ---")
        
        for i, (team_for_a, team_for_b) in enumerate(matchups):
            for game in range(GAMES_PER_MATCHUP):
                print(f"\n--- Matchup {i + 1}/{len(matchups)}, Game {game + 1}/{GAMES_PER_MATCHUP} ---")
                winner = run_matchup(team_for_a, team_for_b)
                log_result_to_file(team_for_a, team_for_b, winner)
                print(f"--- Winner: {winner} ---")
    else:
        # --- THIS IS A FIX ---
        # The key is now uppercase
        team_a = version_a_config.get('TEAM_NAME')
        team_b = version_b_config.get('TEAM_NAME')
        winner = run_matchup(team_a, team_b)
        log_result_to_file(team_a, team_b, winner)
        print(f"--- Winner: {winner} ---")

    end_time = time.monotonic()
    minutes, seconds = divmod(end_time - start_time, 60)
    
    print("\n--- Testing Complete ---")
    print(f"Results have been logged to {RESULTS_FILE}")
    print(f"Total execution time: {int(minutes)} minutes and {seconds:.2f} seconds")

if __name__ == "__main__":
    main()