import React, { useState } from "react";
import { UserDevicesTable } from "../components/UserDevicesTable";

const UserDevices: React.FC = () => {
  const [totalCount, setTotalCount] = useState(0);

  return (
    <div className="p-6 min-h-screen space-y-6">
      <header>
        <h1 className="text-2xl font-bold">User Devices</h1>
        <p className="text-sm text-gray-600 mt-1">
          {totalCount.toLocaleString()} registered device{totalCount === 1 ? "" : "s"}
        </p>
      </header>

      <UserDevicesTable onTotalCountChange={setTotalCount} />
    </div>
  );
};

export default UserDevices;
