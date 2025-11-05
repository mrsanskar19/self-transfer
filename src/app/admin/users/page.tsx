
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User, Mail, Loader2 } from "lucide-react";
import { User as UserType } from "@/lib/types";

async function getUsers(): Promise<UserType[]> {
    const response = await fetch('/api/users');
    if (!response.ok) {
        console.error('Failed to fetch users');
        return [];
    }
    return response.json();
}

export default function UsersAdminPage() {
    const [users, setUsers] = useState<UserType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

    useEffect(() => {
        getUsers().then(data => {
            setUsers(data);
            setIsLoading(false);
        });
    }, []);

    if (selectedUser) {
        return <UserDetailPage user={selectedUser} onBack={() => setSelectedUser(null)} />;
    }

    return (
        <>
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Users</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                        A list of all registered users in the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Logged-in Devices</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.username}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>{user.email || 'Not Provided'}</TableCell>
                                        <TableCell>{user.loginedDevices?.length || 0}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

function UserDetailPage({ user, onBack }: { user: UserType, onBack: () => void }) {
    return (
        <>
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={onBack}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    {user.username}
                </h1>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Login Devices</CardTitle>
                            <CardDescription>
                                Devices this user has logged in from.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>User Agent</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {user.loginedDevices && user.loginedDevices.length > 0 ? (
                                        user.loginedDevices.map((device, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{device.ip.replace('::ffff:', '')}</TableCell>
                                                <TableCell className="truncate">{device.userAgent}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center">No devices logged.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-muted-foreground"/>
                                <span className="font-semibold">{user.name || 'Sample User'}</span>
                           </div>
                           <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground"/>
                                <span className="text-muted-foreground">{user.email || 'sample@example.com'}</span>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
