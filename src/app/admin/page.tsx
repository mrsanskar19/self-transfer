"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Admin!</CardTitle>
          <CardDescription>
            This is the central place to manage your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p>Here you can monitor user activity, manage content, and oversee the application's health.</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
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
                  <span className="text-green-500 font-semibold">Operational</span>
                </TableCell>
                <TableCell>All systems running normally.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Database</TableCell>
                <TableCell>
                  <span className="text-green-500 font-semibold">Operational</span>
                </TableCell>
                <TableCell>Connected and responsive.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Real-time Events</TableCell>
                 <TableCell>
                  <span className="text-green-500 font-semibold">Operational</span>
                </TableCell>
                <TableCell>SSE client connections are stable.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
