import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { uploadService } from "@/services/uploadService";
import { SportType, Activity } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp, CheckCircle, AlertCircle, BarChart3, Bike, Footprints, Dumbbell, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const sportOptions: { value: SportType; label: string; icon: typeof Bike }[] = [
  { value: "cycling", label: "Cycling", icon: Bike },
  { value: "running", label: "Running", icon: Footprints },
  { value: "other", label: "Other", icon: Dumbbell },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sportType, setSportType] = useState<SportType>("cycling");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".gpx")) {
      setError("Only .gpx files are accepted.");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const activity = await uploadService.uploadGPX(file, sportType, setProgress);
      setResult(activity);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Upload GPX</h1>
            <p className="text-sm text-slate-500">Drag & drop or select your GPX file to analyze.</p>
          </div>

          {result ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-surface rounded-xl p-8 text-center">
              <div className="stat-icon-bg bg-success/10 mx-auto mb-4">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-slate-900">Upload Complete!</h2>
              <p className="text-sm text-slate-600 mb-1">{result.name}</p>
              <p className="text-xs text-slate-500 mb-6">{result.distance} km · {Math.floor(result.duration / 60)} min · {result.sportType}</p>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link to={`/activity/${result.id}`}><BarChart3 className="h-4 w-4 mr-2" /> Open Activity Analysis</Link>
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "glass-surface rounded-xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-300",
                  dragOver ? "border-accent bg-accent/5 scale-[1.01]" : "border-border hover:border-accent/50"
                )}
              >
                <motion.div animate={dragOver ? { y: -4 } : { y: 0 }} transition={{ type: "spring", stiffness: 300 }}>
                  <FileUp className={cn("h-12 w-12 mx-auto mb-4 transition-colors", dragOver ? "text-accent" : "text-muted-foreground")} />
                </motion.div>
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="stat-icon-bg h-9 w-9 bg-accent/10 rounded-lg">
                      <File className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-800">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1 text-slate-800">Drop your .gpx file here</p>
                    <p className="text-xs text-slate-500">or click to browse</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".gpx" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              {/* Sport type toggle */}
              <div>
                <p className="text-sm font-medium mb-3 text-slate-800">Sport Type</p>
                <div className="flex gap-2">
                  {sportOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSportType(opt.value)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all border",
                        sportType === opt.value
                          ? "bg-accent/10 border-accent/30 text-accent"
                          : "glass-surface text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <opt.icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{progress}% uploaded</p>
                </div>
              )}

              <Button onClick={handleUpload} disabled={!file || uploading} className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                <Upload className="h-4 w-4 mr-2" /> {uploading ? `Uploading ${progress}%` : "Upload & Analyze"}
              </Button>
            </>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
