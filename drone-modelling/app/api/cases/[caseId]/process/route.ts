import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNodeODMTask, getNodeODMTaskStatus } from "@/lib/nodeodm";
import { getDownloadUrl } from "@/lib/storage";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
){
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized'}, { status: 401});
    }

    const { caseId } = await params;

    const caseData = await prisma.case.findUnique({
        where: { id: caseId},
        include: { images: true},
    });

    if (!caseData || caseData.images.length === 0){
        return NextResponse.json({ error: 'No images available for processing'}, { status: 400});
    }

    try {
        const imageUrls = await Promise.all(
            caseData.images.map((img) => getDownloadUrl(img.url))
        );

        const taskId = await createNodeODMTask(imageUrls);

        await prisma.case.update({
            where: { id: caseId },
            data: { status: 'PROCESSING'},
        });

        return NextResponse.json({success: true, taskId: taskId});
    } catch (error: any){
        return NextResponse.json({ error: error.message}, { status: 500});
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const { caseId } = await params;

    const caseData = await prisma.case.findFirst({
        where: {
            id: caseId,
            contractorId: user.id,
        },
    });

    if (!caseData) {
        return NextResponse.json(
            { error: "Case not found" },
            { status: 404 }
        );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
        return NextResponse.json(
            { error: "NodeODM task ID is required" },
            { status: 400 }
        );
    }

    try {
        const taskStatus =
            await getNodeODMTaskStatus(taskId);

        return NextResponse.json(taskStatus);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Failed to get NodeODM task status";

        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}