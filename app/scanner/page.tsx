"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, FileDown, RefreshCcw, Image as ImageIcon, Check, X, Printer } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [filter, setFilter] = useState<"original" | "magic" | "bw" | "grayscale">("original");

  // Form Data
  const [fileName, setFileName] = useState("");
  const [personName, setPersonName] = useState("");

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 3840 }, height: { ideal: 2160 } } // 4K ideal
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("تعذر الوصول للكاميرا. تأكد من السماح بالوصول.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL("image/jpeg", 1.0); // High quality
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }
  }, [stream]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setCapturedImage(event.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const generatePDF = () => {
    if (!capturedImage) return;
    if (!fileName || !personName) {
        toast.error("يرجى إدخال اسم الملف واسم الشخص");
        return;
    }

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // A4 Size: 210 x 297 mm
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;

      // Add Header Info
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(`File: ${fileName}`, margin, 20);
      pdf.text(`Person: ${personName}`, margin, 30);
      pdf.setFontSize(10);
      pdf.text(`Scanned: ${new Date().toLocaleDateString()}`, margin, 38);

      // Process Image with filters before adding to PDF
      const img = new Image();
      img.src = capturedImage;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;

        // Apply filters directly to canvas pixel data (simulating CSS filters for the PDF export)
        // Note: CSS filters on the <img> tag don't automatically transfer to the canvas data used by jsPDF.
        // We need to either use a library or just raw draw for now.
        // For simplicity in this demo, we draw the original. 
        // Real implementation of specific "Magic" filters in canvas requires pixel manipulation (CamanJS or similar).
        // For now, we will assume the visual feedback is enough, but to make the PDF look like the filter, we'd need pixel manipulation.
        // Let's rely on standard image for now, but I will add CSS filters to the PREVIEW.
        
        // However, user specifically asked for "High accuracy color".
        // Let's try to mimic basic brightness/contrast if filter is active.
        
        ctx.filter = getCanvasFilterString(filter);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const processedImage = canvas.toDataURL("image/jpeg", 0.9);

        // Calculate aspect ratio to fit A4
        const imgRatio = img.width / img.height;
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - 50; // Space for header
        
        let printWidth = availableWidth;
        let printHeight = printWidth / imgRatio;

        if (printHeight > availableHeight) {
            printHeight = availableHeight;
            printWidth = printHeight * imgRatio;
        }

        pdf.addImage(processedImage, "JPEG", margin, 45, printWidth, printHeight);
        pdf.save(`${fileName}_${personName}.pdf`);
        toast.success("تم إنشاء ملف PDF بنجاح!");
      };

    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء إنشاء PDF");
    }
  };

  const getCanvasFilterString = (f: string) => {
      switch(f) {
          case 'bw': return 'grayscale(100%) contrast(150%) brightness(110%)'; // Sharp B&W
          case 'grayscale': return 'grayscale(100%)';
          case 'magic': return 'saturate(130%) contrast(110%) brightness(105%)'; // Vivid colors
          default: return 'none';
      }
  };

  const getFilterStyle = () => {
      switch(filter) {
          case 'bw': return { filter: 'grayscale(100%) contrast(150%) brightness(110%)' };
          case 'grayscale': return { filter: 'grayscale(100%)' };
          case 'magic': return { filter: 'saturate(130%) contrast(110%) brightness(105%)' };
          default: return {};
      }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl min-h-screen flex flex-col gap-6" dir="rtl">
        <div className="flex flex-col space-y-2 text-center md:text-right">
            <h1 className="text-3xl font-bold tracking-tight">ماسح المستندات الذكي</h1>
            <p className="text-muted-foreground">قم بمسح المستندات ضوئياً وحفظها بجودة A4 عالية.</p>
        </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>بيانات الملف</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">اسم الملف</label>
                    <Input 
                        placeholder="مثال: فاتورة كهرباء" 
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">اسم الشخص</label>
                    <Input 
                        placeholder="مثال: أمير" 
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>
        
        <Card className="flex flex-col justify-center items-center p-6 border-dashed">
             {!capturedImage && !isCameraOpen && (
                 <div className="text-center space-y-4">
                     <Button size="lg" onClick={startCamera} className="w-full">
                         <Camera className="ml-2 h-4 w-4" />
                         فتح الكاميرا
                     </Button>
                     <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">أو</span>
                        </div>
                     </div>
                     <div className="flex justify-center">
                         <label className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                            <ImageIcon className="ml-2 h-4 w-4" />
                            رفع صورة
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                         </label>
                     </div>
                 </div>
             )}

             {isCameraOpen && (
                 <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden">
                     <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                     <Button 
                        size="icon" 
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full border-4 border-white"
                        onClick={capturePhoto}
                     >
                        <span className="sr-only">التقاط</span>
                     </Button>
                 </div>
             )}

             {capturedImage && (
                 <div className="space-y-4 w-full">
                     <div className="relative w-full aspect-[210/297] bg-gray-100 rounded-lg overflow-hidden border shadow-sm">
                         {/* Preview with applied styles */}
                         <img src={capturedImage} alt="Scanned" className="w-full h-full object-contain" style={getFilterStyle()} />
                     </div>
                     <div className="flex justify-center gap-2">
                         <Button variant="outline" size="sm" onClick={() => setCapturedImage(null)}>
                             <RefreshCcw className="ml-2 h-4 w-4" />
                             إعادة
                         </Button>
                     </div>
                 </div>
             )}
        </Card>
      </div>

      {capturedImage && (
         <Card>
             <CardHeader>
                 <CardTitle>خيارات المعالجة والحفظ</CardTitle>
                 <CardDescription>اختر الفلتر المناسب لتحسين جودة الصورة</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                        variant={filter === 'original' ? "default" : "outline"} 
                        className="h-20 flex-col gap-2"
                        onClick={() => setFilter('original')}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-blue-400" />
                        أصلي
                    </Button>
                    <Button 
                        variant={filter === 'magic' ? "default" : "outline"}
                        className="h-20 flex-col gap-2"
                        onClick={() => setFilter('magic')}
                    >
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-yellow-400 shadow-[0_0_10px_rgba(0,0,0,0.2)]" />
                        ألوان سحرية
                    </Button>
                    <Button 
                        variant={filter === 'bw' ? "default" : "outline"}
                        className="h-20 flex-col gap-2"
                        onClick={() => setFilter('bw')}
                    >
                         <div className="w-8 h-8 rounded-full bg-black border border-white" />
                        أبيض وأسود
                    </Button>
                     <Button 
                        variant={filter === 'grayscale' ? "default" : "outline"}
                        className="h-20 flex-col gap-2"
                        onClick={() => setFilter('grayscale')}
                    >
                         <div className="w-8 h-8 rounded-full bg-gray-500" />
                        رمادي
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                    <Button size="lg" className="w-full sm:w-auto flex-1 gap-2" onClick={generatePDF}>
                        <FileDown className="h-5 w-5" />
                        حفظ كـ PDF (A4)
                    </Button>
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto flex-1 gap-2" onClick={() => window.print()}>
                        <Printer className="h-5 w-5" />
                        طباعة مباشرة
                    </Button>
                </div>
             </CardContent>
         </Card>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
