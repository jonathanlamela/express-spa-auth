import express, { Request, Response } from "express";
const router = express.Router()

router.get("/", (request: Request, response: Response) => {
    response.status(200).json({ "status": "api works" });
});

export default router;
