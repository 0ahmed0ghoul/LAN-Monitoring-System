import platform
import psutil
import socket
import uuid
import json
import requests
import subprocess
import time
from datetime import datetime

# === CONFIGURATION ===
BACKEND_URL = "http://10.40.35.224:3001/api/receive"  # Replace with your backend IP or domain
INTERVAL_SECONDS = 3600  # Send data every hour


def get_system_info():
    hostname = socket.gethostname()
    try:
        ip_address = socket.gethostbyname(hostname)
    except:
        ip_address = "Unavailable"

    mac_address = ':'.join(['{:02x}'.format((uuid.getnode() >> ele) & 0xff)
                            for ele in range(0, 8 * 6, 8)][::-1])

    return {
        "ip": ip_address,
        "hostname": hostname,
        "os_info": {
            "os": platform.system(),
            "version": platform.version(),
        },
        "mac": mac_address,
        "cpu": {
            "physical_cores": psutil.cpu_count(logical=False),
            "total_cores": psutil.cpu_count(logical=True),
            "usage_percent": psutil.cpu_percent(interval=1)
        },
        "ram": {
            "total_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
            "used_percent": psutil.virtual_memory().percent
        },
        "disk": {
            "total_gb": round(psutil.disk_usage('/').total / (1024 ** 3), 2),
            "used_percent": psutil.disk_usage('/').percent
        }
    }


def get_installed_packages():
    try:
        output = subprocess.check_output(['dpkg-query', '-W', '-f=${Package} ${Version}\n'])
        lines = output.decode().splitlines()
        packages = []
        for line in lines:
            try:
                name, version = line.strip().split()
                packages.append({
                    "name": name,
                    "version": version,
                    "size": None,  # Optional: size gathering can be added
                    "installDate": None  # No direct install date available via dpkg
                })
            except:
                continue
        return packages
    except Exception as e:
        print("Error getting installed packages:", str(e))
        return []


def prepare_payload():
    sys = get_system_info()
    sw = get_installed_packages()

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "system": sys,
        "software": sw
    }


def send_data():
    try:
        data = prepare_payload()
        response = requests.post(BACKEND_URL, json=data)
        print(f"[{datetime.now()}] Data sent, status: {response.status_code}")
    except Exception as e:
        print(f"[{datetime.now()}] Failed to send data:", str(e))


def run_loop():
    while True:
        send_data()
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    run_loop()
