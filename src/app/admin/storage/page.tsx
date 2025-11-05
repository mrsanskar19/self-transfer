
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HardDrive, File, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function StorageAdminPage() {
  const usagePercentage = (5 / (2 * 1024)) * 100; // 5MB used of 2GB

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Storage Management</h1>
      </div>
      <div className="flex flex-1 rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col w-full">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
                <CardDescription>
                  Overview of the total storage used by file uploads. Files are stored as base64 strings in `db.json`.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <HardDrive className="h-8 w-8 text-primary"/>
                    <div>
                        <p className="text-2xl font-bold">5 MB</p>
                        <p className="text-sm text-muted-foreground">Used of 2 GB</p>
                    </div>
                </div>
                <Progress value={usagePercentage} />
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Note on Storage</AlertTitle>
                    <AlertDescription>
                        Storing file data directly in a JSON database is inefficient and not recommended for production. This is for prototyping only. A real application should use a dedicated file storage service like Firebase Storage.
                    </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>File Breakdown</CardTitle>
                    <CardDescription>A conceptual list of stored files.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <File className="h-5 w-5"/>
                            <p className="font-mono text-sm">image_final_v2.png</p>
                            <p className="ml-auto text-sm text-muted-foreground">3.2 MB</p>
                        </div>
                         <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <File className="h-5 w-5"/>
                            <p className="font-mono text-sm">project_brief.pdf</p>
                            <p className="ml-auto text-sm text-muted-foreground">1.8 MB</p>
                        </div>
                    </div>
                </CardContent>
             </Card>
          </main>
        </div>
      </div>
    </>
  );
}
