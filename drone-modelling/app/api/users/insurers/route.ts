import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  // Only contractors need to select an insurer when creating a case.
  if (user.role !== UserRole.CONTRACTOR) {
    return NextResponse.json(
      { error: "Only contractors can access insurers." },
      { status: 403 }
    );
  }

  const insurers = await prisma.user.findMany({
    where: {
      role: UserRole.INSURANCE,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({ insurers });
}