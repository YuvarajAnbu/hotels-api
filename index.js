if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const axios = require("axios");
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

// Connect to DB
const client = new MongoClient(process.env.MONGODB_URI, {
  useUnifiedTopology: true,
});
const dbName = "hotels";

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

async function saveInDB(hotels) {
  try {
    const db = client.db(dbName);
    const collection = db.collection("hotels");
    await collection.deleteMany({});
    await collection.insertMany(hotels);
    console.log(`Stored ${hotels.length} hotels in MongoDB`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

async function loadFiles() {
  try {
    const response = await axios.get(
      "https://api.github.com/repos/WillGardella/hotels/contents/json"
    );
    const promises = response.data.map(async (file) => {
      const fileResponse = await axios.get(file.download_url);
      return fileResponse.data;
    });
    const hotels = await Promise.all(promises);
    console.log(`Loaded ${hotels.length} hotels from GitHub`);
    return hotels;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// APIs
app.get("/hotels", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("hotels");
    const query = req.query || {};
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const total = await collection.countDocuments({});
    const hotels = await collection.find({}, { limit, skip }).toArray();
    const length = hotels.length;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const previousPage = hasPreviousPage ? page - 1 : null;

    res.send({
      hotels,
      total,
      length,
      page,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage,
      previousPage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.post("/hotels", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("hotels");
    const hotel = await collection.insertOne(req.body);
    res.status(201).send(hotel);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.get("/hotels/:id", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("hotels");
    const id = new ObjectId(req.params.id);
    const hotel = await collection.findOne({ _id: id });
    if (hotel) {
      res.send(hotel);
    } else {
      res.status(404).send({ error: "Hotel not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.put("/hotels/:id", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("hotels");
    const id = new ObjectId(req.params.id);
    const hotel = req.body;
    const result = await collection.updateOne({ _id: id }, { $set: hotel });
    if (result.modifiedCount === 1) {
      res.send(hotel);
    } else {
      res.status(404).send({ error: "Hotel not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.delete("/hotels/:id", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("hotels");
    const id = new ObjectId(req.params.id);
    const result = await collection.deleteOne({ _id: id });
    if (result.deletedCount === 1) {
      res.send({ message: "Hotel deleted successfully" });
    } else {
      res.status(404).send({ error: "Hotel not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

// IIFE function
(async function () {
  try {
    // connect to DB
    await connectToMongoDB();
    //Load and save files for github to DB
    await saveInDB(await loadFiles());
    console.log("Data Loaded and Saved to DB");

    //Listen to port 3000
    app.listen(port, () => {
      console.log(`listening to port ${port}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
