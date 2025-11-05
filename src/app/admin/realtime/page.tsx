
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export default function RealtimeAdminPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Real-time Monitoring</h1>
      </div>
      <div className="flex flex-1 rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col w-full">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
              <CardHeader>
                <CardTitle>Live Data Transfer</CardTitle>
                <CardDescription>
                  Monitoring Server-Sent Events (SSE) connections for real-time updates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <Activity className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">1 Active Client</p>
                    <p className="text-sm text-muted-foreground">This is a placeholder value.</p>
                  </div>
                </div>
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Connected Since</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Client-ABC-123</TableCell>
                        <TableCell>
                           <Badge className="text-xs" variant="outline">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Connected
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date().toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}
