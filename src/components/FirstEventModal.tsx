import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, MapPin, Globe, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface FtcEvent {
  eventId: string;
  code: string;
  divisionCode?: string;
  name: string;
  remote?: boolean;
  hybrid?: boolean;
  fieldCount?: number;
  published?: boolean;
  type: string;
  typeName?: string;
  regionCode?: string;
  leagueCode?: string;
  districtCode?: string;
  venue?: string;
  address?: string;
  city?: string;
  stateprov?: string;
  country?: string;
  website?: string;
  liveStreamUrl?: string;
  dateStart?: string;
  dateEnd?: string;
  timezone?: string;
}

interface FirstEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSelect: (event: FirstEvent | FtcEvent) => void;
  season?: number;
  organization?: 'FRC' | 'FTC';
}

export function FirstEventModal({ isOpen, onClose, onEventSelect, season, organization = 'FRC' }: FirstEventModalProps) {
  const [activeTab, setActiveTab] = useState(organization.toLowerCase());
  const [frcEvents, setFrcEvents] = useState<FirstEvent[]>([]);
  const [ftcEvents, setFtcEvents] = useState<FtcEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [district, setDistrict] = useState("");
  const [region, setRegion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  const fetchFrcEvents = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('first-events', {
        body: {
          season: season || new Date().getFullYear(),
          search,
          eventType,
          district,
          startDate,
          endDate
        }
      });

      if (error) {
        console.error('Error fetching FRC events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch FRC events. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setFrcEvents(data?.events || []);
    } catch (error) {
      console.error('Error fetching FRC events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch FRC events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFtcEvents = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ftc-events', {
        body: {
          season: season || new Date().getFullYear(),
          search,
          eventType,
          region,
          startDate,
          endDate
        }
      });

      if (error) {
        console.error('Error fetching FTC events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch FTC events. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setFtcEvents(data?.events || []);
    } catch (error) {
      console.error('Error fetching FTC events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch FTC events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === "frc") {
        fetchFrcEvents();
      } else {
        fetchFtcEvents();
      }
    }
  }, [isOpen, season, activeTab]);

  const handleSearch = () => {
    if (activeTab === "frc") {
      fetchFrcEvents();
    } else {
      fetchFtcEvents();
    }
  };

  const handleEventSelect = (event: FirstEvent | FtcEvent) => {
    onEventSelect(event);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'regional':
        return 'bg-blue-100 text-blue-800';
      case 'district':
        return 'bg-green-100 text-green-800';
      case 'championship':
        return 'bg-purple-100 text-purple-800';
      case 'offseason':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFtcEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'league':
        return 'bg-green-100 text-green-800';
      case 'qualifier':
        return 'bg-blue-100 text-blue-800';
      case 'championship':
        return 'bg-purple-100 text-purple-800';
      case 'scrimmage':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select FIRST Event
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {organization === 'FRC' ? (
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="frc">FRC Events</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="ftc">FTC Events</TabsTrigger>
            </TabsList>
          )}

          <div className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                Search
              </Button>
            </div>

            {organization === 'FRC' && (
              <TabsContent value="frc" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="Regional">Regional</SelectItem>
                    <SelectItem value="District">District</SelectItem>
                    <SelectItem value="Championship">Championship</SelectItem>
                    <SelectItem value="Offseason">Offseason</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="District" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Districts</SelectItem>
                    <SelectItem value="pch">Pacific Northwest</SelectItem>
                    <SelectItem value="fin">FIRST in Michigan</SelectItem>
                    <SelectItem value="fit">FIRST in Texas</SelectItem>
                    <SelectItem value="nc">North Carolina</SelectItem>
                    <SelectItem value="ne">New England</SelectItem>
                    <SelectItem value="ont">Ontario</SelectItem>
                    <SelectItem value="chs">Chesapeake</SelectItem>
                    <SelectItem value="fma">Mid-Atlantic</SelectItem>
                    <SelectItem value="isr">Israel</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                <Input
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-8">Loading FRC events...</div>
                ) : frcEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No FRC events found
                  </div>
                ) : (
                  frcEvents.map((event) => (
                    <Card
                      key={event.code}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleEventSelect(event)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base font-medium">
                            {event.name}
                          </CardTitle>
                          <Badge className={getEventTypeColor(event.type)}>
                            {event.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(event.dateStart)} - {formatDate(event.dateEnd)}
                          </div>
                          {event.districtCode && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {event.districtCode.toUpperCase()}
                              </Badge>
                            </div>
                          )}
                          {event.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.address}
                            </div>
                          )}
                          {event.website && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span className="flex items-center gap-1">
                                Website
                                <ExternalLink className="h-3 w-3" />
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              </TabsContent>
            )}

            {organization === 'FTC' && (
              <TabsContent value="ftc" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="League">League</SelectItem>
                    <SelectItem value="Qualifier">Qualifier</SelectItem>
                    <SelectItem value="Championship">Championship</SelectItem>
                    <SelectItem value="Scrimmage">Scrimmage</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Regions</SelectItem>
                    <SelectItem value="USCA">California</SelectItem>
                    <SelectItem value="USTX">Texas</SelectItem>
                    <SelectItem value="USFL">Florida</SelectItem>
                    <SelectItem value="USNY">New York</SelectItem>
                    <SelectItem value="USMI">Michigan</SelectItem>
                    <SelectItem value="USOH">Ohio</SelectItem>
                    <SelectItem value="USPA">Pennsylvania</SelectItem>
                    <SelectItem value="USNC">North Carolina</SelectItem>
                    <SelectItem value="USVA">Virginia</SelectItem>
                    <SelectItem value="USWA">Washington</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                <Input
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-8">Loading FTC events...</div>
                ) : ftcEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No FTC events found
                  </div>
                ) : (
                  ftcEvents.map((event) => (
                    <Card
                      key={event.eventId || event.code}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleEventSelect(event)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base font-medium">
                            {event.name}
                          </CardTitle>
                          <Badge className={getFtcEventTypeColor(event.type)}>
                            {event.typeName || event.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {event.dateStart && event.dateEnd && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(event.dateStart)} - {formatDate(event.dateEnd)}
                            </div>
                          )}
                          {event.regionCode && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {event.regionCode}
                              </Badge>
                            </div>
                          )}
                          {event.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.address}
                            </div>
                          )}
                          {(event.city || event.stateprov) && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[event.city, event.stateprov].filter(Boolean).join(', ')}
                            </div>
                          )}
                          {event.venue && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.venue}
                            </div>
                          )}
                          {event.website && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span className="flex items-center gap-1">
                                Website
                                <ExternalLink className="h-3 w-3" />
                              </span>
                            </div>
                          )}
                          {event.hybrid && (
                            <Badge variant="outline" className="text-xs">
                              Hybrid Event
                            </Badge>
                          )}
                          {event.remote && (
                            <Badge variant="outline" className="text-xs">
                              Remote Event
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}