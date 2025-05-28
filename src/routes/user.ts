import express, { Request, Response } from "express";
import { changeInfoValidator, changePasswordValidator, userCreateValidator } from "../validators/user";
import getDb from "../lib/db";

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
        // Assuming the JWT is stored in a cookie named 'token'
        const token = request.cookies?.token;
        if (!token) {
            response.status(401).json({ status: "error", message: "missing authentication token" });
            return;
        }
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            response.status(401).json({ status: "error", message: "invalid token" });
            return;
        }
        const email = decoded.email;
        const { oldPassword, newPassword } = await changePasswordValidator.validate(request.body, { abortEarly: false });
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

router.post("/updateUserinfo", async (request: Request, response: Response) => {
    try {
        const token = request.cookies?.token;
        if (!token) {
            response.status(401).json({ status: "error", message: "missing authentication token" });
            return;
        }
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            response.status(401).json({ status: "error", message: "invalid token" });
            return;
        }
        const email = decoded.email;
        const { firstname, lastname } = await changeInfoValidator.validate(request.body, { abortEarly: false });
        const db = getDb();
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
            response.status(404).json({ status: "error", message: "user not found" });
            return;
        }

        await db.user.update({
            where: { email },
            data: { firstname: firstname, lastname: lastname }
        });
        response.status(200).json({ status: "user info changed" });
    } catch (err: any) {
        if (err.name === "ValidationError") {
            const errs = err.inner.map((e: any) => ({ message: e.message, path: e.path }));
            response.status(400).json({ status: "error", errs });
        } else {
            response.status(500).json({ status: "error", message: "user info change failed" });
        }
    }

});

router.post("/login", (request: Request, response: Response) => {
    (async () => {
        const db = getDb();
        const { email, password } = request.body;

        if (!email || !password) {
            response.status(400).json({ status: "error", message: "email and password required" });
            return;
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
            response.status(401).json({ status: "error", message: "invalid credentials" });
            return;
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            response.status(401).json({ status: "error", message: "invalid credentials" });
            return;
        }

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
        response
            .cookie("token", token, {
                httpOnly: false,
                sameSite: "lax",
                maxAge: 60 * 60 * 1000 // 1 hour
            })
            .status(200)
            .json({ status: "success", token });
    })();
});

// Aggiungere un middleware qui
router.get("/status", (request: Request, response: Response) => {
    const token = request.cookies?.token;
    console.log(request.cookies);
    if (!token) {
        response.status(401).json({ status: "error", message: "missing authentication token" });
        return;
    }
    let decoded: any;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
        response.status(401).json({ status: "error", message: "invalid token" });
        return;
    }
    const email = decoded.email;
    const db = getDb();
    db.user.findUnique({ where: { email } })
        .then(user => {
            if (!user) {
                response.status(404).json({ status: "error", message: "user not found" });
                return;
            }
            response.status(200).json({
                status: "success",
                firstname: user.firstname,
                lastname: user.lastname
            });
        })
        .catch(() => {
            response.status(500).json({ status: "error", message: "could not fetch user info" });
        });
});


export default router;
