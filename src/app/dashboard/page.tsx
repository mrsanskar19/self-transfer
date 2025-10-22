"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, File, Download, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserFile {
  name: string;
  url: string;
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
    // Clean up object URL on component unmount
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
      // Create a URL for the file to be "downloaded"
      const url = URL.createObjectURL(selectedFile);
      setFileUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newFileData = {
      name: file.name,
      url: fileUrl!,
      uploadedAt: new Date().toISOString(),
    };

    localStorage.setItem("ephemeral-file", JSON.stringify(newFileData));
    setUserFile(newFileData);
    
    setIsUploading(false);
    toast({ title: "Success", description: "Your file has been 'uploaded'." });
  };

  const handleDownload = async () => {
    if (!userFile) return;

    // The 'url' is an object URL, we can trigger download with an anchor tag
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
      setFile(null);
    }

    setIsDeleting(false);
    toast({ title: "File Deleted", description: "Your file has been successfully deleted." });
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-2">Welcome to your Vault</h1>
      <p className="text-muted-foreground mb-8">Manage your ephemeral file below.</p>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload New File</CardTitle>
            <CardDescription>Upload a file to your vault. Any existing file will be replaced.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" onChange={handleFileChange} disabled={isUploading} />
            {isUploading ? (
              <p className="text-sm text-center">Uploading...</p>
            ) : (
              <Button onClick={handleUpload} disabled={!file} className="w-full">
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload File
              </Button>
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
                <div className="flex items-center p-4 border rounded-md bg-background">
                  <File className="h-6 w-6 mr-4 text-primary" />
                  <div className="flex-grow">
                    <p className="font-medium truncate">{userFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires at: {new Date(new Date(userFile.uploadedAt).getTime() + 60 * 60 * 1000).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button onClick={handleDelete} variant="destructive" className="flex-1" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete Now
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No File Found</AlertTitle>
                <AlertDescription>
                  Your vault is empty. Upload a file to get started.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
