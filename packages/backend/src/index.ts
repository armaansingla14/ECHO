import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

// REMOVE the old import:
// import { startVSCodeTracker } from "./trackers/vscodeTracker";

// ADD the new tracker import:
import { startVSCodeStorageTracker } from "./trackers/vscodeStorageTracker";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/events", async (req, res) => {
  try {
    const { timestamp, source, type, text, meta } = req.body;

    const event = await prisma.event.create({
      data: {
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        source,
        type,
        text,
        meta
      }
    });

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.get("/events", async (req, res) => {
  try {
    const { date } = req.query;

    let where: any = {};

    if (date) {
      const start = new Date(String(date));
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      where = {
        timestamp: {
          gte: start,
          lt: end
        }
      };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { timestamp: "asc" }
    });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ECHO backend listening on port ${PORT}`);

  // REMOVE this line:
  // startVSCodeTracker();

  // ADD this line:
  startVSCodeStorageTracker();
});
