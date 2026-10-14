export interface QuarantineRecord {
  id: string;
  residentName: string;
  tower: string;
  flat: string;
  contactNumber: string;
  quarantineType: string;
  status: "In Quarantine" | "Completed" | "Under Observation" | "Cleared";
  startDate: string;
  endDate: string;
  healthStatus: "Stable" | "Improving" | "Critical" | "Recovered";
  lastCheckup: string;
  temperature: string;
  symptoms: string;
  testResult: "Positive" | "Negative" | "Pending" | "Not Tested";
  emergencyContact: string;
  createdOn: string;
  createdBy: string;
}

// TODO: Replace with actual API call
export const QUARANTINE_MOCK_RECORDS: QuarantineRecord[] = [
  { id: "1", residentName: "Ubaid Hashmat", tower: "A", flat: "101", contactNumber: "+91 98765 43210", quarantineType: "COVID-19", status: "Completed", startDate: "01/01/2025", endDate: "15/01/2025", healthStatus: "Recovered", lastCheckup: "14/01/2025 10:00AM", temperature: "98.6°F", symptoms: "None", testResult: "Negative", emergencyContact: "+91 98765 43211", createdOn: "01/01/2025 09:30AM", createdBy: "Admin" },
  { id: "2", residentName: "Godrej Living", tower: "FM", flat: "Office", contactNumber: "+91 98765 43212", quarantineType: "COVID-19", status: "In Quarantine", startDate: "10/01/2025", endDate: "24/01/2025", healthStatus: "Stable", lastCheckup: "23/01/2025 11:30AM", temperature: "99.2°F", symptoms: "Mild cough", testResult: "Positive", emergencyContact: "+91 98765 43213", createdOn: "10/01/2025 08:15AM", createdBy: "Admin" },
  { id: "3", residentName: "Deepak Gupta", tower: "A", flat: "104", contactNumber: "+91 98765 43214", quarantineType: "Flu", status: "Under Observation", startDate: "15/01/2025", endDate: "22/01/2025", healthStatus: "Improving", lastCheckup: "22/01/2025 02:45PM", temperature: "98.4°F", symptoms: "Fever subsided", testResult: "Not Tested", emergencyContact: "+91 98765 43215", createdOn: "15/01/2025 10:20AM", createdBy: "Admin" },
  { id: "4", residentName: "Prashant Sangle", tower: "A", flat: "101", contactNumber: "+91 98765 43216", quarantineType: "COVID-19", status: "Cleared", startDate: "05/01/2025", endDate: "19/01/2025", healthStatus: "Recovered", lastCheckup: "19/01/2025 09:15AM", temperature: "98.6°F", symptoms: "None", testResult: "Negative", emergencyContact: "+91 98765 43217", createdOn: "05/01/2025 11:00AM", createdBy: "Admin" },
  { id: "5", residentName: "Ashik Bhattacharya", tower: "GL", flat: "Team", contactNumber: "+91 98765 43218", quarantineType: "COVID-19", status: "In Quarantine", startDate: "18/01/2025", endDate: "01/02/2025", healthStatus: "Stable", lastCheckup: "24/01/2025 03:30PM", temperature: "99.0°F", symptoms: "Sore throat", testResult: "Positive", emergencyContact: "+91 98765 43219", createdOn: "18/01/2025 01:45PM", createdBy: "Admin" },
  { id: "6", residentName: "Samay Seth", tower: "A", flat: "102", contactNumber: "+91 98765 43220", quarantineType: "Flu", status: "Completed", startDate: "08/01/2025", endDate: "15/01/2025", healthStatus: "Recovered", lastCheckup: "15/01/2025 04:00PM", temperature: "98.6°F", symptoms: "None", testResult: "Not Tested", emergencyContact: "+91 98765 43221", createdOn: "08/01/2025 09:45AM", createdBy: "Admin" },
  { id: "7", residentName: "Godrej Living Staff", tower: "FM", flat: "Office", contactNumber: "+91 98765 43222", quarantineType: "COVID-19", status: "Under Observation", startDate: "20/01/2025", endDate: "27/01/2025", healthStatus: "Improving", lastCheckup: "24/01/2025 10:30AM", temperature: "98.8°F", symptoms: "Mild fatigue", testResult: "Pending", emergencyContact: "+91 98765 43223", createdOn: "20/01/2025 12:00PM", createdBy: "Admin" },
  { id: "8", residentName: "Resident A-201", tower: "A", flat: "201", contactNumber: "+91 98765 43224", quarantineType: "COVID-19", status: "In Quarantine", startDate: "22/01/2025", endDate: "05/02/2025", healthStatus: "Stable", lastCheckup: "24/01/2025 11:45AM", temperature: "99.3°F", symptoms: "Headache, body ache", testResult: "Positive", emergencyContact: "+91 98765 43225", createdOn: "22/01/2025 02:30PM", createdBy: "Admin" },
  { id: "9", residentName: "Senior Citizen A-301", tower: "A", flat: "301", contactNumber: "+91 98765 43226", quarantineType: "COVID-19", status: "Cleared", startDate: "03/01/2025", endDate: "17/01/2025", healthStatus: "Recovered", lastCheckup: "17/01/2025 01:15PM", temperature: "98.6°F", symptoms: "None", testResult: "Negative", emergencyContact: "+91 98765 43227", createdOn: "03/01/2025 08:30AM", createdBy: "Admin" },
  { id: "10", residentName: "Team Member GL", tower: "GL", flat: "Team", contactNumber: "+91 98765 43228", quarantineType: "Flu", status: "Under Observation", startDate: "21/01/2025", endDate: "28/01/2025", healthStatus: "Improving", lastCheckup: "24/01/2025 04:30PM", temperature: "98.5°F", symptoms: "Cough reducing", testResult: "Not Tested", emergencyContact: "+91 98765 43229", createdOn: "21/01/2025 10:15AM", createdBy: "Admin" },
];
