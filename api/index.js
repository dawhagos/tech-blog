const { config } = require("dotenv");
config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error(error);
  });

const axios = require("axios");
const User = require("./models/User");
const Post = require("./models/Post");
const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer();
const validator = require("validator");
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again later.",
});

const salt = bcrypt.genSaltSync(10);
const secret = process.env.SECRET;

function checkTokenExpiration(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, secret, (err, decodedToken) => {
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

app.use(
  cors({
    origin: true,
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

async function getRandomImage() {
  try {
    const response = await axios.get("https://api.unsplash.com/photos/random", {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}, Secret ${process.env.UNSPLASH_SECRET_KEY}`,
      },
      params: {
        query: "technology",
      },
    });
    return {
      imageSrc: response.data.urls.regular,
      downloadUrl: response.data.links.download,
      photographerName: response.data.user.name,
      photographerUsername: response.data.user.username,
    };
  } catch (error) {
    return null;
  }
}

app.post("/api/register", async (req, res) => {
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

app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    try {
      const token = await jwt.sign({ username, id: userDoc._id }, secret, {
        expiresIn: "4h",
      });

      res
        .cookie("token", token, {
          secure: true,
          httpOnly: true,
          sameSite: "strict",
          maxAge: 4 * 60 * 60 * 1000,
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

app.get("/api/profile", (req, res) => {
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

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.post(
  "/api/post",
  checkTokenExpiration,
  uploadMiddleware.none(),
  async (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const { title, summary, content } = req.body;
      const sanitizedTitle = validator.escape(title);
      const sanitizedSummary = validator.escape(summary);
      const sanitizedContent = DOMPurify.sanitize(content);

      const randomImageData = await getRandomImage();
      const postDoc = await Post.create({
        title: sanitizedTitle,
        summary: sanitizedSummary,
        content: sanitizedContent,
        imageSrc: randomImageData.imageSrc,
        photographerName: randomImageData.photographerName,
        photographerUsername: randomImageData.photographerUsername,
        author: info.id,
      });
      res.json(postDoc);
    });
  }
);

app.put(
  "/api/post",
  checkTokenExpiration,
  uploadMiddleware.none(),
  async (req, res) => {
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
      const sanitizedContent = DOMPurify.sanitize(content);
      const update = {
        title: sanitizedTitle,
        summary: sanitizedSummary,
        content: sanitizedContent,
      };

      await postDoc.updateOne(update);
      const updatedPostDoc = await Post.findById(id);

      res.json(updatedPostDoc);
    });
  }
);

app.delete("/api/post/:postId", checkTokenExpiration, async (req, res) => {
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

app.get("/api/post", async (req, res) => {
  res.json(
    await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
  );
});

app.get("/api/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const postDoc = await Post.findById(id).populate("author", ["username"]);
    res.json(postDoc);
  } catch (err) {
    res.status(404).send("Not found");
  }
});

// mongoose.connect(process.env.MONGODB_URI).then(() => {
//   app.listen(process.env.PORT);
//   console.log(`listening on port ${process.env.PORT}`);
// });

module.exports = app;
