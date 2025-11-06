import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import tripsRouter from "./routes/trips";
import profilesRouter from "./routes/profiles";
import usersRouter from "./routes/users";
import { connectToDatabase } from "./db";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await connectToDatabase(process.env.MONGODB_URI || "");
    res.json({ status: 'ok', service: 'backend', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.json({ status: 'ok', service: 'backend', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

app.use('/api/trips', tripsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/users', usersRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

connectToDatabase(process.env.MONGODB_URI || "")
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err?.message || err);
    app.listen(port, () => {
      console.log(`Backend listening on port ${port} (DB disconnected)`);
    });
  });


