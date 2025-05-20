import sys
import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import time
import platform
import psutil
import uuid
import json
import requests
import winreg
from datetime import datetime
import logging
import traceback
import os

# Configure logging
LOG_DIR = "C:\\Agent"
LOG_FILE = os.path.join(LOG_DIR, 'agent.log')

try:
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)
    logging.basicConfig(
        filename=LOG_FILE,
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
except Exception as e:
    logging.basicConfig(level=logging.INFO)
    logging.error(f"Failed to configure file logging: {str(e)}")

# Configuration
BACKEND_URL = "http://10.40.35.224:3001/api/receive"
INTERVAL_SECONDS = 3
MAX_RETRIES = 3
RETRY_DELAY = 5

def get_system_info():
    """Collect comprehensive system information"""
    try:
        os_info = {
            "os": platform.system(),
            "version": platform.version(),
            "release": platform.release(),
            "architecture": platform.architecture()[0],
            "machine": platform.machine()
        }
        
        hostname = socket.gethostname()
        try:
            ip_address = socket.gethostbyname(hostname)
        except socket.gaierror:
            ip_address = "127.0.0.1"
            
        mac_address = ':'.join(['{:02x}'.format((uuid.getnode() >> ele) & 0xff)
                              for ele in range(0, 8 * 6, 8)][::-1])

        cpu = {
            "physical_cores": psutil.cpu_count(logical=False),
            "total_cores": psutil.cpu_count(logical=True),
            "usage_percent": psutil.cpu_percent(interval=1),
            "frequency": psutil.cpu_freq().current if hasattr(psutil, 'cpu_freq') else None
        }

        vm = psutil.virtual_memory()
        ram = {
            "total_gb": round(vm.total / (1024 ** 3), 2),
            "used_percent": vm.percent,
            "available_gb": round(vm.available / (1024 ** 3), 2)
        }

        disk = psutil.disk_usage('/')
        disk_info = {
            "total_gb": round(disk.total / (1024 ** 3), 2),
            "used_percent": disk.percent,
            "free_gb": round(disk.free / (1024 ** 3), 2)
        }

        return {
            "os_info": os_info,
            "ip": ip_address,
            "hostname": hostname,
            "mac": mac_address,
            "cpu": cpu,
            "ram": ram,
            "disk": disk_info
        }
    except Exception as e:
        logging.error(f"Error getting system info: {str(e)}")
        return {}

def has_value(key, name):
    """Check if registry value exists"""
    try:
        winreg.QueryValueEx(key, name)
        return True
    except WindowsError:
        return False

def get_installed_software():
    """Get list of installed software from registry"""
    software_list = []
    keys = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
    ]

    for root in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
        for key_path in keys:
            try:
                with winreg.OpenKey(root, key_path) as reg_key:
                    for i in range(winreg.QueryInfoKey(reg_key)[0]):
                        try:
                            subkey_name = winreg.EnumKey(reg_key, i)
                            with winreg.OpenKey(reg_key, subkey_name) as sub:
                                try:
                                    name = winreg.QueryValueEx(sub, "DisplayName")[0]
                                except WindowsError:
                                    continue
                                
                                version = winreg.QueryValueEx(sub, "DisplayVersion")[0] if has_value(sub, "DisplayVersion") else "Unknown"
                                inst = winreg.QueryValueEx(sub, "InstallDate")[0] if has_value(sub, "InstallDate") else ""
                                size_kb = winreg.QueryValueEx(sub, "EstimatedSize")[0] if has_value(sub, "EstimatedSize") else 0

                                try:
                                    dt = datetime.strptime(inst, "%Y%m%d") if inst else None
                                except ValueError:
                                    dt = None

                                publisher = winreg.QueryValueEx(sub, "Publisher")[0] if has_value(sub, "Publisher") else "Unknown"

                                software_list.append({
                                    "name": name,
                                    "version": version,
                                    "publisher": publisher,
                                    "size_mb": round(size_kb/1024, 2) if size_kb else 0,
                                    "install_dt": dt
                                })
                        except Exception as e:
                            logging.error(f"Error processing subkey {subkey_name}: {str(e)}")
                            continue
            except Exception as e:
                logging.error(f"Error opening registry key {key_path}: {str(e)}")
                continue

    # Filter and sort software
    software_list = sorted(
        [s for s in software_list if s.get("name")],
        key=lambda s: s.get("install_dt") or datetime.min,
        reverse=True
    )
    return software_list

def prepare_payload():
    """Prepare the data payload to send to server"""
    try:
        sys_info = get_system_info()
        software = get_installed_software()
        
        software_array = []
        for item in software:
            software_array.append({
                "name": item.get("name", ""),
                "version": item.get("version", "Unknown"),
                "publisher": item.get("publisher", "Unknown"),
                "size": item.get("size_mb", 0),
                "installDate": item["install_dt"].isoformat() if item.get("install_dt") else ""
            })

        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "system": {
                "ip": sys_info.get("ip", ""),
                "hostname": sys_info.get("hostname", ""),
                "os_info": sys_info.get("os_info", {}),
                "mac": sys_info.get("mac", ""),
                "cpu": sys_info.get("cpu", {}),
                "ram": sys_info.get("ram", {}),
                "disk": sys_info.get("disk", {})
            },
            "software": software_array
        }
        return payload
    except Exception as e:
        logging.error(f"Error preparing payload: {str(e)}")
        return {}

def send_data():
    """Send data to backend with retry logic"""
    for attempt in range(MAX_RETRIES):
        try:
            payload = prepare_payload()
            if not payload:
                logging.warning("Empty payload, skipping send")
                return False
                
            headers = {'Content-Type': 'application/json'}
            response = requests.post(
                BACKEND_URL,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                logging.info(f"Data sent successfully. Response: {response.text}")
                return True
            else:
                logging.warning(f"Server returned status {response.status_code}: {response.text}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
                
        except requests.exceptions.RequestException as e:
            logging.error(f"Request failed (attempt {attempt + 1}): {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
        except Exception as e:
            logging.error(f"Unexpected error during send (attempt {attempt + 1}): {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
    
    return False

class AgentService(win32serviceutil.ServiceFramework):
    """Windows Service implementation for the agent"""
    _svc_name_ = "AgentMonitoringService"
    _svc_display_name_ = "Agent Monitoring Service"
    _svc_description_ = "Collects and sends system/software data to backend server."

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        self.is_alive = True

    def SvcStop(self):
        """Handle service stop request"""
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        self.is_alive = False
        logging.info("Service stop requested")

    def SvcDoRun(self):
        """Main service execution"""
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        logging.info("Service started")
        self.main()

    def main(self):
        """Main service loop"""
        while self.is_alive:
            try:
                send_data()
            except Exception as e:
                logging.error(f"Error in main loop: {str(e)}")
                traceback.print_exc()
            
            # Wait for interval or stop event
            rc = win32event.WaitForSingleObject(
                self.hWaitStop,
                INTERVAL_SECONDS * 1000
            )
            
            if rc == win32event.WAIT_OBJECT_0:
                # Stop signal received
                break

        logging.info("Service stopped")

if __name__ == '__main__':
    if len(sys.argv) == 1:
        # Run as service
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(AgentService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        # Handle command line (install/uninstall/etc)
        win32serviceutil.HandleCommandLine(AgentService)