import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Building2, ArrowLeft, GraduationCap, Plus, Users } from 'lucide-react';
import { Lab, User, Booking } from '@shared/types';

export default function LabBooking() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    labId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchLabs();
  }, []);

  useEffect(() => {
    if (selectedLab && selectedDate) {
      fetchBookingsForLab(selectedLab._id!, selectedDate);
    }
  }, [selectedLab, selectedDate]);

  const fetchLabs = async () => {
    try {
      const response = await fetch('/api/admin/labs');
      const result = await response.json();
      if (result.success) {
        setLabs(result.data.filter((lab: Lab) => lab.isActive));
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsForLab = async (labId: string, date: string) => {
    try {
      const response = await fetch(`/api/bookings/lab/${labId}?date=${date}`);
      const result = await response.json();
      if (result.success) {
        setExistingBookings(result.data.filter((booking: Booking) =>
          ['pending_club_approval', 'pending_lab_approval', 'approved'].includes(booking.status)
        ));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleLabSelect = (lab: Lab) => {
    setSelectedLab(lab);
    setFormData({ ...formData, labId: lab._id! });
  };

  const handleBooking = () => {
    if (!selectedLab || !selectedDate) {
      setError('Please select a lab and date first');
      return;
    }
    setFormData({
      ...formData,
      labId: selectedLab._id!,
      date: selectedDate
    });
    setShowBookingDialog(true);
  };

  const isClubMember = () => {
    if (!user) return false;
    return ['club_member', 'club_executive', 'club_secretary'].includes(user.role);
  };

  const getBookingType = () => {
    if (isClubMember()) {
      return 'Club Activities';
    }
    return 'Teaching';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const bookingData = {
        ...formData,
        userId: user?._id,
        // If user is club member, include their clubId, otherwise leave undefined for academic use
        ...(isClubMember() && user?.clubId && { clubId: user.clubId })
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Lab booking submitted successfully for ${getBookingType()}! Awaiting approval.`);
        setShowBookingDialog(false);
        resetForm();
        if (selectedLab && selectedDate) {
          fetchBookingsForLab(selectedLab._id!, selectedDate);
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      labId: selectedLab?._id || '',
      date: selectedDate,
      startTime: '',
      endTime: '',
      purpose: ''
    });
    setError('');
  };

  const isTimeSlotAvailable = (startTime: string, endTime: string) => {
    return !existingBookings.some(booking => {
      const bookingStart = booking.startTime;
      const bookingEnd = booking.endTime;
      
      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">AI Department Lab System</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Book Laboratory</h2>
          <p className="text-muted-foreground">
            Reserve laboratory time slots for {getBookingType().toLowerCase()}
          </p>
        </div>

        {success && (
          <Alert className="mb-6 border-success/50 bg-success/10">
            <AlertDescription className="text-success">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lab Selection */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-card/60 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Select Laboratory
                </CardTitle>
                <CardDescription>
                  Choose from available AI department laboratories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading labs...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {labs.map((lab) => (
                      <Card 
                        key={lab._id} 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          selectedLab?._id === lab._id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleLabSelect(lab)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold">{lab.name}</h3>
                            <Badge variant="outline">{lab.capacity} seats</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {lab.equipment?.slice(0, 2).map((item, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                              {lab.equipment && lab.equipment.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{lab.equipment.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card className="border-0 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Date & Time
                </CardTitle>
                <CardDescription>
                  Choose your preferred date and view available time slots
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {selectedLab && selectedDate && (
                    <div>
                      <Label>Available Time Slots</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {getTimeSlots().map((time) => {
                          const endTime = `${(parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;
                          const isAvailable = isTimeSlotAvailable(time, endTime);
                          
                          return (
                            <Badge
                              key={time}
                              variant={isAvailable ? "outline" : "secondary"}
                              className={`text-center py-2 ${
                                isAvailable ? 'cursor-pointer hover:bg-primary hover:text-primary-foreground' : 'opacity-50'
                              }`}
                            >
                              {time}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Click on available time slots (outlined) to book. Grayed slots are occupied.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="border-0 bg-card/60 backdrop-blur-sm sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedLab ? (
                    <div>
                      <Label className="text-sm font-medium">Selected Lab</Label>
                      <p className="text-sm text-muted-foreground">{selectedLab.name}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No lab selected</p>
                  )}

                  {selectedDate ? (
                    <div>
                      <Label className="text-sm font-medium">Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedDate).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No date selected</p>
                  )}

                  <div>
                    <Label className="text-sm font-medium">Booking Type</Label>
                    <Badge className={isClubMember() ? 'bg-accent text-accent-foreground' : 'bg-info text-info-foreground'}>
                      {getBookingType()}
                    </Badge>
                  </div>

                  {existingBookings.length > 0 && selectedDate && (
                    <div>
                      <Label className="text-sm font-medium">Existing Bookings</Label>
                      <div className="space-y-2 mt-1">
                        {existingBookings.map((booking, index) => (
                          <div key={index} className="text-xs bg-muted p-2 rounded">
                            {booking.startTime} - {booking.endTime}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        onClick={handleBooking}
                        disabled={!selectedLab || !selectedDate}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Booking
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Lab Booking</DialogTitle>
                        <DialogDescription>
                          Fill in the details for your {getBookingType().toLowerCase()} reservation
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time</Label>
                          <Select value={formData.startTime} onValueChange={(value) => setFormData({ ...formData, startTime: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select start time" />
                            </SelectTrigger>
                            <SelectContent>
                              {getTimeSlots().map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="endTime">End Time</Label>
                          <Select value={formData.endTime} onValueChange={(value) => setFormData({ ...formData, endTime: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select end time" />
                            </SelectTrigger>
                            <SelectContent>
                              {getTimeSlots().slice(1).map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="purpose">Purpose</Label>
                          <Textarea
                            id="purpose"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            placeholder={`Describe the purpose of your ${getBookingType().toLowerCase()}`}
                            required
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1">
                            Submit Booking
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowBookingDialog(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
