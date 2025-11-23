export interface Event {
  id: number;
  timestamp: Date;
  source: string;
  type: string;
  text: string;
  meta: any;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchEvents(date: Date): Promise<Event[]> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/events?date=${dateStr}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    const events = await response.json();
    
    // Convert timestamp strings to Date objects
    return events.map((event: any) => ({
      ...event,
      timestamp: new Date(event.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function fetchTodayEvents(): Promise<Event[]> {
  return fetchEvents(new Date());
}
