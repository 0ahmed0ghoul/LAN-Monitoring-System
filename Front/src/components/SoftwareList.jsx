
import React from "react";
import SoftwareItem from "./SoftwareItem";

const SoftwareList = ({ softwareList }) => {
  console.log(softwareList);
  const runningSoftware = softwareList.filter((sw) => sw.status === "running");
  const stoppedSoftware = softwareList.filter((sw) => sw.status === "stopped");

  if (softwareList.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No software information available for this device.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-800 mb-3">Running Software ({runningSoftware.length})</h2>
        <div className="space-y-2">
          {runningSoftware.map((software) => (
            <SoftwareItem key={software.id} software={software} />
          ))}
        </div>
      </div>
      
      {stoppedSoftware.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-3">Installed Software ({stoppedSoftware.length})</h2>
          <div className="space-y-2">
            {stoppedSoftware.map((software) => (
              <SoftwareItem key={software.id} software={software} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftwareList;
