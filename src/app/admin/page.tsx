
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, CreditCard, HardDrive, Users } from "lucide-react";
import { User } from "@/lib/types";

async function getUserCount(): Promise<number> {
    const response = await fetch('/api/users');
    if (!response.ok) {
        return 0;
    }
    const users: User[] = await response.json();
    return users.length;
}

export default function AdminDashboardPage() {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    getUserCount().then(setUserCount);
  }, []);
    
  return (
    <>
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Admin Dashboard</h1>
        </div>
        <div
            className="flex flex-1 rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
        >
          <div className="flex flex-col w-full">
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
              <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userCount}</div>
                    <p className="text-xs text-muted-foreground">
                      total users in the system
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Storage Used
                    </CardTitle>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">~5 MB</div>
                    <p className="text-xs text-muted-foreground">
                      out of 2 GB limit (conceptual)
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Real-time Connections</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1</div>
                    <p className="text-xs text-muted-foreground">
                      active SSE clients (conceptual)
                    </p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Security Status
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Protected</div>
                     <p className="text-xs text-muted-foreground">
                      via local JSON DB
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Overview of system health and services for this prototype.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Authentication</TableCell>
                        <TableCell>
                          <Badge className="text-xs" variant="outline">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Operational
                          </Badge>
                        </TableCell>
                        <TableCell>JSON file-based auth is running.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Database</TableCell>
                        <TableCell>
                           <Badge className="text-xs" variant="outline">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Operational
                          </Badge>
                        </TableCell>
                        <TableCell>Using `data/db.json` as the data source.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Real-time Events (SSE)</TableCell>
                        <TableCell>
                           <Badge className="text-xs" variant="outline">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Operational
                          </Badge>
                        </TableCell>
                        <TableCell>SSE client connections are stable.</TableCell>
                      </TableRow>
                       <TableRow>
                        <TableCell>Storage Subsystem</TableCell>
                        <TableCell>
                           <Badge className="text-xs" variant="outline">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                            </span>
                            Conceptual
                          </Badge>
                        </TableCell>
                        <TableCell>Files stored as base64 strings in `db.json`.</TableCell>
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
