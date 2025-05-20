import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDeviceContext } from "@/context/DeviceContext";
import Navbar from "@/components/Navbar";
import SoftwareList from "@/components/SoftwareList";
import {
  ChevronLeft,
  Server,
  Monitor,
  Laptop,
  Smartphone,
  Network,
  Info,
  HardDrive,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedDevice, softwareList, selectDevice, clearSelectedDevice } =
    useDeviceContext();

  useEffect(() => {
    if (id) {
      selectDevice(id);
    }
  
    return () => {
      clearSelectedDevice();
    };
  }, [id, selectDevice, clearSelectedDevice]);

  if (!selectedDevice) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="container mx-auto p-6 text-center">
          Loading device information...
        </div>
      </div>
    );
  }

  const getDeviceIcon = () => {
    switch (selectedDevice.category) {
      case "windows":
      case "macos":
        return <Laptop className="h-6 w-6" />;
      case "linux":
        return <Server className="h-6 w-6" />;
      case "network":
        return <Network className="h-6 w-6" />;
      default:
        return <Monitor className="h-6 w-6" />;
    }
  };

  const getStatusColor = () => {
    switch (selectedDevice.status) {
      case "online":
        return "bg-netview-green";
      case "offline":
        return "bg-netview-red";
      case "warning":
        return "bg-netview-yellow";
      default:
        return "bg-gray-500";
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "cpu":
        return <Cpu className="h-4 w-4" />;
      case "ram":
        return <Cpu className="h-4 w-4" />;
      case "disk":
        return <HardDrive className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Devices</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{selectedDevice.name}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col md:flex-row gap-6 mt-6">
          {/* Sidebar */}
          <div className="md:w-1/3 lg:w-1/4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${getStatusColor()} bg-opacity-20`}>
                      {getDeviceIcon()}
                    </div>
                    <div>
                      <h2 className="text-xl font-medium">
                        {selectedDevice.name}
                      </h2>
                      <Badge className={`mt-1 ${getStatusColor()} text-white`}>
                        {selectedDevice.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Network</h3>
                    <p className="text-gray-800 font-medium">{selectedDevice.ipAddress}</p>
                    {selectedDevice.rawData?.mac && (
                      <p className="text-sm text-gray-500">
                        {selectedDevice.rawData.mac}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Operating System</h3>
                    <p className="text-gray-800 font-medium">
                      {selectedDevice.operatingSystem}
                      {selectedDevice.rawData?.osVersion && (
                        <span className="text-gray-500 ml-2">
                          (v{selectedDevice.rawData.osVersion})
                        </span>
                      )}
                    </p>
                  </div>

                  {selectedDevice.status !== "offline" && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm text-gray-500 mb-3">System Resources</h3>
                        <div className="space-y-4">
                          {["cpu", "ram", "disk"].map((type) => {
                            const usage = selectedDevice[`${type}Usage`];
                            const total = selectedDevice.rawData[`total${type.charAt(0).toUpperCase() + type.slice(1)}Gb`];
                            const used = total ? Math.round((usage / 100) * total) : null;
                            const barColor =
                              usage > 80
                                ? "bg-netview-red"
                                : usage > 60
                                ? "bg-netview-yellow"
                                : "bg-netview-green";

                            return (
                              <div key={type}>
                                <div className="flex items-center gap-2 mb-1">
                                  {getResourceIcon(type)}
                                  <span className="text-sm font-medium text-gray-700">
                                    {type.toUpperCase()}
                                  </span>
                                  <span className="ml-auto text-sm font-medium">
                                    <span className={usage > 80 ? "text-netview-red" : ""}>
                                      {usage}%
                                    </span>
                                    {total && (
                                      <span className="text-gray-500 ml-2">
                                        ({used}GB / {total}GB)
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${barColor}`}
                                    style={{ width: `${usage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-6 gap-2"
                  onClick={() => navigate("/")}
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Device List
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Software List */}
          <div className="md:w-2/3 lg:w-3/4">
            <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-netview-blue-500" />
                  <h2 className="text-xl font-medium">Installed Software</h2>
                </div>
                <div className="text-sm text-gray-500">
                  {softwareList.length} applications
                </div>
              </div>

              <SoftwareList softwareList={softwareList} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetail;