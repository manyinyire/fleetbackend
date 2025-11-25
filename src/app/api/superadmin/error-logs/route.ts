import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 50;

function resolveLevelFilter(level: string | null) {
  if (!level || level === "all") {
    return undefined;
  }

  const normalized = level.toUpperCase();
  if (normalized === "ERROR" || normalized === "CRITICAL") {
    return {
      in: ["ERROR", "CRITICAL", "AUTH_ERROR", "PAYMENT_ERROR", "DB_ERROR"],
    };
  }

  if (normalized === "WARN" || normalized === "WARNING") {
    return "WARNING";
  }

  if (normalized === "INFO") {
    return {
      notIn: ["ERROR", "WARNING", "CRITICAL"],
    };
  }

  return undefined;
}

function determineLevel(action: string): "ERROR" | "WARN" | "INFO" {
  if (action.includes("ERROR") || action === "CRITICAL") {
    return "ERROR";
  }

  if (action.includes("WARN")) {
    return "WARN";
  }

  return "INFO";
}

function determineSource(action: string, entityType: string | null): string {
  if (action.includes("AUTH")) return "Auth";
  if (action.includes("PAYMENT")) return "Payment";
  if (action.includes("DB")) return "Database";
  if (action.includes("API")) return "API";
  return entityType || "System";
}

export async function GET(request: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");

    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const level = url.searchParams.get("level");
    const source = url.searchParams.get("source");
    const range = (url.searchParams.get("range") || "24h").toLowerCase();
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10), 1),
      200,
    );

    const now = new Date();
    let startDate = new Date(now);

    switch (range) {
      case "1h":
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: now,
      },
    };

    if (search) {
      whereClause.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entityType: { contains: search, mode: "insensitive" } },
      ];
    }

    const levelFilter = resolveLevelFilter(level);
    if (levelFilter) {
      whereClause.action =
        typeof levelFilter === "string"
          ? levelFilter
          : {
              ...(whereClause.action || {}),
              ...levelFilter,
            };
    } else {
      whereClause.action = {
        in: [
          "ERROR",
          "WARNING",
          "CRITICAL",
          "LOGIN_FAILED",
          "AUTH_ERROR",
          "PAYMENT_ERROR",
          "DB_ERROR",
        ],
      };
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          action: true,
          entityType: true,
          createdAt: true,
          details: true,
          newValues: true,
        },
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    const tenantIds = Array.from(
      new Set(logs.map((log) => log.tenantId).filter(Boolean) as string[]),
    );

    const tenantNames = tenantIds.length
      ? await prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, name: true },
        })
      : [];

    const tenantMap = new Map(tenantNames.map((tenant) => [tenant.id, tenant.name]));

    const normalizedLogs = logs
      .map((log) => {
        const derivedLevel = determineLevel(log.action);
        const derivedSource = determineSource(log.action, log.entityType);
        return {
          id: log.id,
          timestamp: log.createdAt,
          level: derivedLevel,
          source: derivedSource,
          tenant: log.tenantId ? tenantMap.get(log.tenantId) || "Unknown tenant" : "-",
          message: log.action.replace(/_/g, " "),
          stackTrace: (log.details as any)?.stackTrace || (log.newValues as any)?.error || null,
        };
      })
      .filter((log) => {
        if (!source || source === "all") {
          return true;
        }
        return log.source.toLowerCase().includes(source.toLowerCase());
      });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        logs: normalizedLogs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    apiLogger.error({ err: error }, '`'');
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 },
    );
  }
}

