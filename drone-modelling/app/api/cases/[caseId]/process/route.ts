import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNodeODMTask } from "@/lib/nodeodm";

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
        const imageUrls = caseData.images.map((img) => img.url);
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