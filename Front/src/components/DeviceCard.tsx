import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Laptop, Monitor, Server, Smartphone, Network } from "lucide-react";
import { useDeviceContext } from "@/context/DeviceContext";

const DeviceCard = ({ device }) => {
  const navigate = useNavigate();
  const { selectDevice } = useDeviceContext();
  
  const handleClick = () => {
    selectDevice(device.id);
    navigate(`/device/${device.id}`);
  };

  const getDeviceIcon = () => {
    switch (device.category) {
      case "PC": return <Monitor className="h-8 w-8" />;
      case "Laptop": return <Laptop className="h-8 w-8" />;
      case "Server": return <Server className="h-8 w-8" />;
      case "Mobile": return <Smartphone className="h-8 w-8" />;
      case "Network": return <Network className="h-8 w-8" />;
      default: return <Monitor className="h-8 w-8" />;
    }
  };

  const getStatusColor = () => {
    switch (device.status) {
      case "online": return "bg-green-500 text-white";
      case "offline": return "bg-red-500 text-white";
      case "warning": return "bg-yellow-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <Card 
      className={`w-full max-w-[300px] transition-all cursor-pointer hover:shadow-md ${
        device.status === "offline" ? "opacity-70" : ""
      }`}
      onClick={handleClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="rounded-full bg-blue-200 p-3">
            {getDeviceIcon()}
          </div>
          <Badge className={getStatusColor()}>
            {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
          </Badge>
        </div>
        
        <div className="mt-4 space-y-1">
          <h3 className="font-medium text-gray-800 text-lg truncate" title={device.name}>
            {device.name}
          </h3>
          <p className="text-sm text-gray-600 truncate">{device.ip || device.ipAddress}</p>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {device.category}
          </div>
          {/* <div className="text-xs text-gray-500 truncate">
            {device.manufacturer} {device.model}
          </div> */}
        </div>
      </CardContent>
      
      {device.status !== "offline" && (
        <CardFooter className="pt-0 pb-4 px-6">
          <div className="w-full">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-500">CPU</p>
                <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      device.cpuUsage > 80 ? "bg-red-500" : 
                      device.cpuUsage > 60 ? "bg-yellow-500" : 
                      "bg-green-500"
                    }`} 
                    style={{ width: `${Math.min(device.cpuUsage, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-gray-500">RAM</p>
                <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      device.ramUsage > 80 ? "bg-red-500" : 
                      device.ramUsage > 60 ? "bg-yellow-500" : 
                      "bg-green-500"
                    }`} 
                    style={{ width: `${Math.min(device.ramUsage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default DeviceCard;