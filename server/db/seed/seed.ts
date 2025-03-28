import { db } from "..";
import { usersSeedData } from "./seed-data/users-seed";
import {
  comment,
  commentVote,
  community,
  communityFollow,
  moderator,
  thread,
  threadVote,
  user,
  type InsertComment,
  type InsertCommentVote,
  type InsertCommunityFollow,
  type InsertModerator,
  type InsertThread,
  type InsertThreadVote,
} from "../schema";
import { communitiesSeedData } from "./seed-data/communities-seed";
import { threadsSeedData } from "./seed-data/threads-seed";

function getRandomDate() {
  // Generate a random date within the last 5 years
  const now = new Date();
  const fiveYearsAgo = new Date(now.setFullYear(now.getFullYear() - 5));
  return new Date(
    fiveYearsAgo.getTime() +
      Math.random() * (Date.now() - fiveYearsAgo.getTime())
  );
}

async function seed() {
  console.log("Seeding database...");
  try {
    console.log("Fetching profile pictures...");
    const profilePictures: string[] = [];

    async function getProfilePicture() {
      let imageString;
      do {
        const avatar = await fetch(
          `https://picsum.photos/id/${Math.floor(Math.random() * 1000) + 1}/300`
        );
        imageString = avatar.url;
      } while (!imageString.startsWith("https://fastly"));

      return imageString;
    }

    for (let i = 0; i < usersSeedData.length; i++) {
      const image = await getProfilePicture();
      profilePictures.push(image);
    }

    console.log("Seeding users...");
    const awaitedSeedUsers = usersSeedData.map((userData, index) => {
      const createdAt = getRandomDate();
      return {
        ...userData,
        createdAt: createdAt,
        updatedAt: createdAt,
        image: profilePictures[index],
      };
    });

    const resultUsers = await db
      .insert(user)
      .values(awaitedSeedUsers)
      .returning();
    console.log("Seeding users complete: ", awaitedSeedUsers.length + " users");

    console.log("Seeding communities...");
    const seedCommunities = communitiesSeedData.map((communityData) => {
      return {
        ...communityData,
        ownerId: resultUsers[Math.floor(Math.random() * resultUsers.length)].id,
        createdAt: getRandomDate(),
      };
    });

    const resultCommunities = await db
      .insert(community)
      .values(seedCommunities)
      .returning();

    console.log(
      "Seeding communities complete: ",
      seedCommunities.length + " communities"
    );

    console.log("Seeding moderators...");
    const communityMods: InsertModerator[] = [];
    // Create two moderators for each community
    resultCommunities.forEach((community) => {
      for (let i = 0; i < 2; i++) {
        const userId =
          resultUsers[Math.floor(Math.random() * resultUsers.length)].id;

        if (
          communityMods.some(
            (cm) => cm.communityId === community.id && cm.userId === userId
          )
        ) {
          continue;
        }
        communityMods.push({
          communityId: community.id,
          userId: userId,
        });
      }
    });

    const resultMods = await db
      .insert(moderator)
      .values(communityMods)
      .returning();

    console.log(
      "Seeding moderators complete: ",
      communityMods.length + " moderators"
    );

    console.log("Seeding community followers...");
    const communityFollowers: InsertCommunityFollow[] = [];
    resultUsers.forEach((user) => {
      for (let i = 0; i < resultCommunities.length / 2; i++) {
        const communityId =
          resultCommunities[
            Math.floor(Math.random() * resultCommunities.length)
          ].id;

        if (
          communityFollowers.some(
            (cf) => cf.communityId === communityId && cf.userId === user.id
          )
        ) {
          continue;
        }
        communityFollowers.push({
          communityId: communityId,
          userId: user.id,
        });
      }
    });

    const resultFollows = await db
      .insert(communityFollow)
      .values(communityFollowers)
      .returning();

    console.log(
      "Seeding community followers complete: ",
      communityFollowers.length + " followers"
    );

    console.log("Seeding threads...");
    const seedThreads: InsertThread[] = [];
    resultCommunities.forEach((community) => {
      threadsSeedData.forEach((thread) => {
        seedThreads.push({
          ...thread,
          communityId: community.id,
          userId:
            resultUsers[Math.floor(Math.random() * resultUsers.length)].id,
          createdAt: new Date(
            community.createdAt.getTime() +
              Math.random() * (Date.now() - community.createdAt.getTime())
          ),
        });
      });
    });

    const resultThreads = await db
      .insert(thread)
      .values(seedThreads)
      .returning();

    console.log("Seeding threads complete: ", seedThreads.length + " threads");

    console.log("Seeding thread votes...");
    const threadVotes: InsertThreadVote[] = [];
    resultUsers.forEach((user) => {
      for (let i = 0; i < resultThreads.length / 2; i++) {
        const threadId =
          resultThreads[Math.floor(Math.random() * resultThreads.length)].id;

        if (
          threadVotes.some(
            (tv) => tv.threadId === threadId && tv.userId === user.id
          )
        ) {
          continue;
        }
        threadVotes.push({
          threadId: threadId,
          userId: user.id,
          value: Math.random() < 0.2 ? -1 : 1,
        });
      }
    });

    const resultVotes = await db
      .insert(threadVote)
      .values(threadVotes)
      .returning();

    console.log(
      "Seeding thread votes complete: ",
      threadVotes.length + " votes"
    );

    console.log("Seeding comments...");
    const parentComments: InsertComment[] = [];
    resultThreads.forEach((thread) => {
      for (let i = 0; i < 2; i++) {
        const now = Date.now();
        const createdAt = new Date(
          thread.createdAt.getTime() +
            Math.random() * (now - thread.createdAt.getTime())
        );
        const updatedAt =
          Math.random() < 0.2
            ? new Date(
                createdAt.getTime() +
                  Math.random() * (now - createdAt.getTime())
              )
            : createdAt;

        const commentTexts = [
          "I completely agree with this post! The way this topic impacts our community is fascinating.",
          "Has anyone else noticed how this relates to recent events? I'm curious about your thoughts.",
          "This is a controversial take, but I think this post misses some important context...",
          "As someone who's studied this topic for years, this brings up several interesting points.",
          "I'm not convinced by the arguments in this post. Here's why I think differently...",
        ];

        parentComments.push({
          threadId: thread.id,
          userId:
            resultUsers[Math.floor(Math.random() * resultUsers.length)].id,
          content:
            commentTexts[Math.floor(Math.random() * commentTexts.length)],
          parentId: null,
          createdAt: createdAt,
          updatedAt: updatedAt,
        });
      }
    });

    const resultParentComments = await db
      .insert(comment)
      .values(parentComments)
      .returning();

    console.log(
      "Seeding parent comments complete: ",
      parentComments.length + " comments"
    );

    console.log("Seeding child comments...");
    const childComments: InsertComment[] = [];
    // Select 1/3 of the parent comments at random
    const selectedComments = resultParentComments.filter(
      () => Math.random() < 1 / 3
    );

    // Only create child comments for 1/3 of the parent comments
    selectedComments.forEach((comment) => {
      for (let i = 0; i < 3; i++) {
        const createdAt = new Date(
          comment.createdAt!.getTime() +
            Math.random() * (Date.now() - comment.createdAt!.getTime())
        );
        const updatedAt =
          Math.random() < 0.2
            ? new Date(
                createdAt.getTime() +
                  Math.random() * (Date.now() - createdAt.getTime())
              )
            : createdAt;

        const childResponseTexts = [
          "I totally agree with your point...",
          "Have you considered the opposite perspective? I think this could be viewed differently.",
          "This is such an insightful comment! I especially like your thoughts on this topic.",
          "I've been researching this topic and can add some additional context that connects to broader trends.",
          "Not sure I follow your logic here. Can you elaborate?",
        ];

        childComments.push({
          threadId: comment.threadId,
          userId:
            resultUsers[Math.floor(Math.random() * resultUsers.length)].id,
          content:
            childResponseTexts[
              Math.floor(Math.random() * childResponseTexts.length)
            ],
          parentId: comment.id,
          createdAt: createdAt,
          updatedAt: updatedAt,
        });
      }
    });

    const resultChildComments = await db
      .insert(comment)
      .values(childComments)
      .returning();

    console.log(
      "Seeding child comments complete: ",
      childComments.length + " comments"
    );

    console.log("Seeding comment votes...");
    const allComments = [...resultParentComments, ...resultChildComments];

    const commentVotes: InsertCommentVote[] = [];
    allComments.forEach((comment) => {
      for (let i = 0; i < 3; i++) {
        const userId =
          resultUsers[Math.floor(Math.random() * resultUsers.length)].id;

        if (
          commentVotes.some(
            (tv) => tv.commentId === comment.id && tv.userId === userId
          )
        ) {
          continue;
        }
        commentVotes.push({
          commentId: comment.id,
          userId: userId,
          value: Math.random() < 0.2 ? -1 : 1,
        });
      }
    });

    const resultCommentVotes = await db
      .insert(commentVote)
      .values(commentVotes)
      .returning();

    console.log(
      "Seeding comment votes complete: ",
      commentVotes.length + " votes"
    );

    console.log("Seed complete successfully 🌱");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed ❌", error);
    process.exit(1);
  }
}

seed();
