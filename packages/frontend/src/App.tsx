import React, { useEffect, useState } from "react";

type Event = {
  id: number;
  timestamp: string;
  source: string;
  type: string;
  text?: string | null;
};

const API_URL = "http://localhost:4000";

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [date, setDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch(`${API_URL}/events?date=${date}`);
      const data = await res.json();
      setEvents(data);
    };
    fetchEvents();
  }, [date]);

  return (
    <div style={{ fontFamily: "system-ui", padding: "1.5rem" }}>
      <h1>Project ECHO</h1>
      <p>Daily timeline viewer skeleton</p>

      <label>
        Date:{" "}
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </label>

      <ul style={{ marginTop: "1rem", listStyle: "none", padding: 0 }}>
        {events.map(evt => (
          <li
            key={evt.id}
            style={{
              marginBottom: "0.75rem",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: 8
            }}
          >
            <div>
              <strong>{new Date(evt.timestamp).toLocaleTimeString()}</strong>{" "}
              · {evt.source} · {evt.type}
            </div>
            {evt.text && <div>{evt.text}</div>}
          </li>
        ))}
        {events.length === 0 && <p>No events for this day yet.</p>}
      </ul>
    </div>
  );
}

export default App;
