import os
import subprocess
import time
import itertools
import threading
from datetime import datetime

# --- Configuration ---
RUN_TOURNAMENT = False
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GAMES_PER_MATCHUP = 1
SEARCH_TIME_MS = 250
LOG_LEVEL = "ERROR"
RESULTS_FILE = "tournament_results.csv"
TEAM_A_NAME = "gen3/ou/mybandmence"
TEAM_B_NAME = "gen3/ou/sample"
# --- Paths ---
TEAMS_SUBDIRECTORY = "teams/teams/gen3/ou"
PATH_TO_VERSION_A = os.path.join(SCRIPT_DIR, "foul-play")
PATH_TO_VERSION_B = os.path.join(SCRIPT_DIR, "foul-play-restricted_sampling")
ENV_A_PATH = "envA"
ENV_B_PATH = "envB"



# --- Helper Functions ---
def apply_config(base_env_path, target_env_path, config_dict):
    lines = []
    with open(base_env_path, 'r') as f:
        lines = f.readlines()
    config_map = {}
    for line in lines:
        if '=' in line:
            key, val = line.strip().split('=', 1)
            config_map[key] = val
    config_map.update(config_dict)
    with open(target_env_path, 'w') as f:
        for key, val in config_map.items():
            f.write(f"{key}={val}\n")

def get_username_from_env(env_file_path):
    """Helper function to read the PS_USERNAME from an env file."""
    with open(env_file_path, 'r') as f:
        for line in f:
            if line.strip().startswith("PS_USERNAME"):
                return line.strip().split('=', 1)[1]
    raise ValueError(f"PS_USERNAME not found in {env_file_path}")

def discover_teams(base_path):
    """Scans the teams directory and returns a list of team names."""
    teams_dir_to_scan = os.path.join(base_path, TEAMS_SUBDIRECTORY)

    if not os.path.isdir(teams_dir_to_scan):
        print(f"Error: Teams directory not found at {teams_dir_to_scan}")
        return []

    team_name_prefix = os.path.relpath(teams_dir_to_scan, os.path.join(base_path, "teams/teams"))
    
    team_names = []
    for filename in os.listdir(teams_dir_to_scan):
        
        # Remove the '.txt' extension from the filename
        name_without_extension = os.path.splitext(filename)[0]
        # Create the relative path that the bot expects
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
    # Create the file with a header if it doesn't exist
    if not os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE, 'w') as f:
            f.write("timestamp,version_a_team,version_b_team,winner\n")

    # Append the new result
    with open(RESULTS_FILE, 'a') as f:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        team_a_name = os.path.basename(team_a)
        team_b_name = os.path.basename(team_b)
        print("logging 2")
        print(timestamp, team_a_name, team_b_name, winner)
        f.write(f"{timestamp},{team_a_name},{team_b_name},{winner}\n")
        f.flush()
        print("done logging")

def watch_and_parse_log(log_dir, bot_username, version_name, result_queue, process):
    """
    Waits for a log file, reads its existing content, and then tails it.
    After the process ends, it does a final read to catch any last-second logs.
    """
    print(f"[{version_name}]: Watching for log file in '{log_dir}'...")
    log_file_path = None
    
    # Wait for up to 30 seconds for the log file to appear
    for _ in range(60):
        if process.poll() is not None: break
        
        files_in_dir = os.listdir(log_dir)
        matching_files = [f for f in files_in_dir if f.endswith(f"_{bot_username}.log")]
        if matching_files:
            latest_file = max([(os.path.join(log_dir, f), os.path.getctime(os.path.join(log_dir, f))) for f in matching_files], key=lambda item: item[1])
            log_file_path = latest_file[0]
        
        if log_file_path: break
        time.sleep(0.5)

    if not log_file_path:
        print(f"[{version_name}]: Process finished or timed out before log file was found.")
        return

    print(f"[{version_name}]: Found log file: {os.path.basename(log_file_path)}")
    
    with open(log_file_path, 'r', encoding='utf-8') as f:
        # First, read any content that might already be in the file.
        for line in f:
            if "INFO     Winner: " in line:
                winner_name = line.split("Winner: ")[1].strip()
                if winner_name.lower() != bot_username.lower(): result_queue.append(version_name)
                return
        
        # If no winner was found, start tailing the file for new lines.
        while process.poll() is None:
            line = f.readline()
            if not line:
                time.sleep(0.1)
                continue
            
            if "INFO     Winner: " in line:
                winner_name = line.split("Winner: ")[1].strip()
                if winner_name.lower() != bot_username.lower(): result_queue.append(version_name)
                return

        # --- THIS IS THE FIX ---
        # After the process has finished, read any remaining lines in the buffer.
        print(f"[{version_name}]: Process finished. Reading final log entries...")
        for line in f:
            if "INFO     Winner: " in line:
                winner_name = line.split("Winner: ")[1].strip()
                if winner_name.lower() != bot_username.lower():
                    print(f"[{version_name}]: Detected WIN (in final read)")
                    result_queue.append(version_name)
                return

    print(f"[{version_name}]: Log tailing finished.")

