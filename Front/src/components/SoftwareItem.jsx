
import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import UsageChart from "./UsageChart";

const SoftwareItem = ({ software }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Optimization: Only render the heavy chart content when popover is open
  const renderPopoverContent = () => {
    if (!isOpen) return null;

    return (
      <div className="space-y-4">
        <div className="flex justify-between border-b pb-2">
          <h4 className="font-semibold text-gray-800">{software.name}</h4>
          <Badge variant={software.status === 'running' ? "default" : "outline"} className="ml-2">
            {software.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">Version</p>
            <p className="text-gray-800">{software.version}</p>
          </div>
          <div>
            <p className="text-gray-500">Size</p>
            <p className="text-gray-800">{software.size}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
        <p className="text-gray-500 " style={{textAlign:"center",textDecorationLine:"underline"}}>Not implemented yet </p>
        <br />
          <div>
            <p className="text-gray-500 text-sm mb-1" style={{opacity:'0.4'}}>CPU Usage</p>
            <div className="flex items-center" style={{opacity:'0.4'}}>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div
                  className={`h-2.5 rounded-full ${
                    software.cpuUsage > 20 ? "bg-netview-yellow" : "bg-netview-gray"
                  }`}
                  style={{ width: `${software.cpuUsage * 3}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-700" style={{opacity:'0.4'}}>{software.cpuUsage}%</span>
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1" style={{opacity:'0.4'}}>RAM Usage</p>
            <div className="flex items-center" style={{opacity:'0.4'}}>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div
                  className={`h-2.5 rounded-full ${
                    software.ramUsage > 800 ? "bg-netview-yellow" : "bg-netview-gray"
                  }`}
                  style={{ width: `${(software.ramUsage / 2000) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-700">{software.ramUsage} MB</span>
            </div>
          </div>
        </div>
        
        <div>
          <p className="text-gray-500 text-sm mb-2" style={{opacity:'0.4'}}>Usage History</p>
          <UsageChart data={software.usageHistory} style={{opacity:'0.4'}} />
        </div>
        
        <p className="text-xs text-gray-500" style={{opacity:'0.4'}}>{software.description}</p>
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-800">{software.name}</h3>
                <Badge variant="outline" className={`text-xs ${
                  software.status === 'running' 
                    ? 'bg-netview-green text-white' 
                    : 'bg-gray-400 text-white'
                }`}>
                  {software.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">Version: {software.version}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Install Date: {software.installDate}</p>
              <p className="text-sm text-gray-500">Size: {software.size} mb</p>
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" side="right" align="start" sideOffset={10}>
        {renderPopoverContent()}
      </PopoverContent>
    </Popover>
  );
};

export default SoftwareItem;
