import os
import sys
import subprocess

def main():
    # It now only expects one argument: the path to the project
    if len(sys.argv) != 2:
        print("Usage: python run_bot.py <path_to_foul_play>")
        sys.exit(1)

    project_path = sys.argv[1]
    
    # The command to run the foul-play bot remains the same
    command = ['python', '-u', 'run.py']
    
    # We no longer need to pass any environment variables,
    # because foultest.py has already prepared the 'env' file.
    process = subprocess.Popen(
        command,
        cwd=project_path, # Sets the working directory to the correct version
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding='utf-8' # Good practice to specify encoding
    )
    
    # This part for printing the output remains the same
    print(f"--- Starting log for: {os.path.basename(project_path)} ---")
    for line in iter(process.stdout.readline, ''):
        # We can add a prefix to distinguish between the two bots' outputs
        print(f"[{os.path.basename(project_path)}]: {line.strip()}")
        
    process.wait()
    print(f"--- Log for {os.path.basename(project_path)} finished ---")

if __name__ == "__main__":
    main()