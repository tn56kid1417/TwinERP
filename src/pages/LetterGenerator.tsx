import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Download, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const LetterGenerator = () => {
  const { user, canEdit } = useAuth();

  const [letterType, setLetterType] = useState<'offer' | 'completion'>('offer');
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTemplate = async () => {
      const storedDataUrl = localStorage.getItem(`template_${letterType}`);
      const storedName = localStorage.getItem(`template_name_${letterType}`);
      
      if (storedDataUrl && storedName) {
        try {
          const res = await fetch(storedDataUrl);
          const blob = await res.blob();
          const loadedFile = new File([blob], storedName, { type: blob.type });
          setFile(loadedFile);
        } catch (err) {
          console.error('Failed to load template from storage', err);
          setFile(null);
        }
      } else {
        setFile(null);
      }
    };
    
    loadTemplate();
  }, [letterType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.docx')) {
        setFile(selectedFile);
        setError('');
        setSuccess(false);

        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          try {
            localStorage.setItem(`template_${letterType}`, result);
            localStorage.setItem(`template_name_${letterType}`, selectedFile.name);
          } catch (err) {
            console.error('LocalStorage quota exceeded or other error', err);
            setError('Failed to save template to local storage. It may be too large.');
          }
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFile(null);
        setError('Please upload a valid .docx file.');
      }
    }
  };

  const handleRemoveTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    localStorage.removeItem(`template_${letterType}`);
    localStorage.removeItem(`template_name_${letterType}`);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a template file first.');
      return;
    }
    if (!name || !role) {
      setError('Please provide both name and role.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          if (!content) throw new Error("Could not read file");

          const zip = new PizZip(content as ArrayBuffer);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
          });

          // Render the document (replace {name} and {role} in the document)
          doc.render({
            name: name,
            role: role,
          });

          const out = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          });

          // Trigger file download
          const fileNamePrefix = letterType === 'offer' ? 'Offer' : 'Completion';
          saveAs(out, `${fileNamePrefix}_Letter_${name.replace(/\\s+/g, '_')}.docx`);
          setSuccess(true);
        } catch (err: any) {
          console.error("Error generating document:", err);
          setError('Failed to generate letter. Please ensure the template uses {name} and {role} correctly.');
        } finally {
          setIsGenerating(false);
        }
      };
      
      reader.onerror = () => {
        setError("Error reading the file.");
        setIsGenerating(false);
      };
      
      reader.readAsBinaryString(file);
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsGenerating(false);
    }
  };

  if (!canEdit) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Letter Generator</h1>
        <p className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-sm">
          Upload a .docx template containing <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-300">{`{name}`}</code> and <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-300">{`{role}`}</code> placeholders to generate custom letters.
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setLetterType('offer')}
          className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-all ${
            letterType === 'offer'
              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
              : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Offer Letter
        </button>
        <button
          onClick={() => setLetterType('completion')}
          className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-all ${
            letterType === 'completion'
              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
              : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Completion Letter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-6 overflow-hidden flex flex-col items-center justify-center min-h-[300px] shadow-lg shadow-slate-200/50 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/5">
          <input
            type="file"
            accept=".docx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            title="Upload Template"
          />
          
          {file && (
            <button
              onClick={handleRemoveTemplate}
              className="absolute top-4 right-4 z-20 p-2 bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-colors pointer-events-auto"
              title="Remove Template"
            >
              <Trash2 size={18} />
            </button>
          )}

          <div className="flex flex-col items-center justify-center text-center space-y-4 pointer-events-none z-0">
            {file ? (
              <>
                <div className="w-16 h-16 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/15">
                  <FileText size={32} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <div className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">Click or drag to replace template</div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700/60 transition-colors">
                  <UploadCloud size={32} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Upload Template</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select a .docx file to use as a template</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/40 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Candidate Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner"
                required
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Role / Position
              </label>
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner"
                required
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Letter generated and downloaded successfully!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating || !file || !name || !role}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer text-xs uppercase tracking-wider"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {isGenerating ? 'Generating...' : 'Generate & Download Letter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LetterGenerator;
