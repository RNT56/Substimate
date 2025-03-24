import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

export function ImportDataPage() {
  const [dragActive, setDragActive] = useState(false);
  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    // TODO: Implement file processing
    console.log('Processing files:', files);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 title-gradient">Import Data</h1>
        <p className="text-theme-secondary">Import your financial data from bank statements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neumorphic-card rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-lg ${isBTC ? 'bg-[#f7931a]/10' : 'bg-emerald-500/10'}`}>
              <Upload 
                size={24} 
                className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'} 
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme-primary">Upload Files</h2>
              <p className="text-theme-secondary">Drag and drop or select files to upload</p>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept=".csv,.pdf,.ofx"
              onChange={handleFileInput}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer"
            >
              <FileText size={48} className="mx-auto mb-4 text-theme-secondary" />
              <p className="text-theme-primary font-medium mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-theme-secondary">
                Supports CSV, PDF, and OFX files
              </p>
            </label>
          </div>
        </div>

        <div className="neumorphic-card rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-lg ${isBTC ? 'bg-[#f7931a]/10' : 'bg-emerald-500/10'}`}>
              <AlertCircle 
                size={24} 
                className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'} 
              />
            </div>
            <h2 className="text-xl font-bold text-theme-primary">Supported Banks</h2>
          </div>

          <div className="space-y-4">
            <p className="text-theme-secondary">
              We currently support importing data from the following banks:
            </p>
            <ul className="list-disc list-inside space-y-2 text-theme-secondary">
              <li>Bank of America</li>
              <li>Chase</li>
              <li>Wells Fargo</li>
              <li>Citibank</li>
              <li>Capital One</li>
              <li>American Express</li>
              <li>Discover</li>
            </ul>
            <p className="text-theme-secondary mt-4">
              Don't see your bank? Let us know and we'll add support for it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}