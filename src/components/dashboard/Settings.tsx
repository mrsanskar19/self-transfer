
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "../ui/switch";

export default function SettingsPage() {
    return (
        <>
            <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
                <SheetDescription>
                    Manage your Ephemeral Vault preferences.
                </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                        <span>Dark Mode</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Toggle the theme of the application.
                        </span>
                    </Label>
                    <Switch id="dark-mode" defaultChecked={true} disabled />
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="notifications" className="flex flex-col space-y-1">
                        <span>Push Notifications</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Enable to receive push notifications (feature coming soon).
                        </span>
                    </Label>
                    <Switch id="notifications" disabled />
                </div>
            </div>
        </>
    )
}
