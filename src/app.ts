import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { connectMongoDB } from "./config/mongodb.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import resumeRouter from "./routes/resume.route.js";
import authRouter from "./routes/auth.route.js";
import "dotenv/config";
import "./config/cloudinary.js";

const app: Application = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

connectMongoDB();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express + TypeScript + pnpm!");
});

app.use("/api/resume", resumeRouter);
app.use("/api/user-auth", authRouter);

export default app;
