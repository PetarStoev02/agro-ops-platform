import { AuthenticatedLayout } from "@/src/shared/components/authenticated-layout";

export default function FarmProfilePage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Farm Profile</h1>
      </div>
    </AuthenticatedLayout>
  );
}
