const { config } = require("dotenv");
config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require("./models/Post");
const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer({
  dest: "uploads/",
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB in bytes
  },
});
const fs = require("fs");
const { promisify } = require("util");
const renameSync = promisify(fs.rename);
const isImage = require("is-image");
const validator = require("validator");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per minute
  message: "Too many login attempts. Please try again later.",
});

const salt = bcrypt.genSaltSync(10);
const secret = process.env.SECRET;

function checkTokenExpiration(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, process.env.SECRET, (err, decodedToken) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Unauthorized - Token Expired" });
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    req.user = decodedToken;
    next();
  });
}

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" });
    } else if (err.code === "NO_FILE") {
      return res.status(400).json({ error: "No file uploaded" });
    }
  }
  next(err);
}

app.use(errorHandler);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src 'self' https://fonts.googleapis.com; img-src 'self' data: https://www.gravatar.com; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com"
  );
  next();
});

app.use("/uploads", express.static(__dirname + "/uploads"));

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    try {
      const token = await jwt.sign({ username, id: userDoc._id }, secret, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          secure: true,
          httpOnly: true,
          sameSite: "strict",
        })
        .json({
          id: userDoc._id,
          username,
        });
    } catch (err) {
      throw err;
    }
  } else {
    res.status(400).json("wrong credentials");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, secret, {}, (err, info) => {
      if (err) throw err;
      res.json(info);
    });
  } else {
    res.sendStatus(401);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.post(
  "/post",
  checkTokenExpiration,
  uploadMiddleware.single("file"),
  async (req, res) => {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path.toString() + "." + ext;
    await renameSync(path.toString(), newPath);

    if (!isImage(newPath)) {
      fs.unlinkSync(newPath);
      return res
        .status(400)
        .json({ error: "Uploaded file is not a valid image" });
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const { title, summary, content } = req.body;
      const sanitizedTitle = validator.escape(title);
      const sanitizedSummary = validator.escape(summary);
      const sanitizedContent = validator.escape(content);

      const postDoc = await Post.create({
        title: sanitizedTitle,
        summary: sanitizedSummary,
        content: content,
        cover: newPath,
        author: info.id,
      });
      res.json(postDoc);
    });
  }
);

app.put(
  "/post",
  checkTokenExpiration,
  uploadMiddleware.single("file"),
  async (req, res) => {
    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split(".");
      const ext = parts[parts.length - 1];
      const newPath = path.toString() + "." + ext;
      await renameSync(path.toString(), newPath);

      if (!isImage(newPath)) {
        fs.unlinkSync(newPath);
        return res
          .status(400)
          .json({ error: "Uploaded file is not a valid image" });
      }
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const { id, title, summary, content } = req.body;
      const postDoc = await Post.findById(id);
      const isAuthor =
        JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json("you are not the author");
      }
      const sanitizedTitle = validator.escape(title);
      const sanitizedSummary = validator.escape(summary);
      const sanitizedContent = validator.escape(content);
      await postDoc.updateOne({
        title: sanitizedTitle,
        summary: sanitizedSummary,
        content: sanitizedContent,
        cover: newPath ? newPath : postDoc.cover,
      });

      res.json(postDoc);
    });
  }
);

app.delete("/post/:postId", checkTokenExpiration, async (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { postId } = req.params;
    try {
      const postDoc = await Post.findOne({ _id: postId, author: info.id });
      if (!postDoc) {
        return res.status(404).json({ error: "Post not found" });
      }
      await postDoc.deleteOne();
      res.json({ message: "Post successfully deleted" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

app.get("/post", async (req, res) => {
  res.json(
    await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
  );
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate("author", ["username"]);
  res.json(postDoc);
});

mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("listening on port 4000");
  app.listen(4000);
});
