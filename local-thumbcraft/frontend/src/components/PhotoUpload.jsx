import { useState, useRef, useCallback } from 'react';
import useUIStore from '../stores/uiStore';
import { ArrowLeft, ArrowRight, Upload, X, User, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const PhotoUpload = () => {
  const { setCurrentStep, setFacePhoto, clearFacePhoto, facePhoto, resetFlow } = useUIStore();
  const [preview, setPreview] = useState(facePhoto ? URL.createObjectURL(facePhoto) : null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large — maximum 10 MB.');
      return;
    }
    setError('');
    setFacePhoto(file);
    setPreview(URL.createObjectURL(file));
  }, [setFacePhoto]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = () => {
    clearFacePhoto();
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSkip = () => {
    clearFacePhoto();
    setPreview(null);
    setCurrentStep('questions');
  };

  const handleContinue = () => {
    setCurrentStep('questions');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => resetFlow()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-violet-200">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Add Your Photo</h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
            Your real face will appear in the thumbnail — exact features, skin tone, hair, and expression preserved by AI.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: '100% Face Fidelity', color: 'bg-green-50 text-green-700 border-green-200' },
            { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Powered by InstantID', color: 'bg-violet-50 text-violet-700 border-violet-200' },
            { icon: <Zap className="w-3.5 h-3.5" />, label: 'Single Photo Enough', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          ].map(({ icon, label, color }) => (
            <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${color}`}>
              {icon} {label}
            </span>
          ))}
        </div>

        {/* Upload area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !preview && fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden cursor-pointer
            ${isDragging ? 'border-violet-500 bg-violet-50 scale-[1.01]' : preview ? 'border-gray-200 bg-white cursor-default' : 'border-gray-300 bg-white hover:border-violet-400 hover:bg-violet-50/30'}`}
          style={{ minHeight: '280px' }}
        >
          {preview ? (
            /* ── Photo Preview ── */
            <div className="relative">
              <img
                src={preview}
                alt="Your face preview"
                className="w-full object-cover rounded-2xl"
                style={{ maxHeight: '360px', objectPosition: 'center top' }}
              />
              {/* Overlay buttons */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="bg-white text-gray-800 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors shadow-md"
                >
                  Change Photo
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-600 transition-colors shadow-md flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Remove
                </button>
              </div>
              {/* Success badge */}
              <div className="absolute top-3 left-3">
                <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Face Ready
                </span>
              </div>
            </div>
          ) : (
            /* ── Empty drop zone ── */
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-violet-100' : 'bg-gray-100'}`}>
                <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-violet-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">
                {isDragging ? 'Drop your photo here' : 'Drag & drop your photo here'}
              </p>
              <p className="text-sm text-gray-400 mb-4">or click to browse — JPG, PNG, WEBP up to 10 MB</p>
              <button
                type="button"
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-violet-200"
              >
                Choose Photo
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
            <X className="w-4 h-4" /> {error}
          </p>
        )}

        {/* Tips */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs text-amber-800 font-semibold mb-1">📸 For best results:</p>
          <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
            <li>Use a clear, front-facing photo with your face visible</li>
            <li>Good lighting improves identity preservation accuracy</li>
            <li>Avoid heavy filters or large sunglasses</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Skip — Generate Without Photo
          </button>
          <button
            onClick={handleContinue}
            disabled={!preview}
            className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl flex items-center transition-colors shadow-md shadow-violet-100"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        {!preview && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Upload a photo above to enable face-preserving generation, or skip to use the standard AI mode.
          </p>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;
