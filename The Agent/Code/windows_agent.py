import platform
import psutil
import socket
import uuid
import json
import requests
import subprocess
import winreg
import time
from datetime import datetime

# === CONFIGURATION ===
BACKEND_URL = "http://10.40.35.224:3001/api/receive"  # Replace with your LAN server
INTERVAL_SECONDS = 3  # Send data every hour

def get_system_info():
    os_info = {
        "os": platform.system(),
        "version": platform.version(),
    }

    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)
    mac_address = ':'.join(['{:02x}'.format((uuid.getnode() >> ele) & 0xff)
                            for ele in range(0, 8 * 6, 8)][::-1])

    cpu = {
        "physical_cores": psutil.cpu_count(logical=False),
        "total_cores": psutil.cpu_count(logical=True),
        "usage_percent": psutil.cpu_percent(interval=1)
    }

    ram = {
        "total_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
        "used_percent": psutil.virtual_memory().percent
    }

    disk = {
        "total_gb": round(psutil.disk_usage('/').total / (1024 ** 3), 2),
        "used_percent": psutil.disk_usage('/').percent
    }

    return {
        "os_info": os_info,
        "ip": ip_address,
        "mac": mac_address,
        "cpu": cpu,
        "ram": ram,
        "disk": disk
    }

def get_installed_software():
    software_list = []
    keys = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
    ]

    for root in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
        for key_path in keys:
            try:
                reg_key = winreg.OpenKey(root, key_path)
                for i in range(winreg.QueryInfoKey(reg_key)[0]):
                    try:
                        sub = winreg.OpenKey(reg_key, winreg.EnumKey(reg_key, i))
                        name = winreg.QueryValueEx(sub, "DisplayName")[0]
                        version = winreg.QueryValueEx(sub, "DisplayVersion")[0] if has_value(sub, "DisplayVersion") else "Unknown"
                        inst = winreg.QueryValueEx(sub, "InstallDate")[0] if has_value(sub, "InstallDate") else ""
                        size_kb = winreg.QueryValueEx(sub, "EstimatedSize")[0] if has_value(sub, "EstimatedSize") else 0

                        # parse InstallDate from YYYYMMDD → datetime
                        try:
                            dt = datetime.strptime(inst, "%Y%m%d")
                        except:
                            dt = None

                        software_list.append({
                            "name": name,
                            "version": version,
                            "size_mb": round(size_kb/1024, 2),
                            "install_dt": dt  # keep for sorting
                        })
                    except Exception:
                        continue
            except Exception:
                continue

    # sort by install_dt (newest first), take top 40
    software_list = sorted(
        [s for s in software_list if s["install_dt"]],
        key=lambda s: s["install_dt"],
        reverse=True
    )

    return software_list

def has_value(key, name):
    try:
        winreg.QueryValueEx(key, name)
        return True
    except:
        return False



def prepare_payload():
    sys = get_system_info()
    sw = get_installed_software()

    # build the array with correct field names
    software_array = []
    for item in sw:
        software_array.append({
            "name": item["name"],
            "version": item["version"],
            "size": item["size_mb"],                      # server checks `.size`
            "installDate": item["install_dt"].isoformat() # server checks `.installDate`
        })

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "system": {
            "ip": sys["ip"],
            "hostname": socket.gethostname(),
            "os_info": sys["os_info"],
            "mac": sys["mac"],
            "cpu": sys["cpu"],
            "ram": sys["ram"],
            "disk": sys["disk"]
        },
        "software": software_array
    }


def send_data():
    data = prepare_payload()
    try:
        response = requests.post(BACKEND_URL, json=data)
        print("Data sent:", response.status_code)
    except Exception as e:
        print("Failed to send data:", str(e))

def run_loop():
    while True:
        send_data()
        time.sleep(3)

if __name__ == "__main__":
    run_loop()
