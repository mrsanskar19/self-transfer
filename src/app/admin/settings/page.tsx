
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Bell, Trash2 } from "lucide-react";

export default function SettingsAdminPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Application Settings</h1>
      </div>
      <div className="flex flex-1 rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col w-full">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage application-wide security configurations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <Label htmlFor="e2ee-switch" className="flex flex-col space-y-1">
                      <span className="font-medium flex items-center gap-2"><ShieldCheck/> End-to-End Encryption (E2EE)</span>
                      <span className="text-xs text-muted-foreground">
                        When enabled, all messages are encrypted. This is a conceptual feature.
                      </span>
                    </Label>
                    <Switch id="e2ee-switch" disabled />
                </div>
                 <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <Label htmlFor="new-user-switch" className="flex flex-col space-y-1">
                      <span className="font-medium flex items-center gap-2"><UsersRound/> Allow New User Signups</span>
                      <span className="text-xs text-muted-foreground">
                        Control whether new users can register.
                      </span>
                    </Label>
                    <Switch id="new-user-switch" defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Manage stored application data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg bg-destructive/10 border-destructive/20">
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium flex items-center gap-2 text-destructive"><Trash2/> Purge All Data</span>
                      <span className="text-xs text-destructive/80">
                        This will permanently delete all users and messages. This action cannot be undone.
                      </span>
                    </div>
                    <Button variant="destructive">Purge Data</Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}
