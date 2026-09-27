import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NewCaseForm from "@/components/cases/NewCaseForm";

export default async function NewCasePage() {
  const user = await getCurrentUser();
  if (user?.role !== "CONTRACTOR") {
    redirect("/");
  }

  return <NewCaseForm />;
}
