import { AuthenticatedLayout } from "@/src/shared/components/authenticated-layout";

export default function ActivitiesPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Activities</h1>
      </div>
    </AuthenticatedLayout>
  );
}
