import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { GridFSBucket } from "mongodb";
import { Readable } from "stream";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/videoDB";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const conn = mongoose.connection;


let gfs, gridFSBucket;
conn.once("open", () => {
  gridFSBucket = new GridFSBucket(conn.db, { bucketName: "videos" });
  gfs = gridFSBucket;
  console.log("MongoDB Connected, GridFS initialized");
});


const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB limit
});

app.use(cors());
app.use(express.json());


app.post("/upload", upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const readableStream = new Readable();
  readableStream.push(req.file.buffer);
  readableStream.push(null);

  const uploadStream = gridFSBucket.openUploadStream(req.file.originalname, {
    contentType: req.file.mimetype, 
  });

  readableStream.pipe(uploadStream);

  uploadStream.on("finish", () => {
    res.json({ message: "Video uploaded successfully", file: req.file.originalname });
  });

  uploadStream.on("error", (err) => {
    res.status(500).json({ error: "Upload failed", details: err.message });
  });
});


app.get("/videos", async (req, res) => {
  try {
    const files = await conn.db.collection("videos.files").find().toArray();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/videos/:filename", async (req, res) => {
  try {
    const file = await conn.db.collection("videos.files").findOne({ filename: req.params.filename });

    if (!file) return res.status(404).json({ error: "Video not found" });

    res.set("Content-Type", file.contentType);
    const downloadStream = gridFSBucket.openDownloadStreamByName(req.params.filename);

    downloadStream.on("error", () => res.status(500).json({ error: "Error streaming video" }));
    downloadStream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put("/update/:id", upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    
    const oldFile = await conn.db.collection("videos.files").findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

    if (!oldFile) return res.status(404).json({ error: "Old video not found" });

    
    await conn.db.collection("videos.chunks").deleteMany({ files_id: oldFile._id });
    await conn.db.collection("videos.files").deleteOne({ _id: oldFile._id });

    
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    const uploadStream = gridFSBucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    readableStream.pipe(uploadStream);

    uploadStream.on("finish", () => {
      res.json({ message: "Video updated successfully", file: req.file.originalname });
    });

    uploadStream.on("error", (err) => {
      res.status(500).json({ error: "Upload failed", details: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
