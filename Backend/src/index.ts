import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRouter from "./routes/auth";
import userRouter from "./routes/users";
import projectRouter from "./routes/projects";
import analyzeRouter from "./routes/analyze";
import reviewRouter from "./routes/reviews";
import guidelineRouter from "./routes/guidelines";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.raw({ limit: "10mb" }));
app.use(express.text({ limit: "10mb" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);
app.use("/api/analyze", analyzeRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/guidelines", guidelineRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
