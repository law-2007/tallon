"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  isUploading?: boolean
}

export function FileUpload({ onFileSelect, isUploading = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setSelectedFile(file)
      onFileSelect(file)
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer",
          isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50",
          selectedFile ? "border-primary/20 bg-background" : ""
        )}
        {...getRootProps()}
      >
        <CardContent className="flex flex-col items-center justify-center p-12 text-center h-64">
          <input {...getInputProps()} />

          {selectedFile ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="relative mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <File className="w-8 h-8 text-primary" />
                </div>
                {!isUploading && (
                  <button
                    onClick={removeFile}
                    className="absolute -top-2 -right-2 p-1 bg-destructive/90 text-destructive-foreground rounded-full hover:bg-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-lg font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {isUploading && (
                <div className="w-full max-w-xs mt-6 space-y-2">
                  <Progress value={45} className="h-2" />
                  <p className="text-xs text-muted-foreground">Processing file...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className={cn(
                  "p-4 rounded-full transition-colors duration-300",
                  isDragActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                )}
              >
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">
                  {isDragActive ? "Drop it here!" : "Upload your materials"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag & drop PDFs, Images, DOCX, or TXT
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedFile && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          Supported formats: PDF, PNG, JPG, DOCX, TXT (Max 50MB)
        </p>
      )}
    </div>
  )
}
