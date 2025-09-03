import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Calendar, MapPin, Globe, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FirstEvent {
  code: string;
  name: string;
  type: string;
  districtCode?: string;
  dateStart: string;
  dateEnd: string;
  address?: string;
  timezone?: string;
  website?: string;
  webcasts?: Array<{ type: string; channel: string; file?: string }>;
}

interface FirstEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSelect: (event: FirstEvent) => void;
  season?: number;
}

export const FirstEventModal: React.FC<FirstEventModalProps> = ({
  isOpen,
  onClose,
  onEventSelect,
  season = new Date().getFullYear()
}) => {
  const [events, setEvents] = useState<FirstEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [district, setDistrict] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { toast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('first-events', {
        body: {
          season,
          search,
          eventType: eventType || undefined,
          district: district || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }
      });

      if (error) {
        throw error;
      }

      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching FIRST events:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch FIRST events. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen, season]);

  const handleSearch = () => {
    fetchEvents();
  };

  const handleEventSelect = (event: FirstEvent) => {
    onEventSelect(event);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'regional':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'district':
        return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'district_championship':
        return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'championship':
        return 'bg-gold-500/20 text-gold-700 dark:text-gold-300';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select FIRST Event ({season})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Event name, city, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="Regional">Regional</SelectItem>
                  <SelectItem value="District">District</SelectItem>
                  <SelectItem value="DistrictChampionship">District Championship</SelectItem>
                  <SelectItem value="Championship">Championship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                placeholder="District code"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="mt-6 w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading events...</span>
              </div>
            ) : events.length > 0 ? (
              events.map((event) => (
                <Card 
                  key={event.code} 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleEventSelect(event)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.dateStart)} - {formatDate(event.dateEnd)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type}
                        </Badge>
                        {event.districtCode && (
                          <Badge variant="outline">
                            {event.districtCode}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {event.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {event.address}
                        </div>
                      )}
                      {event.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4" />
                          <a 
                            href={event.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Event Website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {event.timezone && (
                        <div className="text-sm text-muted-foreground">
                          Timezone: {event.timezone}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? 'Searching...' : 'No events found. Try adjusting your search criteria.'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};