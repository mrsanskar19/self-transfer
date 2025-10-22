"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, File, Download, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage, db } from "@/lib/firebase/config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { deleteFile as deleteFileAction } from "@/app/actions";

interface UserFile {
  name: string;
  url: string;
  uploadedAt: Timestamp;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [userFile, setUserFile] = useState<UserFile | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUserFile = useCallback(async () => {
    if (!user) return;
    setIsLoadingFile(true);
    const fileDocRef = doc(db, "userFiles", user.uid);
    const docSnap = await getDoc(fileDocRef);

    if (docSnap.exists()) {
      const fileData = docSnap.data() as UserFile;
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - fileData.uploadedAt.toDate().getTime() > oneHour) {
        toast({
          title: "File Expired",
          description: "Your file was older than 1 hour and has been deleted.",
          variant: "destructive"
        });
        await deleteFileAction(user.uid, fileData.name);
        setUserFile(null);
      } else {
        setUserFile(fileData);
      }
    } else {
      setUserFile(null);
    }
    setIsLoadingFile(false);
  }, [user, toast]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserFile();
    }
  }, [user, fetchUserFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    const filePath = `user-files/${user.uid}/${file.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        setIsUploading(false);
        toast({ title: "Upload Error", description: error.message, variant: "destructive" });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const fileDocRef = doc(db, "userFiles", user.uid);
        const newFileData = {
          name: file.name,
          url: downloadURL,
          uploadedAt: serverTimestamp(),
        };
        await setDoc(fileDocRef, newFileData);
        
        // As setDoc does not return the resolved serverTimestamp, we fetch again
        await fetchUserFile();

        setIsUploading(false);
        setFile(null);
        toast({ title: "Success", description: "Your file has been uploaded." });
      }
    );
  };

  const handleDownload = async () => {
    if (!userFile || !user) return;
    
    // Open download link
    window.open(userFile.url, '_blank');

    toast({ title: "Downloaded", description: "File downloaded. It will now be deleted." });

    // Delete file after download
    await handleDelete();
  };
  
  const handleDelete = async () => {
    if (!userFile || !user) return;

    setIsDeleting(true);
    const result = await deleteFileAction(user.uid, userFile.name);
    if (result.success) {
      setUserFile(null);
      toast({ title: "File Deleted", description: "Your file has been successfully deleted." });
    } else {
      toast({ title: "Deletion Error", description: result.error, variant: "destructive" });
    }
    setIsDeleting(false);
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
              <Progress value={uploadProgress} className="w-full" />
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
                      Expires at: {new Date(userFile.uploadedAt.toDate().getTime() + 60 * 60 * 1000).toLocaleTimeString()}
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
