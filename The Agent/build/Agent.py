import psutil
import platform
import winreg
import requests
import json
import socket
from datetime import datetime
import time

# Configuration
SERVER_URL = "http://10.99.179.224:3001/api/receive"
AUTH_TOKEN = "your-secret-token"
INTERVAL_SECONDS = 60  # Send data every 60 seconds (adjust as needed)

def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # Google DNS
        ip = s.getsockname()[0]
    except Exception:
        ip = socket.gethostbyname(socket.gethostname())
    finally:
        s.close()
    return ip

def get_system_info():
    return {
        "hostname": socket.gethostname(),
        "ip": get_ip_address(),
        "os": f"{platform.system()} {platform.release()}",
        "cpu": psutil.cpu_percent(interval=1),
        "ram": psutil.virtual_memory().percent,
        "storage": psutil.disk_usage('C:').percent,
        "cores": psutil.cpu_count(logical=False),
        "threads": psutil.cpu_count(logical=True)
    }

def get_installed_software():
    software = []
    registry_paths = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
    ]
    
    for path in registry_paths:
        try:
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, path) as key:
                for i in range(winreg.QueryInfoKey(key)[0]):
                    try:
                        subkey_name = winreg.EnumKey(key, i)
                        with winreg.OpenKey(key, subkey_name) as subkey:
                            try:
                                name = winreg.QueryValueEx(subkey, "DisplayName")[0]
                                version = winreg.QueryValueEx(subkey, "DisplayVersion")[0] if winreg.QueryValueEx(subkey, "DisplayVersion") else "N/A"
                                software.append({"name": name, "version": version})
                            except WindowsError:
                                continue
                    except WindowsError:
                        continue
        except WindowsError:
            continue
    
    return software

def send_to_server(data):
    try:
        headers = {
            "Authorization": f"Bearer {AUTH_TOKEN}",
            "Content-Type": "application/json"
        }
        response = requests.post(SERVER_URL, json=data, headers=headers, timeout=10)
        response.raise_for_status()
        print(f"Data sent successfully at {datetime.now()}")
        return True
    except Exception as e:
        print(f"Failed to send data: {str(e)}")
        return False

def main():
    while True:
        start_time = time.time()
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "system": get_system_info(),
            "software": get_installed_software()
        }
        
        print("Collected data:", json.dumps(report, indent=2))
        send_to_server(report)
        
        elapsed = time.time() - start_time
        sleep_time = max(0, INTERVAL_SECONDS - elapsed)
        time.sleep(sleep_time)

if __name__ == "__main__":
    try:
        print(f"Starting system monitor (sending every {INTERVAL_SECONDS} seconds)")
        print(f"Server: {SERVER_URL}")
        print("Press Ctrl+C to stop")
        main()
    except KeyboardInterrupt:
        print("\nMonitoring stopped")