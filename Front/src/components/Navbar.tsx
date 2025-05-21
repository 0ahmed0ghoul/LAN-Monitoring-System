import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDeviceContext } from "@/context/DeviceContext";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw } from "lucide-react";

const Navbar: React.FC = () => {
  const { 
    filterDevices, 
    filterCategory, 
    setFilterCategory, 
    refreshDevices, 
    isLoading 
  } = useDeviceContext();

  const navigate = useNavigate();
  const location = useLocation();
  const isDeviceDetailPage = location.pathname.includes('/device/');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    filterDevices(e.target.value);
  };

  const handleRefresh = () => {
    refreshDevices();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <h1 
              onClick={() => navigate("/")} 
              className="text-2xl font-bold text-netview-blue-700 flex items-center cursor-pointer"
            >
            <img src="/images/sonatrach.jpg" alt="sonatrach"  style={{width:"48px",height:"48px",borderRadius:"50%", marginRight:"10px"}}/>
            <span className="mr-1" style={{color:"#F0831E"}}>GA</span>View
            </h1>
            <span className="text-xs bg-netview-blue-200 px-2 py-0.5 rounded-full ml-2 text-netview-blue-700">
              v1.0
            </span>
          </div>
          
          {!isDeviceDetailPage && (
            <div className="flex flex-col md:flex-row gap-3 flex-grow md:max-w-2xl w-full justify-end">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Search devices..." 
                  className="pl-9"
                  onChange={handleSearch} 
                />
              </div>
              
              <div className="flex gap-2">
                <Select
                  value={filterCategory || "all"}
                  onValueChange={(value) => setFilterCategory(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All Devices</SelectItem>
                      <SelectItem value="windows">Windows</SelectItem>
                      <SelectItem value="linux">Linux</SelectItem>
                      <SelectItem value="macos">macOS</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleRefresh}
                  title="Refresh device list"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
