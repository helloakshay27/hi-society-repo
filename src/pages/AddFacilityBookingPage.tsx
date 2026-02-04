import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TextField, MenuItem, Select as MuiSelect, FormControl, InputLabel } from '@mui/material';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';

const fieldStyles = {
  height: '45px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  '& .MuiOutlinedInput-root': {
    height: '45px',
    '& fieldset': {
      borderColor: '#ddd',
    },
    '&:hover fieldset': {
      borderColor: '#C72030',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#C72030',
    },
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: '#C72030',
    },
  },
};

const AddFacilityBookingPage = () => {
  const navigate = useNavigate();

  const [towers, setTowers] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Form Selection State
  const [selectedTowerId, setSelectedTowerId] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Facility & Booking State
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<any>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [complementaryReason, setComplementaryReason] = useState('');

  // Cost State
  const [facilityDetails, setFacilityDetails] = useState<any>(null);
  const [bookingRuleData, setBookingRuleData] = useState<any>(null);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Empty functions to fix errors as per user request
  const handleTowerChange = (e: any) => { };
  const handleFlatChange = (e: any) => { };
  const handleFacilityChange = (e: any) => { };
  const handleSlotClick = (slotId: number) => { };
  const handleSubmit = (e: any) => { e.preventDefault(); };

  // Dummy cost summary
  const costSummary = {
    sub_total: 0,
    gst_amount: 0,
    sgst_amount: 0,
    full_amount: 0,
    gst: 0,
    sgst: 0
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 hover:text-gray-800 mb-4 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#C72030]">
            <CheckCircle className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-[#C72030]">Add Faciltiy Booking</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. User Selection Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-medium text-gray-900">User Selection</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormControl fullWidth>
                <InputLabel shrink>Tower *</InputLabel>
                <MuiSelect
                  value={selectedTowerId}
                  onChange={handleTowerChange}
                  label="Tower *"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value=""><em>Select Tower</em></MenuItem>
                  {towers.map((tower: any) => (
                    <MenuItem key={tower.id} value={tower.id}>{tower.name}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel shrink>Flat *</InputLabel>
                <MuiSelect
                  value={selectedFlatId}
                  onChange={handleFlatChange}
                  label="Flat *"
                  displayEmpty
                  disabled={!selectedTowerId}
                  sx={fieldStyles}
                >
                  <MenuItem value=""><em>Select Flat</em></MenuItem>
                  {flats.map((flat: any) => (
                    <MenuItem key={flat.id} value={flat.id}>{flat.flat_no}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel shrink>User *</InputLabel>
                <MuiSelect
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  label="User *"
                  displayEmpty
                  disabled={!selectedFlatId}
                  sx={fieldStyles}
                >
                  <MenuItem value=""><em>Select User</em></MenuItem>
                  {users.map((u: any) => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </div>
          </div>
        </div>

        {/* 2. Facility Details Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-medium text-gray-900">Booking Details</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormControl fullWidth>
                <InputLabel shrink>Facility *</InputLabel>
                <MuiSelect
                  value={typeof selectedFacility === 'object' ? selectedFacility.id : selectedFacility}
                  onChange={handleFacilityChange}
                  label="Facility *"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value=""><em>Select Facility</em></MenuItem>
                  {facilities.map((fac: any) => (
                    <MenuItem key={fac.id} value={fac.id}>{fac.fac_name}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <TextField
                label="Date *"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                sx={fieldStyles}
              />
            </div>

            {/* Slots Grid */}
            {slots.length > 0 && (
              <div>
                <Label className="mb-3 block text-sm font-medium">Available Slots (Select multiple)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {slots.map((slot) => {
                    const isSelected = selectedSlots.includes(slot.id);
                    const isBooked = !!slot.booked_by; // Assuming API returns booked info
                    // Sometimes the API might not return 'booked_by' directly or it might handle availability via available: boolean
                    // For this impl, assume available unless visual check needed. The AmenityBookingAdd checked 'canSelectSlots' etc.

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isBooked}
                        onClick={() => handleSlotClick(slot.id)}
                        className={`
                                                    p-2 text-sm rounded border text-center transition-colors
                                                    ${isBooked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                            isSelected ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-300 hover:border-gray-400'}
                                                `}
                      >
                        {slot.ampm} {/* e.g. "09:00 AM" */}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Cost & Payment */}
        {selectedSlots.length > 0 && facilityDetails && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="font-medium text-gray-900">Payment Summary</h2>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#C72030]">₹{costSummary.full_amount.toFixed(2)}</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({selectedSlots.length} slots)</span>
                    <span>₹{costSummary.sub_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST ({costSummary.gst}%)</span>
                    <span>₹{costSummary.gst_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST ({costSummary.sgst}%)</span>
                    <span>₹{costSummary.sgst_amount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{costSummary.full_amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex-1 border-l pl-6">
                  <Label className="mb-3 block">Payment Method *</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex flex-wrap gap-4">
                      {facilityDetails.postpaid === 1 && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="postpaid" id="pm-post" />
                          <Label htmlFor="pm-post">Postpaid</Label>
                        </div>
                      )}
                      {facilityDetails.prepaid === 1 && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="prepaid" id="pm-pre" />
                          <Label htmlFor="pm-pre">Prepaid</Label>
                        </div>
                      )}
                      {facilityDetails.pay_on_facility === 1 && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pay_on_facility" id="pm-pof" />
                          <Label htmlFor="pm-pof">Pay on Facility</Label>
                        </div>
                      )}
                      {facilityDetails.complementary === 1 && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="complementary" id="pm-comp" />
                          <Label htmlFor="pm-comp">Complementary</Label>
                        </div>
                      )}
                    </div>
                  </RadioGroup>

                  {paymentMethod === 'complementary' && (
                    <div className="mt-4">
                      <TextField
                        label="Reason for Complementary *"
                        value={complementaryReason}
                        onChange={(e) => setComplementaryReason(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={{ backgroundColor: '#fff' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-10">
          <Button variant="outline" onClick={() => navigate(-1)} type="button">Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating Booking...' : 'Confirm Booking'}
          </Button>
        </div>

      </form>
    </div>
  );
};

export default AddFacilityBookingPage;