def run_matchup(team_a, team_b):
    print(f"\n--- Starting Matchup: {os.path.basename(team_a)} (A) vs. {os.path.basename(team_b)} (B) ---")
    
    env_a_target = os.path.join(PATH_TO_VERSION_A, "env")
    env_b_target = os.path.join(PATH_TO_VERSION_B, "env")
    original_env_a = open(env_a_target).read() if os.path.exists(env_a_target) else ""
    original_env_b = open(env_b_target).read() if os.path.exists(env_b_target) else ""

    result_queue = []
    
    try:
        config = { "RUN_COUNT": 1, "SEARCH_TIME_MS": SEARCH_TIME_MS, "LOG_LEVEL": LOG_LEVEL }
        config_a = config.copy()
        config_a["TEAM_NAME"] = team_a
        config_b = config.copy()
        config_b["TEAM_NAME"] = team_b
        apply_config(ENV_A_PATH, env_a_target, config_a)
        apply_config(ENV_B_PATH, env_b_target, config_b)
        
        # --- MODIFIED LOGIC ---
        # 1. Launch the acceptor process

        envi = os.environ.copy()
        envi["PYTHONUTF8"] = "1"

        acceptor_process = subprocess.Popen(
            ['python', '-u', 'run_bot.py', PATH_TO_VERSION_A],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', env=envi
        )
        
        # 2. Wait for our new, reliable "ready" signal
        # print("Waiting for Acceptor bot to be ready...")
        # for line in iter(acceptor_process.stdout.readline, ''):
        #     # We still print all output for debugging
        #     output = f"[Version A]: {line.strip()}"
        #     print(output)
        #     # --- THIS IS THE KEY CHANGE ---
        #     # We now look for our custom, log-level-independent signal
        #     if "BOT_READY_FOR_CHALLENGE" in line:
        #         print("Acceptor is ready. Starting Challenger.")
        #         break

        time.sleep(3)
        
        # 3. Now, launch the challenger
        challenger_process = subprocess.Popen(
            ['python', '-u', 'run_bot.py', PATH_TO_VERSION_B],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', env=envi
        )
        

        # --- THIS IS THE KEY CHANGE ---
        # Wait a few seconds to give the bots time to start the battle
        # and create their log files before we start looking for them.
        print("Giving bots time to start the battle...")
        time.sleep(10) # 5 seconds should be a safe buffer

        # # 4. Create and start the reader threads for the REST of the output
        # acceptor_thread = threading.Thread(target=stream_reader, args=(acceptor_process.stdout, "Version A", result_queue))
        # challenger_thread = threading.Thread(target=stream_reader, args=(challenger_process.stdout, "Version B", result_queue))
        # acceptor_thread.start()
        # challenger_thread.start()
        
        # --- Start Log Watchers ---
        acceptor_thread = threading.Thread(target=watch_and_parse_log, args=(os.path.join(PATH_TO_VERSION_A, "logs"), get_username_from_env(ENV_B_PATH), "Version A", result_queue, acceptor_process))
        challenger_thread = threading.Thread(target=watch_and_parse_log, args=(os.path.join(PATH_TO_VERSION_B, "logs"), get_username_from_env(ENV_A_PATH), "Version B", result_queue, challenger_process))
        acceptor_thread.start()
        challenger_thread.start()

        challenger_process.wait()
        acceptor_process.wait()
        challenger_thread.join()
        acceptor_thread.join()

    finally:
        with open(env_a_target, 'w') as f: f.write(original_env_a)
        with open(env_b_target, 'w') as f: f.write(original_env_b)

    return result_queue[0] if result_queue else "DRAW/ERROR"

def main():
    start_time = time.monotonic()
    
    if RUN_TOURNAMENT:
        teams = discover_teams(PATH_TO_VERSION_A)
        if len(teams) < 1: return

        matchups = list(itertools.permutations(teams, 2)) if len(teams) > 1 else [(teams[0], teams[0])]
        
        print(f"\n--- Starting Tournament: {len(matchups)} matchups, {GAMES_PER_MATCHUP} games each ---")
        
        for i, (team_for_a, team_for_b) in enumerate(matchups):
            for game in range(GAMES_PER_MATCHUP):
                print(f"\n--- Matchup {i + 1}/{len(matchups)}, Game {game + 1}/{GAMES_PER_MATCHUP} ---")
                winner = run_matchup(team_for_a, team_for_b)
                print(team_for_a, team_for_b, winner)
                log_result_to_file(team_for_a, team_for_b, winner)
                print(f"--- Winner: {winner} ---")
    else:
        # Simplified Head-to-Head
        winner = run_matchup(TEAM_A_NAME, TEAM_B_NAME)
        print(TEAM_A_NAME, TEAM_B_NAME, winner)
        log_result_to_file(TEAM_A_NAME, TEAM_B_NAME, winner)
        print(f"--- Winner: {winner} ---")

    end_time = time.monotonic()
    minutes, seconds = divmod(end_time - start_time, 60)
    
    print("\n--- Testing Complete ---")
    print(f"Results have been logged to {RESULTS_FILE}")
    print(f"Total execution time: {int(minutes)} minutes and {seconds:.2f} seconds")

if __name__ == "__main__":
    main()