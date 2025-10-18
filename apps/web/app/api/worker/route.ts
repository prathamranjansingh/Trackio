import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/upstash/redis";
import { prisma } from "@trackio/prisma";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

const QUEUE_KEY = "tracker_queue";
const MAX_MESSAGES_PER_RUN = 500;
const SUMMARY_RETENTION_DAYS = 30;
const PROCESSING_LOCK_KEY = "worker:processing:lock";
const LOCK_TIMEOUT = 300;

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  timestamp?: number;
}

interface ProjectSummary {
  userId: string;
  projectName: string;
  language: string | null;
  category: "coding" | "debugging";
  date: string;
  durationSeconds: number;
}

interface ActivityTotal {
  userId: string;
  date: string;
  codingSeconds: number;
  debuggingSeconds: number;
}

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

async function acquireLock(): Promise<boolean> {
  try {
    const acquired = await redis.set(
      PROCESSING_LOCK_KEY,
      Date.now().toString(),
      { ex: LOCK_TIMEOUT, nx: true }
    );
    return acquired === "OK";
  } catch {
    return false;
  }
}

async function releaseLock(): Promise<void> {
  try {
    await redis.del(PROCESSING_LOCK_KEY);
  } catch (error) {
    console.error("[WORKER] Failed to release lock:", error);
  }
}

function validateMessage(message: any): message is QueueMessage {
  return (
    message &&
    typeof message.userId === "string" &&
    message.userId.length > 0 &&
    typeof message.timezone === "string" &&
    Array.isArray(message.batch) &&
    message.batch.length > 0
  );
}

function validateHeartbeat(hb: any): hb is HeartbeatPayload {
  return (
    hb &&
    typeof hb.time === "number" &&
    hb.time > 0 &&
    typeof hb.project === "string" &&
    hb.project.length > 0 &&
    hb.project.length <= 255 &&
    (hb.category === "coding" || hb.category === "debugging") &&
    (hb.language === undefined || typeof hb.language === "string")
  );
}

export async function POST(req: NextRequest) {
  return processWorker();
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Method not allowed in production" },
      { status: 405 }
    );
  }
  return processWorker();
}

