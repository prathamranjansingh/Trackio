import { NextResponse } from "next/server";
import { redis } from "@/lib/upstash/redis";
import { prisma } from "@trackio/prisma";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

const QUEUE_KEY = "tracker_queue";
const MAX_MESSAGES_PER_RUN = 500;
const SUMMARY_RETENTION_DAYS = 30;

export const dynamic = "force-dynamic";

interface HeartbeatPayload {
  time: number;
  project: string;
  language?: string;
  category: "coding" | "debugging";
}

interface QueueMessage {
  userId: string;
  timezone: string;
  batch: HeartbeatPayload[];
}

export async function GET() {
  console.log("Worker: Starting processing cycle.");

  try {
    const batchesToProcess = await redis.lrange(
      QUEUE_KEY,
      0,
      MAX_MESSAGES_PER_RUN - 1
    );
    if (batchesToProcess.length === 0) {
      return NextResponse.json({ message: "Queue empty" });
    }

    const projectSummaryMap = new Map<
      string,
      {
        userId: string;
        projectName: string;
        language: string | null;
        category: string;
        date: string;
        durationSeconds: number;
      }
    >();
    const activityTotalMap = new Map<
      string,
      {
        userId: string;
        date: string;
        codingSeconds: number;
        debuggingSeconds: number;
      }
    >();

    for (const rawMessage of batchesToProcess) {
      try {
        const message: QueueMessage = JSON.parse(rawMessage);
        const { userId, timezone, batch } = message;
        const userTimezone = timezone || "UTC";

        for (const heartbeat of batch) {
          if (
            typeof heartbeat?.time !== "number" ||
            typeof heartbeat?.project !== "string"
          )
            continue;

          const zonedDate = toZonedTime(
            new Date(heartbeat.time * 1000),
            userTimezone
          );
          const localDateStr = formatInTimeZone(
            zonedDate,
            userTimezone,
            "yyyy-MM-dd"
          );
          const lang = heartbeat.language || null;

          const projectKey = `${userId}-${localDateStr}-${heartbeat.project}-${lang}-${heartbeat.category}`;
          const summary = projectSummaryMap.get(projectKey) || {
            userId,
            projectName: heartbeat.project,
            language: lang,
            category: heartbeat.category,
            date: localDateStr,
            durationSeconds: 0,
          };
          summary.durationSeconds += 2;
          projectSummaryMap.set(projectKey, summary);

          const totalKey = `${userId}-${localDateStr}`;
          const total = activityTotalMap.get(totalKey) || {
            userId,
            date: localDateStr,
            codingSeconds: 0,
            debuggingSeconds: 0,
          };
          if (heartbeat.category === "coding") total.codingSeconds += 2;
          else total.debuggingSeconds += 2;
          activityTotalMap.set(totalKey, total);
        }
      } catch (parseError) {
        console.error(
          "Worker: Failed to parse message, skipping:",
          rawMessage.substring(0, 100),
          parseError
        );
      }
    }

    const projectSummaries = Array.from(projectSummaryMap.values());
    const activityTotals = Array.from(activityTotalMap.values());

    if (projectSummaries.length > 0 || activityTotals.length > 0) {
      await prisma.$transaction(async (tx) => {
        if (projectSummaries.length > 0) {
          const summaryValues = projectSummaries
            .map(
              (s) =>
                `('${s.userId}', '${s.date}', '${s.projectName.replace(/'/g, "''")}', ${s.language ? `'${s.language.replace(/'/g, "''")}'` : "NULL"}, '${s.category}', ${s.durationSeconds})`
            )
            .join(", ");
          await tx.$executeRawUnsafe(
            `INSERT INTO "DailyProjectSummary" (user_id, date, project_name, language, category, duration_seconds) VALUES ${summaryValues}
             ON CONFLICT (user_id, date, project_name, language, category) DO UPDATE SET duration_seconds = "DailyProjectSummary".duration_seconds + EXCLUDED.duration_seconds;`
          );
        }
        if (activityTotals.length > 0) {
          const totalValues = activityTotals
            .map(
              (t) =>
                `('${t.userId}', '${t.date}', ${t.codingSeconds}, ${t.debuggingSeconds})`
            )
            .join(", ");
          await tx.$executeRawUnsafe(
            `INSERT INTO "DailyActivityTotal" (user_id, date, total_coding_seconds, total_debugging_seconds) VALUES ${totalValues}
              ON CONFLICT (user_id, date) DO UPDATE SET total_coding_seconds = "DailyActivityTotal".total_coding_seconds + EXCLUDED.total_coding_seconds, total_debugging_seconds = "DailyActivityTotal".total_debugging_seconds + EXCLUDED.total_debugging_seconds;`
          );
        }
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - SUMMARY_RETENTION_DAYS);
        await tx.dailyProjectSummary.deleteMany({
          where: { date: { lt: cutoffDate } },
        });
      });
      console.log("Worker: Database operations successful.");
    }

    await redis.ltrim(QUEUE_KEY, batchesToProcess.length, -1);
    return NextResponse.json({
      message: `Processed ${batchesToProcess.length} batches.`,
    });
  } catch (error) {
    console.error("Worker: Unhandled error during processing:", error);
    return NextResponse.json(
      { error: "Worker processing failed" },
      { status: 500 }
    );
  }
}
