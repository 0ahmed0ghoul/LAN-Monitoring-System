import React from "react";
import DeviceCard from "./DeviceCard";
import { useDeviceContext } from "@/context/DeviceContext";

const DeviceGrid = () => {
  const { filteredDevices } = useDeviceContext();
  return (
    <div className="container mx-auto px-4 py-6">
      {filteredDevices.length ? (
        <div className="grid justify-items-center gap-6" style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
        }}>
          {filteredDevices.map((device, index) => (
            <div key={`${device.id}-${index}`} className="w-full max-w-[300px]">
              <DeviceCard device={device} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-500">
            No devices found
          </h3>
          <p className="mt-2 text-gray-400">
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default DeviceGrid;