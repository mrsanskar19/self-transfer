"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, File as FileIcon, Download, Trash2, AlertCircle, Copy, MessageSquareText, Shield, Paperclip, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserFile {
  name: string;
  url: string;
  shareableUrl: string;
  uploadedAt: string;
  deviceInfo: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [userFile, setUserFile] = useState<UserFile | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const storedFile = localStorage.getItem("ephemeral-file");
    if (storedFile) {
      const fileData: UserFile = JSON.parse(storedFile);
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - new Date(fileData.uploadedAt).getTime() > oneHour) {
        toast({
          title: "File Expired",
          description: "Your file was older than 1 hour and has been deleted.",
          variant: "destructive"
        });
        localStorage.removeItem("ephemeral-file");
        setUserFile(null);
      } else {
        setUserFile(fileData);
      }
    }
    setIsLoadingFile(false);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  const handleFileTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 99) {
          clearInterval(progressInterval);
          return 99;
        }
        return prev + 20;
      });
    }, 100);

    // Fake delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    clearInterval(progressInterval);
    setUploadProgress(100);
    
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);

    const shareableUrl = `${window.location.origin}/shared/${btoa(file.name)}`;

    const newFileData = {
      name: file.name,
      url: objectUrl,
      shareableUrl: shareableUrl,
      uploadedAt: new Date().toISOString(),
      deviceInfo: navigator.userAgent,
    };

    localStorage.setItem("ephemeral-file", JSON.stringify(newFileData));
    setUserFile(newFileData);
    
    setIsUploading(false);
    setFile(null);
    toast({ title: "Success", description: "Your file is now in the vault." });
  };
  
  const handleDownload = async () => {
    if (!userFile) return;

    const link = document.createElement('a');
    link.href = userFile.url;
    link.setAttribute('download', userFile.name);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    
    toast({ title: "Downloaded", description: "File downloaded. It will now be deleted." });
    
    await handleDelete();
  };

  const handleDelete = async () => {
    if (!userFile) return;
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    localStorage.removeItem("ephemeral-file");
    setUserFile(null);
    if(fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }

    setIsDeleting(false);
    toast({ title: "File Deleted", description: "Your file has been successfully deleted." });
  };

  const handleCopyToClipboard = () => {
    if (!userFile) return;
    navigator.clipboard.writeText(userFile.shareableUrl).then(() => {
      toast({ title: "Copied!", description: "Shareable link copied to clipboard." });
    });
  };

  const handleShareViaText = () => {
    if (!userFile) return;
    const message = `Here is the file you requested: ${userFile.shareableUrl}`;
    const smsLink = `sms:?&body=${encodeURIComponent(message)}`;
    window.location.href = smsLink;
  };
  
  const getInitials = (name: string) => name?.[0]?.toUpperCase() ?? 'U';


  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-card">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Ephemeral Vault</h1>
        <p className="text-sm text-muted-foreground">Your temporary file messenger</p>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {isLoadingFile ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : userFile ? (
            <>
              {/* User's Message (Uploaded File) */}
              <div className="flex justify-end items-end gap-3">
                 <div className="max-w-xs lg:max-w-md p-4 rounded-lg rounded-br-none bg-primary text-primary-foreground">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-6 w-6 flex-shrink-0" />
                      <p className="font-medium truncate" title={userFile.name}>{userFile.name}</p>
                    </div>
                </div>
                <Avatar>
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                </Avatar>
              </div>

              {/* Vault's Reply */}
              <div className="flex justify-start items-end gap-3">
                 <Avatar>
                    <AvatarFallback><Shield className="h-5 w-5"/></AvatarFallback>
                </Avatar>
                <div className="max-w-xs lg:max-w-md space-y-4">
                  <div className="p-4 rounded-lg rounded-bl-none bg-muted">
                    <p className="font-semibold text-sm mb-2">File Secured in Vault!</p>
                    <p className="text-xs text-muted-foreground">
                      Expires at: {new Date(new Date(userFile.uploadedAt).getTime() + 60 * 60 * 1000).toLocaleTimeString()}
                    </p>
                    <div className="mt-4 p-2 border rounded-md bg-background/50 text-xs flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                       <p className="truncate text-muted-foreground" title={userFile.deviceInfo}>
                        From: {userFile.deviceInfo}
                       </p>
                    </div>
                  </div>
                  <Card className="bg-muted">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <Label htmlFor="share-link" className="text-xs">Shareable Link</Label>
                        <div className="flex gap-2 mt-1">
                          <Input id="share-link" type="text" readOnly value={userFile.shareableUrl} className="bg-background h-9"/>
                          <Button variant="outline" size="icon" onClick={handleCopyToClipboard} title="Copy Link" className="h-9 w-9">
                            <Copy className="h-4 w-4" />
                          </Button>
                           <Button variant="outline" size="icon" onClick={handleShareViaText} title="Share via Text" className="h-9 w-9">
                            <MessageSquareText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleDownload} size="sm">
                          <Download className="mr-2" />
                          Download
                        </Button>
                        <Button onClick={handleDelete} variant="destructive" size="sm" disabled={isDeleting}>
                          {isDeleting ? <Loader2 className="mr-2 animate-spin" /> : <Trash2 className="mr-2" />}
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-full">
                <Alert className="max-w-md text-center">
                  <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                  <AlertTitle>Vault is Empty</AlertTitle>
                  <AlertDescription>
                    Use the input below to upload a file.
                  </AlertDescription>
                </Alert>
            </div>
        )}
      </main>
      
      <footer className="p-4 border-t bg-background">
          {isUploading && (
             <div className="mb-2">
                <Progress value={uploadProgress} className="w-full h-2" />
             </div>
           )}
          <div className="relative">
            <Input 
              type="text" 
              readOnly 
              placeholder={file ? file.name : "Select a file to send..."} 
              className="pr-20"
              onClick={handleFileTrigger}
            />
            <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleFileTrigger} disabled={isUploading}>
                <Paperclip className="h-5 w-5"/>
              </Button>
              <Button onClick={handleUpload} disabled={!file || isUploading} size="icon">
                {isUploading ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5"/>}
              </Button>
            </div>
          </div>
      </footer>
    </div>
  );
}
