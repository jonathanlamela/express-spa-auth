import express, { Request, Response } from "express";
import { userCreateValidator } from "../validators/user";
import getDb from "../lib/db";

const bcrypt = require('bcrypt');
const saltRounds = 10;

const router = express.Router()

router.get("/", (request: Request, response: Response) => {
    response.status(200).json({ "status": "user route" });
});

router.post("/createUser", async (request: Request, response: Response) => {

    userCreateValidator.validate(request.body, { abortEarly: false }).then(async function (result) {
        const db = getDb();

        var passwordHash = await bcrypt.hash(result.password, saltRounds);

        try {
            var user = await db.user.create({
                data: {
                    email: request.body.email,
                    passwordHash: passwordHash,
                    firstname: request.body.firstname,
                    lastname: request.body.lastname
                }
            });

            response.status(200).json({ "status": "user created" });

        } catch (error) {
            response.status(500).json({ "status": "error", "message": "user creation failed" });
        }


    }).catch(function (err) {

        var errs: any[] = [];
        err.inner.forEach((e: any) => {
            errs.push({ "message": e.message, "path": e.path });
        });

        response.status(400).json({ "status": "error", "errs": errs });
    });


});

router.post("/changePassword", (request: Request, response: Response) => {
    response.status(200).json({ "status": "api works" });
});

router.post("/resetPassword", (request: Request, response: Response) => {
    response.status(200).json({ "status": "api works" });
});

router.post("/updateUserinfo", (request: Request, response: Response) => {
    response.status(200).json({ "status": "api works" });
});


// Aggiungere un middleware qui
router.get("/status", (request: Request, response: Response) => {
    response.status(200).json({ "status": "api works" });
});


export default router;
