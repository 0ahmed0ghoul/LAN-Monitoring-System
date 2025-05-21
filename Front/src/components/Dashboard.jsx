import React from "react";
import Navbar from "./Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Add this import
import DeviceGrid from "./DeviceGrid";
import { useDeviceContext } from "../context/DeviceContext";
import { z } from "zod";

const Dashboard = () => {
    const { handleExport,isLoading } = useDeviceContext();
  
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Network Devices</h2>
                    <p className="text-gray-500 mt-1">
                    Showing all devices on your network
                    </p>
                </div>
                <div className="flex items-center mt-4 md:mt-0 gap-2 text-sm ml-2">
                    <Badge variant="outline" className="bg-netview-green text-white">
                    Online
                    </Badge>
                    <Badge variant="outline" className="bg-netview-red text-white">
                    Offline
                    </Badge>
                    <Badge variant="outline" className="bg-netview-yellow text-white">
                    Warning
                    </Badge>
                </div>
                </div>
            </div>
            
            <DeviceGrid />
            
            {/* Sticky Export Button */}
            <Button style={{ position: "fixed", bottom: "20px", right: "20px",width: "200px",zIndex: 1000 ,backgroundColor: "#F0831E",color:"black"}}
              onClick={handleExport}
              disabled={isLoading}
              className=" hover:bg-netview-green-dark text-white shadow-lg rounded-full p-4"
            >
              {isLoading ? "Exporting..." : "Export to Excel"}
            </Button>
        </div>
    );
};

export default Dashboard;