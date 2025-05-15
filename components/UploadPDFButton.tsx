// components/UploadPDFButton.tsx
"use client";
import { useState } from "react";
import axios from 'axios';


export function UploadPDFButton() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setMessage("");
    axios.post('http://localhost:5001/upload_pdf', formData)
      .then(response => {
        console.log(response.data);  // Success
        setMessage("✅ File uploaded successfully.");
        setUploading(false);
      })
      .catch(error => {
        console.error('Error uploading file:', error);
        setMessage("❌ Upload failed.");
        setUploading(false);
      });

  };

  return (
    <div className="my-4 flex flex-col items-center">
      <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
        {uploading ? "Uploading..." : "Upload PDF"}
        <input type="file" accept="application/pdf" onChange={handleUpload} hidden />
      </label>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
