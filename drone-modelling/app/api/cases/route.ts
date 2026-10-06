import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PartyInput = {
  name?: unknown;
  vehicleRegistration?: unknown;
  contactDetails?: unknown;
  insurerId?: unknown;
};

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

// GET /api/cases
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const cases = await prisma.case.findMany({
    where:
      user.role === UserRole.CONTRACTOR
        ? {
            contractorId: user.id,
          }
        : {
            status: "REPORT_FINALIZED",
            parties: {
              some: {
                insurerId: user.id,
              },
            },
          },

    include: {
      parties: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ cases });
}

// POST /api/cases
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  // Only contractors can create cases.
  if (user.role !== UserRole.CONTRACTOR) {
    return NextResponse.json(
      { error: "Only contractors can create cases." },
      { status: 403 }
    );
  }

  let body: {
    title?: unknown;
    description?: unknown;
    parties?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const title = optionalString(body.title);
  const description = optionalString(body.description);

  const parties = Array.isArray(body.parties)
    ? (body.parties as PartyInput[])
    : [];

  // Validate title.
  if (!title) {
    return NextResponse.json(
      { error: "Case title is required." },
      { status: 400 }
    );
  }

  // At least one party is required.
  if (parties.length === 0) {
    return NextResponse.json(
      { error: "At least one party is required." },
      { status: 400 }
    );
  }

  const normalizedParties = parties.map((party) => ({
    name: optionalString(party.name),
    vehicleRegistration: optionalString(party.vehicleRegistration),
    contactDetails: optionalString(party.contactDetails),
    insurerId: optionalString(party.insurerId),
  }));

  // Every party must have a name.
  if (normalizedParties.some((party) => !party.name)) {
    return NextResponse.json(
      { error: "Every party must have a name." },
      { status: 400 }
    );
  }

  // Find all selected insurers.
  const insurerIds = [
    ...new Set(
      normalizedParties
        .map((party) => party.insurerId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  // At least one insured party is required.
  if (insurerIds.length === 0) {
    return NextResponse.json(
      { error: "At least one party must have an insurer assigned." },
      { status: 400 }
    );
  }

  // Make sure every insurer ID belongs to an INSURANCE user.
  const insurers = await prisma.user.findMany({
    where: {
      id: {
        in: insurerIds,
      },
      role: UserRole.INSURANCE,
    },
    select: {
      id: true,
    },
  });

  if (insurers.length !== insurerIds.length) {
    return NextResponse.json(
      { error: "One or more selected insurers are invalid." },
      { status: 400 }
    );
  }

  // Create the case and its parties together.
  const createdCase = await prisma.case.create({
    data: {
      title,
      description,
      contractorId: user.id,
      status: "UPLOADED",

      parties: {
        create: normalizedParties.map((party) => ({
          name: party.name!,
          vehicleRegistration: party.vehicleRegistration,
          contactDetails: party.contactDetails,
          insurerId: party.insurerId,
        })),
      },
    },

    include: {
      parties: true,
    },
  });

  return NextResponse.json(
    { case: createdCase },
    { status: 201 }
  );
}