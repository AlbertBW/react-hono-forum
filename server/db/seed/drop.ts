import { sql } from "drizzle-orm";
import { db } from "../../db";
import { account, session, user, verification } from "../schema";

async function drop() {
  await db.execute(sql`DROP TABLE IF EXISTS ${user} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${session} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${account} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${verification} CASCADE`);
}

drop();
