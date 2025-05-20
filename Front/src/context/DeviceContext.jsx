import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { utils, writeFile } from "xlsx";
const API_BASE_URL = "http://localhost:3001/api";

const DeviceContext = createContext();

export const DeviceProvider = ({ children }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [softwareList, setSoftwareList] = useState([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const deviceCategories = [
    { value: "all", label: "All Devices" },
    { value: "windows", label: "Windows" },
    { value: "linux", label: "Linux" },
    { value: "macos", label: "macOS" },
    { value: "network", label: "Network Devices" }
  ];

  const fetchDevices = useCallback(async (forExport = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/devices`);
      const data = await response.json();
  
      if (data.status !== 'success' || !Array.isArray(data.devices)) {
        throw new Error("Invalid data format from server");
      }
  
      if (forExport) {
        // Excel export logic
        const excelData = data.devices.map(device => ({
          "IP Address": device.ip,
          "MAC Address": device.mac,
          "Hostname": device.hostname,
          "OS": `${device.os} ${device.osVersion || ''}`.trim(),
          "CPU Usage (%)": device.cpuUsage || 0,
          "RAM Usage (%)": device.ramUsage || 0,
          "Disk Usage (%)": device.diskUsage || 0,
          "Total RAM (GB)": device.totalRamGb || 0,
          "Total Disk (GB)": device.totalDiskGb || 0,
          "Installed Software": device.software?.map(s => 
            `${s.name} (v${s.version})`
          ).join(", ") || "None"
        }));
      
        const worksheet = utils.json_to_sheet(excelData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Devices");
        writeFile(workbook, "network_devices.xlsx");
        return;
      }
  
      // Normal device transformation for UI
      const transformedDevices = data.devices.map((device) => ({
        id: device.ip,
        name: device.hostname || device.ip,
        ipAddress: device.ip,
        ip: device.ip,
        category: getDeviceCategory(device.os),
        status: getDeviceStatus(device),
        lastSeen: device.lastUpdated || new Date().toISOString(),
        manufacturer: getManufacturerFromHostname(device.hostname),
        model: "",
        operatingSystem: device.os || "Unknown OS",
        cpuUsage: device.cpuUsage || 0,
        ramUsage: device.ramUsage || 0,
        diskUsage: device.diskUsage || 0,
        uptime: "N/A",
        rawData: device,
        isMyPc: device.isMyPc || false
      }));
  
      setDevices(transformedDevices);
  
    } catch (error) {
      console.error("Device operation failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process device data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  

  // Export handler
  const handleExport = () => {
    fetchDevices(true); // Pass true to trigger export flow
  };

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Helper functions
  const getDeviceCategory = (os) => {
    if (!os) return "unknown";
    const osLower = os.toLowerCase();
    if (osLower.includes("windows")) return "windows";
    if (osLower.includes("linux")) return "linux";
    if (osLower.includes("mac")) return "macos";
    if (osLower.includes("ios")) return "ios";
    return "network";
  };

  const getDeviceStatus = (system) => {
    if (!system) return "offline";
    return system.cpu > 90 ? "warning" : "online";
  };

  const getManufacturerFromHostname = (hostname) => {
    if (!hostname) return "Unknown";
    const hostLower = hostname.toLowerCase();
    if (hostLower.includes("dell")) return "Dell";
    if (hostLower.includes("hp")) return "HP";
    if (hostLower.includes("lenovo")) return "Lenovo";
    if (hostLower.includes("apple")) return "Apple";
    return "Unknown Manufacturer";
  };

  // Memoized filtered devices
  const filteredDevices = useMemo(() => {
    let filtered = devices;
    
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(q) ||
        device.ipAddress.toLowerCase().includes(q) ||
        device.category.toLowerCase().includes(q)
      );
    }
    
    if (filterCategory && filterCategory !== "all") {
      filtered = filtered.filter(device => device.category === filterCategory);
    }
    
    return filtered;
  }, [devices, filterQuery, filterCategory]);

  // Fixed selectDevice function
  const selectDevice = useCallback(async (ip) => {
    try {
      const response = await fetch(`${API_BASE_URL}/device/${ip}`);
      const data = await response.json();

      if (data.status === 'success') {
        const baseDevice = devices.find(d => d.ip === ip) || {
          id: ip,
          ip,
          name: ip,
          category: "unknown",
          status: "offline"
        };

        const software = data.device.software || [];
        console.log("Software data:", software);
        const transformedSoftware = software.map((sw, index) => ({
          id: `${sw.name}-${sw.version}-${index}`,
          name: sw.name,
          version: sw.version,
          status: "running",
          size: sw.size || "N/A",
          installDate: sw.installDate || "N/A",
        }));
        
        setSelectedDevice({
          ...baseDevice,
          detailedInfo: data.device
        });
        setSoftwareList(transformedSoftware);

        toast({
          title: "Device Selected",
          description: `Viewing details for ${ip}`,
        });
      }
    } catch (error) {
      console.error("Failed to fetch device details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch device details",
        variant: "destructive",
      });
    }
  }, [devices, toast]);

  const clearSelectedDevice = useCallback(() => {
    setSelectedDevice(null);
    setSoftwareList([]);
  }, []);

  const filterDevices = useCallback((query) => {
    setFilterQuery(query);
  }, []);

  const refreshDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchDevices();
      toast({
        title: "Devices Refreshed",
        description: "Device list has been updated",
      });
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDevices, toast]);

  // Memoized context value
  const contextValue = useMemo(() => ({
    devices,
    handleExport,
    selectedDevice,
    softwareList,
    selectDevice,
    clearSelectedDevice,
    filteredDevices,
    filterDevices,
    filterCategory,
    setFilterCategory,
    deviceCategories,
    isLoading,
    refreshDevices,
  }), [
    devices,
    handleExport,
    selectedDevice,
    softwareList,
    selectDevice,
    clearSelectedDevice,
    filteredDevices,
    filterDevices,
    filterCategory,
    isLoading,
    refreshDevices,
  ]);

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDeviceContext = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDeviceContext must be used within a DeviceProvider");
  }
  return context;
};