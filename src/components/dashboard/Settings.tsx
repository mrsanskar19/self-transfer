
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, DeviceInfo } from "@/lib/types";
import { Monitor } from "lucide-react";

interface SettingsPageProps {
    messages: Message[];
}

export default function SettingsPage({ messages }: SettingsPageProps) {

    // Get unique devices from messages
    const getActiveDevices = (): DeviceInfo[] => {
        const devices = new Map<string, DeviceInfo>();
        messages.forEach(msg => {
            if (msg.deviceInfo) {
                // Create a unique key from IP and UserAgent
                const deviceKey = `${msg.deviceInfo.ip}-${msg.deviceInfo.userAgent}`;
                if (!devices.has(deviceKey)) {
                    devices.set(deviceKey, msg.deviceInfo);
                }
            }
        });
        return Array.from(devices.values());
    }

    const activeDevices = getActiveDevices();

    return (
        <>
            <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
                <SheetDescription>
                    Manage your Ephemeral Vault preferences and view active devices.
                </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold">Active Devices</h3>
                <p className="text-sm text-muted-foreground">
                    List of unique devices that have sent messages in this session.
                </p>
                <ScrollArea className="h-64 border rounded-md">
                    <div className="p-4 space-y-4">
                        {activeDevices.length > 0 ? (
                            activeDevices.map((device, index) => (
                                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Monitor className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="font-semibold truncate text-sm">IP: {device.ip.replace('::ffff:', '')}</p>
                                            <p className="text-xs text-muted-foreground truncate">{device.userAgent}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">No active devices detected yet.</p>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </>
    )
}
