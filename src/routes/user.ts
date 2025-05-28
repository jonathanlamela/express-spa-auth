import express, { Request, Response } from "express";
import { changePasswordValidator, userCreateValidator } from "../validators/user";
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
            await db.user.create({
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

router.post("/changePassword", async (request: Request, response: Response) => {


    try {
        const { email, oldPassword, newPassword } = await changePasswordValidator.validate(request.body, { abortEarly: false });
        const db = getDb();


        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
            response.status(404).json({ status: "error", message: "user not found" });
            return;
        }
        const passwordMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!passwordMatch) {
            response.status(400).json({ status: "error", message: "old password is incorrect" });
            return;
        }

        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        await db.user.update({
            where: { email },
            data: { passwordHash: newPasswordHash }
        });

        response.status(200).json({ status: "password changed" });
    } catch (err: any) {
        if (err.name === "ValidationError") {
            const errs = err.inner.map((e: any) => ({ message: e.message, path: e.path }));
            response.status(400).json({ status: "error", errs });
        } else {
            response.status(500).json({ status: "error", message: "password change failed" });
        }
    }


});



router.post("/updateUserinfo", (request: Request, response: Response) => {
});

router.post("/login", (request: Request, response: Response) => {
});

// Aggiungere un middleware qui
router.get("/status", (request: Request, response: Response) => {
});


export default router;
