import { sql } from "drizzle-orm";
import { db } from "../../db";
import {
  account,
  session,
  user,
  verification,
  comment,
  commentVote,
  community,
  communityFollow,
  moderator,
  thread,
  threadVote,
} from "../schema";

async function drop() {
  await db.execute(sql`DROP TABLE IF EXISTS ${user} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${session} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${account} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${verification} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${community} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${communityFollow} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${moderator} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${thread} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${threadVote} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${comment} CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS ${commentVote} CASCADE`);
  console.log("Tables dropped");
  process.exit(0);
}

drop();
