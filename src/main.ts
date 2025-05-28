import express, { Request, Response } from "express";
import dotenv from "dotenv";

import index from "./routes";
import user from "./routes/user";

// configures dotenv to work in your application
dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT;

app.use("/", index)
app.use("/user", user)

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}).on("error", (error) => {
    // gracefully handle error
    throw new Error(error.message);
});
