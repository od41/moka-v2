import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCreateForm } from "./_components/create-form";
export const metadata = {
  title: "Create Book Fund",
};

export default function ProjectCreatePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Book Fund</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectCreateForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
