import { UserRole } from "@prisma/client";

type AccessUser = { id: string; role: UserRole };

export function caseReadWhere(user: AccessUser, caseId: string) {
  return user.role === UserRole.CONTRACTOR
    ? { id: caseId, contractorId: user.id }
    : {
        id: caseId,
        status: "REPORT_FINALIZED" as const,
        parties: { some: { insurerId: user.id } },
      };
}
