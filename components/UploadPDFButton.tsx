// components/UploadPDFButton.tsx
"use client";
import { useState } from "react";
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import { AiOutlinePlus } from "react-icons/ai"; // Import the Plus icon from react-icons
import { ClipLoader } from "react-spinners"; // For loader animation


export function UploadPDFButton({ onUploadAction }: { onUploadAction: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Selected file:", file.name, "Size:", file.size, "Type:", file.type);

    // Validate file type
    if (file.type !== "application/pdf") {
      setMessage("❌ Only PDF files are allowed.");
      console.warn("File rejected: Not a PDF.");
      return;
    }

    // Validate file size (25 MB = 25 * 1024 * 1024 bytes)
    if (file.size > 25 * 1024 * 1024) {
      setMessage("❌ File size exceeds 25MB limit.");
      console.warn("File rejected: Exceeds size limit.");
      return;
    }

    // Validate encryption
    try {
      console.log("Checking for encryption...");
      const arrayBuffer = await file.arrayBuffer();
      await PDFDocument.load(arrayBuffer, { ignoreEncryption: true }); // Load with ignoreEncryption to avoid errors
      console.log("Attempting to load PDF...");
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      if (pdfDoc.isEncrypted) {
        setMessage("❌ Encrypted PDFs are not allowed12345.");
        console.warn("File rejected: PDF is encrypted12345.");
        return;
      }
      console.log("PDF is valid and not encrypted.");
    } catch (error: unknown) {
      console.error("Error encountered while reading PDF:", error);
      if (error instanceof Error) {
        if (error.message.includes("encrypted")) {
          setMessage("❌ Encrypted PDFs are not allowed8787.");
          console.warn("File rejected: PDF is encrypted.8787");
        } else {
          setMessage("❌ Invalid PDF file.");
          console.error("Error reading PDF:", error);
        }
        return;
      }
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setMessage("");

    console.log("Uploading file to server...");

    axios.post('http://192.168.0.95:5001/upload_pdf', formData)
      .then(response => {
        console.log("Upload successful:", response.data);
        setMessage("✅ File uploaded successfully.");
        setUploading(false);
        setUploaded(true);
        onUploadAction();
      })
      .catch(error => {
        console.error("Error uploading file:", error);
        setMessage("❌ Upload failed.");
        setUploading(false);
      });
  };

return (
  <div className="flex flex-col items-center">
    <label className="cursor-pointer flex flex-col items-center">
      <div 
        className={`relative flex items-center justify-center w-10 h-10 ${
          uploaded ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
        } text-white rounded-full transition-colors`}
      >
        <AiOutlinePlus size={34} /> {/* Plus icon */}
        {uploading && <ClipLoader size={24} color="#ffffff" className="absolute" />} {/* Loader */}
      </div>
      <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} hidden />
    </label>

    {message && <p className="mt-2 text-sm">{message}</p>} {/* Message display */}
  </div>
);

  // return (
  //   <div className="my-4 flex flex-col items-center">
  //     <label className="cursor-pointer flex flex-col items-center">
  //       <div className="relative flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700">
  //         <AiOutlinePlus size={34} /> {/* Plus icon */}
  //         {uploading && <ClipLoader size={24} color="#ffffff" className="absolute" />} {/* Loader */}
  //       </div>
  //       <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} hidden />
  //     </label>
  //     {uploading && <p className="mt-2 text-sm">Uploading...</p>}
  //     {uploaded && <p className="mt-2 text-sm">Uploaded</p>}
  //     {message && <p className="mt-2 text-sm">{message}</p>}

  //   </div>
  // );
  // return (
  //   <div className="my-4 flex flex-col items-center">
  //     <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
  //       {uploading ? "Uploading..." : "Upload PDF"}
  //       <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} hidden />
  //     </label>
  //     {message && <p className="mt-2 text-sm">{message}</p>}
  //   </div>
  // );
}
