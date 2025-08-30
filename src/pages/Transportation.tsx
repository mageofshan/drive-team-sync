import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Car, Bus, Users, Clock, MapPin, Plus, UserPlus, UserMinus, CalendarDays } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { format } from 'date-fns';

interface Carpool {
  id: string;
  driver_id: string;
  event_id: string | null;
  departure_location: string;
  departure_time: string;
  return_time: string | null;
  available_seats: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  driver_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  event?: {
    title: string;
    location: string | null;
  } | null;
  riders: Array<{
    id: string;
    rider_id: string;
    pickup_location: string | null;
    notes: string | null;
    rider_profile?: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  }>;
}

interface Event {
  id: string;
  title: string;
  location: string | null;
}

const Transportation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [carpools, setCarpools] = useState<Carpool[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('departure_time');

  // Form state
  const [formData, setFormData] = useState({
    vehicleType: 'car',
    eventId: '',
    departureLocation: '',
    departureTime: '',
    returnTime: '',
    availableSeats: 4,
    notes: ''
  });

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('carpools-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carpools' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carpool_riders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch carpools with driver profiles, events, and riders
      const { data: carpoolsData, error: carpoolsError } = await supabase
        .from('carpools')
        .select(`
          *,
          driver_profile:profiles(first_name, last_name),
          event:events(title, location),
          riders:carpool_riders(
            id, rider_id, pickup_location, notes,
            rider_profile:profiles(first_name, last_name)
          )
        `)
        .order('departure_time', { ascending: true });

      if (carpoolsError) throw carpoolsError;

      // Fetch events for the dropdown
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, location')
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      setCarpools((carpoolsData as any) || []);
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load transportation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCarpool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('carpools').insert({
        driver_id: user.id,
        event_id: formData.eventId === 'none' ? null : formData.eventId || null,
        departure_location: formData.departureLocation,
        departure_time: formData.departureTime,
        return_time: formData.returnTime || null,
        available_seats: formData.availableSeats,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transportation option created successfully",
      });

      setIsCreateOpen(false);
      setFormData({
        vehicleType: 'car',
        eventId: '',
        departureLocation: '',
        departureTime: '',
        returnTime: '',
        availableSeats: 4,
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating carpool:', error);
      toast({
        title: "Error",
        description: "Failed to create transportation option",
        variant: "destructive",
      });
    }
  };

  const joinRide = async (carpoolId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('carpool_riders').insert({
        carpool_id: carpoolId,
        rider_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully joined the ride",
      });
      fetchData();
    } catch (error) {
      console.error('Error joining ride:', error);
      toast({
        title: "Error",
        description: "Failed to join ride",
        variant: "destructive",
      });
    }
  };

  const leaveRide = async (carpoolId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('carpool_riders')
        .delete()
        .eq('carpool_id', carpoolId)
        .eq('rider_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully left the ride",
      });
      fetchData();
    } catch (error) {
      console.error('Error leaving ride:', error);
      toast({
        title: "Error",
        description: "Failed to leave ride",
        variant: "destructive",
      });
    }
  };

  const getFilteredAndSortedCarpools = () => {
    let filtered = [...carpools];

    // Filter by vehicle type
    if (filterType === 'car') {
      filtered = filtered.filter(carpool => carpool.available_seats <= 8);
    } else if (filterType === 'bus') {
      filtered = filtered.filter(carpool => carpool.available_seats > 8);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'departure_time':
          return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
        case 'seats_available':
          return (b.available_seats - b.riders.length) - (a.available_seats - a.riders.length);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getStats = () => {
    const totalRides = carpools.length;
    const totalSeatsOpen = carpools.reduce((sum, carpool) => 
      sum + (carpool.available_seats - carpool.riders.length), 0);
    const nextDeparture = carpools
      .filter(carpool => new Date(carpool.departure_time) > new Date())
      .sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime())[0];

    return { totalRides, totalSeatsOpen, nextDeparture };
  };

  const isUserInRide = (carpool: Carpool) => {
    return carpool.riders.some(rider => rider.rider_id === user?.id);
  };

  const canJoinRide = (carpool: Carpool) => {
    return carpool.available_seats > carpool.riders.length && 
           carpool.driver_id !== user?.id && 
           !isUserInRide(carpool);
  };

  const stats = getStats();
  const filteredCarpools = getFilteredAndSortedCarpools();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Loading transportation data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transportation</h1>
            <p className="text-muted-foreground">Organize carpools and transportation for events</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Transportation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Transportation</DialogTitle>
                <DialogDescription>
                  Add a new carpool or bus for your team
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCarpool} className="space-y-4">
                <div>
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Select value={formData.vehicleType} onValueChange={(value) => 
                    setFormData({...formData, vehicleType: value, availableSeats: value === 'bus' ? 20 : 4})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eventId">Event (Optional)</Label>
                  <Select value={formData.eventId} onValueChange={(value) => setFormData({...formData, eventId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific event</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="departureLocation">Departure Location</Label>
                  <Input
                    id="departureLocation"
                    value={formData.departureLocation}
                    onChange={(e) => setFormData({...formData, departureLocation: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="departureTime">Departure Time</Label>
                  <Input
                    id="departureTime"
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="returnTime">Return Time (Optional)</Label>
                  <Input
                    id="returnTime"
                    type="datetime-local"
                    value={formData.returnTime}
                    onChange={(e) => setFormData({...formData, returnTime: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="availableSeats">Available Seats</Label>
                  <Input
                    id="availableSeats"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.availableSeats}
                    onChange={(e) => setFormData({...formData, availableSeats: parseInt(e.target.value)})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Stops, special instructions, etc."
                  />
                </div>

                <Button type="submit" className="w-full">Create Transportation</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRides}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seats Available</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSeatsOpen}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Departure</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.nextDeparture 
                  ? format(new Date(stats.nextDeparture.departure_time), 'MMM d, h:mm a')
                  : 'None scheduled'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Label>Filter:</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="car">Cars</SelectItem>
                <SelectItem value="bus">Buses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label>Sort by:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="departure_time">Departure Time</SelectItem>
                <SelectItem value="seats_available">Seats Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transportation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCarpools.map((carpool) => {
            const seatsUsed = carpool.riders.length;
            const seatsRemaining = carpool.available_seats - seatsUsed;
            const progress = (seatsUsed / carpool.available_seats) * 100;
            const isDriver = carpool.driver_id === user?.id;
            const vehicleIcon = carpool.available_seats > 8 ? Bus : Car;

            return (
              <Card key={carpool.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {React.createElement(vehicleIcon, { 
                        className: `w-5 h-5 ${carpool.available_seats > 8 ? 'text-blue-600' : 'text-green-600'}` 
                      })}
                      <CardTitle className="text-lg">
                        {carpool.available_seats > 8 ? 'Bus' : 'Car'} to {carpool.event?.title || 'Destination'}
                      </CardTitle>
                    </div>
                    {isDriver && <Badge variant="secondary">Driver</Badge>}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Driver: {carpool.driver_profile?.first_name} {carpool.driver_profile?.last_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      From: {carpool.departure_location}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="w-4 h-4" />
                      {format(new Date(carpool.departure_time), 'MMM d, yyyy at h:mm a')}
                    </div>
                    {carpool.return_time && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        Return: {format(new Date(carpool.return_time), 'h:mm a')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Seats: {seatsUsed}/{carpool.available_seats}</span>
                      <span className={seatsRemaining > 0 ? 'text-green-600' : 'text-red-600'}>
                        {seatsRemaining} remaining
                      </span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>

                  {carpool.notes && (
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {carpool.notes}
                    </div>
                  )}

                  {carpool.riders.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Passengers:</div>
                      {carpool.riders.map((rider) => (
                        <div key={rider.id} className="text-sm text-muted-foreground flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          {rider.rider_profile?.first_name} {rider.rider_profile?.last_name}
                          {rider.pickup_location && ` (from ${rider.pickup_location})`}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {canJoinRide(carpool) && (
                      <Button 
                        onClick={() => joinRide(carpool.id)} 
                        size="sm" 
                        className="flex-1"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Join Ride
                      </Button>
                    )}
                    {isUserInRide(carpool) && !isDriver && (
                      <Button 
                        onClick={() => leaveRide(carpool.id)} 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Leave Ride
                      </Button>
                    )}
                    {seatsRemaining === 0 && !isUserInRide(carpool) && !isDriver && (
                      <Button disabled size="sm" className="flex-1">
                        Full
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCarpools.length === 0 && (
          <Card className="p-8 text-center">
            <CardContent>
              <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No transportation options</CardTitle>
              <CardDescription>
                Be the first to create a carpool or bus for your team
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Transportation;