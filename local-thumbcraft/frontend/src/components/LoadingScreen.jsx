import { useEffect, useState, useRef } from 'react';
import useUIStore from '../stores/uiStore';
import useImageStore from '../stores/imageStore';
import { Loader2, Info, User } from 'lucide-react';

const LoadingScreen = () => {
  const { prompt, answers, facePhoto, completeGeneration } = useUIStore();
  const { generateThumbnails, generateThumbnailsWithFace } = useImageStore();
  const [loadingText, setLoadingText] = useState(
    facePhoto ? 'Detecting face identity...' : 'Analyzing your prompt...'
  );
  const [progress, setProgress] = useState(5);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const hasGenerated = useRef(false);

  const faceSteps = [
    'Detecting face identity...',
    'Extracting facial landmarks...',
    'Generating creative concept...',
    'Applying style preferences...',
    'Merging face with thumbnail scene...',
    'Finalizing identity-preserved thumbnail...',
  ];

  const standardSteps = [
    'Analyzing your prompt...',
    'Generating creative concepts...',
    'Applying style preferences...',
    'Rendering thumbnails...',
    'Optimizing for YouTube...',
    'Finalizing your thumbnails...',
  ];

  const steps = facePhoto ? faceSteps : standardSteps;

  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        setIsTextVisible(false);
        setTimeout(() => {
          currentStep++;
          setLoadingText(steps[currentStep]);
          setProgress((currentStep / (steps.length - 1)) * 90);
          setIsTextVisible(true);
        }, 200);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;

    const go = async () => {
      const result = facePhoto
        ? await generateThumbnailsWithFace(prompt, answers, facePhoto)
        : await generateThumbnails(prompt, answers);

      if (result && result.success) {
        setProgress(100);
        setTimeout(() => completeGeneration(), 800);
      } else {
        hasGenerated.current = false;
        alert('Generation failed: ' + (result?.error || 'Unknown error. Please restart.'));
      }
    };
    go();
  }, []);

  const count = parseInt(answers.imageCount) || 1;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Creating Your Thumbnails</h2>
          <p className="text-lg text-gray-600">Our AI is working its magic to create stunning thumbnails just for you</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <p className={`text-xl font-semibold text-gray-900 mb-4 transition-opacity duration-200 ${isTextVisible ? 'opacity-100' : 'opacity-0'}`}>
            {loadingText}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div className="bg-blue-600 h-3 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
          <p className="text-sm text-gray-400 mt-2">This usually takes 20-60 seconds</p>
        </div>

        {/* Skeleton Grid */}
        <div className={`grid gap-6 ${count === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-2'}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="relative">
                <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                <div className="absolute top-3 left-3"><div className="w-16 h-6 bg-gray-300 rounded-full animate-pulse"></div></div>
                <div className="absolute top-3 right-3"><div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div></div>
              </div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-4 flex items-center justify-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" /> Did you know?
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Thumbnails with faces get 30% more clicks than those without</p>
            <p>• Bright colors perform better than dark ones on YouTube</p>
            <p>• Text should be readable even at small sizes</p>
            <p>• The best thumbnails tell a story in a single glance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
