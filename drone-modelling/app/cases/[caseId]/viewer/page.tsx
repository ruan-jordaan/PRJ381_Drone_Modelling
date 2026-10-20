import MeasurementViewer from "@/components/MeasurementViewer";

export default async function ViewerPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return <MeasurementViewer caseId={caseId} />;
}