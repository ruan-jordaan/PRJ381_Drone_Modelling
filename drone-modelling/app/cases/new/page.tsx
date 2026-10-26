import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import NewCaseForm from "@/components/cases/NewCaseForm";

export default async function NewCasePage() {
  const user = await getCurrentUser();
  if (user?.role !== "CONTRACTOR") {
    redirect("/");
  }

  return (
    <>
      <AppHeader />
      <NewCaseForm />
    </>
  );
}
