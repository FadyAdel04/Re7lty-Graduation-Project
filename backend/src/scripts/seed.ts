import dotenv from "dotenv";
dotenv.config();
import { connectToDatabase } from "../db";
import { Trip } from "../models/Trip";
import { seedTrips } from "../data/trips";

async function main() {
  await connectToDatabase(process.env.MONGODB_URI || "");
  const count = await Trip.countDocuments();
  if (count > 0) {
    console.log(`Trips already exist (${count}), skipping seed.`);
    return;
  }
  await Trip.insertMany(seedTrips.map(t => ({ ...t, postedAt: new Date(t.postedAt) })));
  console.log(`Inserted ${seedTrips.length} trips.`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });


