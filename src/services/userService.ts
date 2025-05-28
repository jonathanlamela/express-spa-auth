import { Prisma } from "../generated/prisma";
import getDb from "../lib/db";

export function createUser(userCreate: Prisma.UserCreateInput) {
    return getDb().user.create({
        data: userCreate,
    });
}