async function processWorker() {
  const startTime = Date.now();
  console.log("\n=== [WORKER] Started ===");

  const lockAcquired = await acquireLock();
  if (!lockAcquired) {
    console.log("[WORKER] Another instance running");
    return NextResponse.json({ message: "Worker already running" });
  }

  let batchesToProcess: any[] = [];
  let processedCount = 0;
  let errorCount = 0;

  try {
    batchesToProcess = await redis.lrange(
      QUEUE_KEY,
      0,
      MAX_MESSAGES_PER_RUN - 1
    );

    if (batchesToProcess.length === 0) {
      console.log("[WORKER] Queue empty");
      await releaseLock();
      return NextResponse.json({ message: "Queue empty" });
    }

    console.log(`[WORKER] [1/6] Fetched ${batchesToProcess.length} messages`);

    const projectSummaryMap = new Map<string, ProjectSummary>();
    const activityTotalMap = new Map<string, ActivityTotal>();

    for (let i = 0; i < batchesToProcess.length; i++) {
      const rawMessage = batchesToProcess[i];

      try {
        let message: QueueMessage;

        if (typeof rawMessage === "object" && rawMessage !== null) {
          message = rawMessage as QueueMessage;
        } else if (typeof rawMessage === "string") {
          try {
            message = JSON.parse(rawMessage);
          } catch (parseError) {
            console.error(`[WORKER] JSON parse failed:`, parseError);
            errorCount++;
            continue;
          }
        } else {
          console.error(`[WORKER] Unexpected type: ${typeof rawMessage}`);
          errorCount++;
          continue;
        }

        if (!validateMessage(message)) {
          console.warn(`[WORKER] Invalid message structure`);
          errorCount++;
          continue;
        }

        const { userId, timezone, batch } = message;
        const userTimezone = isValidTimezone(timezone) ? timezone : "UTC";

        for (const heartbeat of batch) {
          if (!validateHeartbeat(heartbeat)) continue;

          try {
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
            const sanitizedProject = heartbeat.project.substring(0, 255);

            const projectKey = `${userId}:${localDateStr}:${sanitizedProject}:${lang}:${heartbeat.category}`;
            const summary = projectSummaryMap.get(projectKey) || {
              userId,
              projectName: sanitizedProject,
              language: lang,
              category: heartbeat.category,
              date: localDateStr,
              durationSeconds: 0,
            };
            summary.durationSeconds += 2;
            projectSummaryMap.set(projectKey, summary);

            const totalKey = `${userId}:${localDateStr}`;
            const total = activityTotalMap.get(totalKey) || {
              userId,
              date: localDateStr,
              codingSeconds: 0,
              debuggingSeconds: 0,
            };

            if (heartbeat.category === "coding") {
              total.codingSeconds += 2;
            } else {
              total.debuggingSeconds += 2;
            }
            activityTotalMap.set(totalKey, total);
          } catch (dateError) {
            console.error(`[WORKER] Date error:`, dateError);
          }
        }

        processedCount++;
      } catch (messageError) {
        console.error(`[WORKER] Message error:`, messageError);
        errorCount++;
      }
    }

    const projectSummaries = Array.from(projectSummaryMap.values());
    const activityTotals = Array.from(activityTotalMap.values());

    console.log(
      `[WORKER] [2/6] Aggregated ${projectSummaries.length} summaries, ${activityTotals.length} totals`
    );

    if (projectSummaries.length > 0 || activityTotals.length > 0) {
      console.log("[WORKER] [3/6] Starting DB transaction");

      try {
        await prisma.$transaction(
          async (tx) => {
            // Process project summaries using Prisma ORM
            if (projectSummaries.length > 0) {
              for (const summary of projectSummaries) {
                await tx.dailyProjectSummary.upsert({
                  where: {
                    userId_date_project_name_language_category: {
                      userId: summary.userId,
                      date: new Date(summary.date),
                      project_name: summary.projectName,
                      language: summary.language ?? "",
                      category: summary.category,
                    },
                  },
                  create: {
                    userId: summary.userId,
                    date: new Date(summary.date),
                    project_name: summary.projectName,
                    language: summary.language,
                    category: summary.category,
                    duration_seconds: summary.durationSeconds,
                  },
                  update: {
                    duration_seconds: {
                      increment: summary.durationSeconds,
                    },
                  },
                });
              }
              console.log(
                `[WORKER] [4/6] Saved ${projectSummaries.length} summaries`
              );
            }

            // Process activity totals using Prisma ORM
            if (activityTotals.length > 0) {
              for (const total of activityTotals) {
                await tx.dailyActivityTotal.upsert({
                  where: {
                    userId_date: {
                      userId: total.userId,
                      date: new Date(total.date),
                    },
                  },
                  create: {
                    userId: total.userId,
                    date: new Date(total.date),
                    total_coding_seconds: total.codingSeconds,
                    total_debugging_seconds: total.debuggingSeconds,
                  },
                  update: {
                    total_coding_seconds: {
                      increment: total.codingSeconds,
                    },
                    total_debugging_seconds: {
                      increment: total.debuggingSeconds,
                    },
                  },
                });
              }
              console.log(
                `[WORKER] [5/6] Saved ${activityTotals.length} totals`
              );
            }

            // Cleanup old data
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - SUMMARY_RETENTION_DAYS);

            const deleted = await tx.dailyProjectSummary.deleteMany({
              where: {
                date: {
                  lt: cutoffDate,
                },
              },
            });

            if (deleted.count > 0) {
              console.log(`[WORKER] Cleaned ${deleted.count} old records`);
            }
          },
          {
            maxWait: 10000,
            timeout: 30000,
          }
        );

        console.log("[WORKER] [6/6] DB transaction complete");
      } catch (dbError) {
        console.error("[WORKER] DB error:", dbError);
        await releaseLock();
        return NextResponse.json(
          { error: "DB transaction failed" },
          { status: 500 }
        );
      }
    } else {
      console.log("[WORKER] [3/6] No data to save");
    }

    await redis.ltrim(QUEUE_KEY, batchesToProcess.length, -1);
    console.log(`[WORKER] [6/6] Cleared ${batchesToProcess.length} messages`);

    const processingTime = Date.now() - startTime;
    console.log(`=== [WORKER] Completed in ${processingTime}ms ===`);

    await releaseLock();

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      summaries: projectSummaries.length,
      totals: activityTotals.length,
      processingTimeMs: processingTime,
    });
  } catch (error) {
    console.error(`[WORKER] Fatal error:`, error);
    await releaseLock();
    return NextResponse.json({ error: "Worker failed" }, { status: 500 });
  }
}
