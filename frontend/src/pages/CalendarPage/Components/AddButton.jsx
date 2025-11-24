import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function AddEventButton({ onAddEvent }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    tripName: '',
    eventName: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '11:00',
    location: '',
    type: 'other',
  });

  const handleAddEvent = () => {
    const colorMap = {
      flight: 'bg-blue-500', // Example: Tailwind color class
      hotel: 'bg-green-500',
      activity: 'bg-orange-500',
      other: 'bg-gray-500',
    };

    const startDateTime = new Date(`${newEvent.startDate}T${newEvent.startTime}`);
    const endDateTime = new Date(`${newEvent.endDate}T${newEvent.endTime}`);

    const newGeneratedEvent = {
      id: Date.now().toString(), // Simple ID generation
      tripName: newEvent.tripName,
      eventName: newEvent.eventName,
      startDate: startDateTime,
      endDate: endDateTime,
      location: newEvent.location || undefined,
      type: newEvent.type,
      color: colorMap[newEvent.type],
    };

    onAddEvent(newGeneratedEvent);

    // Reset form and close dialog
    setNewEvent({
      tripName: '',
      eventName: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endDate: new Date().toISOString().split('T')[0],
      endTime: '11:00',
      location: '',
      type: 'other',
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-[#7BA5FF] hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Trip Event</DialogTitle>
          <DialogDescription>
            Schedule a flight, hotel booking, or activity for your trip.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tripName">Trip Name</Label>
              <Input
                id="tripName"
                placeholder="e.g., Turkey Trip"
                value={newEvent.tripName}
                onChange={(e) => setNewEvent({ ...newEvent, tripName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
                value={newEvent.type}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight ✈️</SelectItem>
                  <SelectItem value="hotel">Hotel 🏨</SelectItem>
                  <SelectItem value="activity">Activity 🗺️</SelectItem>
                  <SelectItem value="other">Other 📝</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              placeholder="e.g., Flight from Istanbul to Antalya"
              value={newEvent.eventName}
              onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={newEvent.startDate}
                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={newEvent.endDate}
                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Istanbul Airport"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddEvent}
            className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] hover:from-[#3a5ce7] hover:to-[#6b95ef]"
            disabled={!newEvent.tripName || !newEvent.eventName || !newEvent.startDate || !newEvent.endDate}
          >
            Add Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}