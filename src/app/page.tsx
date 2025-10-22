import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CheckCircle, Clock, Download, ShieldCheck, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const heroImage = PlaceHolderImages.find(p => p.id === 'hero-vault');

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative w-full py-20 md:py-32 lg:py-40 flex items-center justify-center text-center bg-card">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover z-0 opacity-10"
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="container px-4 md:px-6 z-10">
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
              Ephemeral Vault
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Your secure space for temporary files. Upload, share, and watch them disappear.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/signup">Get Started for Free</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-center sm:text-4xl md:text-5xl mb-12">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <UploadCloud className="w-8 h-8 text-primary" />
                <CardTitle>Secure Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Easily upload your file. Each user has a single, private slot—a new upload replaces the old one.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Clock className="w-8 h-8 text-primary" />
                <CardTitle>Auto-Deletion</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Your file is automatically deleted after 1 hour or immediately after it's downloaded. No manual cleanup needed.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <CardTitle>Private by Default</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Only you can access your file through your account. Files are never public.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="w-full py-6 mt-auto bg-card">
        <div className="container flex items-center justify-center px-4 md:px-6">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Ephemeral Vault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
