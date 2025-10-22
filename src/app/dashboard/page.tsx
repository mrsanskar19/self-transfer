"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, File as FileIcon, Download, Trash2, AlertCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface UserFile {
  name: string;
  url: string;
  shareableUrl: string;
  uploadedAt: string;
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setFileUrl(url);
      handleUpload(selectedFile, url);
    }
  };

  const handleUpload = async (selectedFile: File, objectUrl: string) => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 99) {
          clearInterval(progressInterval);
          return 99;
        }
        return prev + 10;
      });
    }, 100);

    await new Promise(resolve => setTimeout(resolve, 1000));
    clearInterval(progressInterval);
    setUploadProgress(100);

    const shareableUrl = `${window.location.origin}/shared/${btoa(selectedFile.name)}`;

    const newFileData = {
      name: selectedFile.name,
      url: objectUrl,
      shareableUrl: shareableUrl,
      uploadedAt: new Date().toISOString(),
    };

    localStorage.setItem("ephemeral-file", JSON.stringify(newFileData));
    setUserFile(newFileData);
    
    setIsUploading(false);
    setFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    toast({ title: "Success", description: "Your file has been uploaded." });
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

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to your Vault</h1>
        <p className="text-muted-foreground">Manage your ephemeral file below. It will be deleted after 1 hour or 1 download.</p>
      </header>

      <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="text-primary"/>
              Upload File
            </CardTitle>
            <CardDescription>Upload a new file to your vault. Any existing file will be replaced.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input type="file" onChange={handleFileChange} disabled={isUploading} ref={fileInputRef} />
             {isUploading && (
              <div className="mt-4 space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your File</CardTitle>
          <CardDescription>The file currently stored in your vault.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFile ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading file info...</span>
            </div>
          ) : userFile ? (
            <div className="space-y-4">
              <div className="flex items-center p-4 border rounded-md bg-background/50">
                <FileIcon className="h-8 w-8 mr-4 text-primary" />
                <div className="flex-grow min-w-0">
                  <p className="font-medium truncate" title={userFile.name}>{userFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant="outline">Expires at: {new Date(new Date(userFile.uploadedAt).getTime() + 60 * 60 * 1000).toLocaleTimeString()}</Badge>
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                 <Label htmlFor="share-link">Shareable Link</Label>
                 <div className="flex gap-2">
                    <Input id="share-link" type="text" readOnly value={userFile.shareableUrl} className="bg-muted"/>
                    <Button variant="outline" size="icon" onClick={handleCopyToClipboard}>
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy link</span>
                    </Button>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button onClick={handleDownload} className="w-full">
                  <Download className="mr-2" />
                  Download & Delete
                </Button>
                <Button onClick={handleDelete} variant="destructive" className="w-full" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="mr-2 animate-spin" /> : <Trash2 className="mr-2" />}
                  Delete Now
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Your vault is empty</AlertTitle>
              <AlertDescription>
                Upload a file to get started. It will appear here.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
