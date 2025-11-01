"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const projects_1 = __importDefault(require("./routes/projects"));
const analyze_1 = __importDefault(require("./routes/analyze"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.raw({ limit: "10mb" }));
app.use(express_1.default.text({ limit: "10mb" }));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/projects", projects_1.default);
app.use("/api/analyze", analyze_1.default);
app.use("/api/reviews", reviews_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
