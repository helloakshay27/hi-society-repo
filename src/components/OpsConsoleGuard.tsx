import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser, isOpsConsoleAllowedUser } from "@/utils/auth";

interface OpsConsoleGuardProps {
  children: React.ReactNode;
}

// Restricts /ops-console routes to the allow-listed users in utils/auth.ts.
// Must be rendered inside <ProtectedRoute> so the user is already logged in.
export const OpsConsoleGuard: React.FC<OpsConsoleGuardProps> = ({ children }) => {
  const navigate = useNavigate();

  if (isOpsConsoleAllowedUser(getUser())) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f4ee] px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <ShieldAlert className="h-14 w-14 text-[#da7756]" />
        <h1 className="text-2xl font-semibold text-[#2c2c2c]">
          You are not allowed to enter here
        </h1>
        <p className="text-[#888780]">
          You don't have permission to access the Ops Console.
        </p>
        <Button
          className="bg-[#c72030] text-white"
          onClick={() => navigate("/", { replace: true })}
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
};
