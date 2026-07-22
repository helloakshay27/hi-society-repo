import { useSearchParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BookingListDashboard from "./BookingListDashboard"
import BookingCalenderView from "./BookingCalenderView"

const ALLOWED_TABS = ["calender", "list"]

const CMSFacilityBookings = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // 🔑 Read tab from URL (fallback to "calender")
  const tabFromUrl = searchParams.get("view")
  const activeTab = ALLOWED_TABS.includes(tabFromUrl || "")
    ? tabFromUrl!
    : "list"

  // 🔁 Update URL on tab change
  const handleTabChange = (tab: string) => {
    setSearchParams({ view: tab })
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full bg-white border border-gray-200">
          <TabsTrigger
            value="list"
            className="w-full font-semibold data-[state=active]:bg-[var(--color-primary-light,rgba(218,119,86,0.15))] data-[state=active]:text-[var(--color-primary,#da7756)]"
          >
            List
          </TabsTrigger>
          <TabsTrigger
            value="calender"
            className="w-full font-semibold data-[state=active]:bg-[var(--color-primary-light,rgba(218,119,86,0.15))] data-[state=active]:text-[var(--color-primary,#da7756)]"
          >
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calender">
          <BookingCalenderView />
        </TabsContent>

        <TabsContent value="list">
          <BookingListDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CMSFacilityBookings
