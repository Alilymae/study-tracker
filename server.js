//MONKEYS LETS START
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let memoryStore = [];

async function saveEntry(entry) {
  if (!MONGO_URL) {
    memoryStore.push(entry);
    return { storedIn: "memory" };
  }

  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db("studytracker");
  await db.collection("studyEntries").insertOne(entry);
  await client.close();
  return { storedIn: "mongo" };
}

app.post("/api/study", async (req, res) => {
  try {
    const minutes = Number(req.body.minutes);

    if (Number.isNaN(minutes) || minutes <= 0) {
      return res.status(400).json({ ok: false, message: "Minutes required" });
    }

    const entry = { minutes, createdAt: new Date() };
    const info = await saveEntry(entry);

    console.log("Received study entry:", entry, info);
    res.json({ ok: true, storedIn: info.storedIn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
})

app.get("/api/study/today", async (req, res) => {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db("studytracker");

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const result = await db.collection("studyEntries").aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: "$minutes" }
        }
      }
    ]).toArray();

    await client.close();

    const totalMinutes = result[0]?.totalMinutes || 0;
    res.json({ totalMinutes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch total" });
  }
});

app.get("/api/study/today", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db();

    const entries = await db
      .collection("studyEntries")
      .find({ createdAt: { $gte: start, $lte: end } })
      .toArray();

    await client.close();

    const totalMinutes = entries.reduce(
      (sum, e) => sum + e.minutes,
      0
    );

    res.json({ totalMinutes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching today’s total" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

