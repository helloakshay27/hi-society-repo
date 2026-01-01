import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  LayoutDashboard,
  UserCircle,
  FileSpreadsheet,
  Layers,
  DollarSign,
  Receipt,
  Building,
  CreditCard,
  FileText,
  Settings,
  Wrench,
  BarChart3,
  FileBarChart,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const AccountingSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();
  const [accountantOpen, setAccountantOpen] = React.useState(true);
  const [configurationOpen, setConfigurationOpen] = React.useState(true);
  const [reportsOpen, setReportsOpen] = React.useState(true);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto transition-all duration-300`}
      style={{ top: "4rem", height: "calc(100% - 4rem)" }}
    >
      <div className={`${isSidebarCollapsed ? "px-2 py-2" : "p-2"}`}>
        {/* Collapse Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute right-2 top-2 p-1 rounded-md hover:bg-[#DBC2A9] z-10"
        >
          {isSidebarCollapsed ? (
            <div className="flex justify-center items-center w-8 h-8 bg-[#f6f4ee] border border-[#e5e1d8] mx-auto">
              <ChevronRight className="w-4 h-4" />
            </div>
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Spacer */}
        <div className="w-full h-4 bg-[#f6f4ee] border-[#e5e1d8] mb-2 mt-4" />

        {/* Menu */}
        <nav className="space-y-2">
          {/* Dashboard */}
          <button
            onClick={() => handleNavigation("/accounting/dashboard")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Dashboard"
          >
            {isActive("/accounting/dashboard") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <LayoutDashboard className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Dashboard</span>}
          </button>

          {/* Accountant parent with sub-items */}
          <div>
            <button
              onClick={() => setAccountantOpen((v) => !v)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
              title="Accountant"
            >
              <UserCircle className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
              {!isSidebarCollapsed && <span className="truncate">Accountant</span>}
              {!isSidebarCollapsed && (
                <span className="ml-auto">
                  {accountantOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              )}
            </button>
            {/* Sub-menu for Accountant */}
            {accountantOpen && !isSidebarCollapsed && (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation("/accounting/chart-of-accounts")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Chart of Accounts"
                >
                  {isActive("/accounting/chart-of-accounts") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <FileSpreadsheet className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Chart of Accounts</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/subgroup-setup")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="SubGroup Setup"
                >
                  {isActive("/accounting/subgroup-setup") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Layers className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">SubGroup Setup</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/opening-balances")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Opening Balances"
                >
                  {isActive("/accounting/opening-balances") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <DollarSign className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Opening Balances</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/tax-setup")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Tax Setup"
                >
                  {isActive("/accounting/tax-setup") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Receipt className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Tax Setup</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/cost-center")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Cost Center"
                >
                  {isActive("/accounting/cost-center") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Building className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Cost Center</span>
                </button>
              </div>
            )}
          </div>

          {/* Transactions */}
          <button
            onClick={() => handleNavigation("/accounting/transactions")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Transactions"
          >
            {isActive("/accounting/transactions") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <CreditCard className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Transactions</span>}
          </button>

          {/* Invoices */}
          <button
            onClick={() => handleNavigation("/accounting/invoices")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Invoices"
          >
            {isActive("/accounting/invoices") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <FileText className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Invoices</span>}
          </button>

          {/* Receipts */}
          <button
            onClick={() => handleNavigation("/accounting/receipts")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Receipts"
          >
            {isActive("/accounting/receipts") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <Receipt className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Receipts</span>}
          </button>

          {/* Configuration parent with sub-items */}
          <div>
            <button
              onClick={() => setConfigurationOpen((v) => !v)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
              title="Configuration"
            >
              <Settings className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
              {!isSidebarCollapsed && <span className="truncate">Configuration</span>}
              {!isSidebarCollapsed && (
                <span className="ml-auto">
                  {configurationOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              )}
            </button>
            {/* Sub-menu for Configuration */}
            {configurationOpen && !isSidebarCollapsed && (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation("/accounting/charges")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Charges"
                >
                  {isActive("/accounting/charges") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <DollarSign className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Charges</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/bill-cycles")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Bill Cycles"
                >
                  {isActive("/accounting/bill-cycles") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <FileText className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Bill Cycles</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/units-bill-cycle-mapping")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Units & Bill Cycle Mapping"
                >
                  {isActive("/accounting/units-bill-cycle-mapping") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Layers className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Units & Bill Cycle Mapping</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/charge-calculations")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Charge Calculations"
                >
                  {isActive("/accounting/charge-calculations") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <FileSpreadsheet className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Charge Calculations</span>
                </button>
              </div>
            )}
          </div>

          {/* Custom Settings */}
          <button
            onClick={() => handleNavigation("/accounting/custom-settings")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Custom Settings"
          >
            {isActive("/accounting/custom-settings") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <Wrench className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Custom Settings</span>}
          </button>

          {/* Reports parent with sub-items */}
          <div>
            <button
              onClick={() => setReportsOpen((v) => !v)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
              title="Reports"
            >
              <BarChart3 className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
              {!isSidebarCollapsed && <span className="truncate">Reports</span>}
              {!isSidebarCollapsed && (
                <span className="ml-auto">
                  {reportsOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              )}
            </button>
            {/* Sub-menu for Reports */}
            {reportsOpen && !isSidebarCollapsed && (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation("/accounting/balance-sheet")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Balance Sheet"
                >
                  {isActive("/accounting/balance-sheet") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <FileSpreadsheet className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Balance Sheet</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/profit-loss")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Profit & Loss"
                >
                  {isActive("/accounting/profit-loss") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <FileBarChart className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Profit & Loss</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/gst-payable")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="GST Payable"
                >
                  {isActive("/accounting/gst-payable") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Receipt className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">GST Payable</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/gst-receivable")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="GST Receivable"
                >
                  {isActive("/accounting/gst-receivable") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Receipt className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">GST Receivable</span>
                </button>
                <button
                  onClick={() => handleNavigation("/accounting/tax-summary")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Tax Summary"
                >
                  {isActive("/accounting/tax-summary") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <FileText className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Tax Summary</span>
                </button>
              </div>
            )}
          </div>

          {/* Invoice Report */}
          <button
            onClick={() => handleNavigation("/accounting/invoice-report")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Invoice Report"
          >
            {isActive("/accounting/invoice-report") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <FileBarChart className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Invoice Report</span>}
          </button>

          {/* Download Report */}
          <button
            onClick={() => handleNavigation("/accounting/download-report")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Download Report"
          >
            {isActive("/accounting/download-report") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <Download className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Download Report</span>}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default AccountingSidebar;
