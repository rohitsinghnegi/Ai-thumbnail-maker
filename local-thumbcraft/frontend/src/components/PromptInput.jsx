import { useState } from 'react';
import useUIStore from '../stores/uiStore';
import { ArrowLeft, ArrowRight, Lightbulb, Zap } from 'lucide-react';

const PromptInput = () => {
  const { prompt, setPrompt, setCurrentStep, resetFlow, startGeneration } = useUIStore();
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!prompt.trim()) { setError('Please enter a description for your thumbnail'); return; }
    setError('');
    setCurrentStep('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Skip questions — go straight to loading (LoadingScreen fires the API call)
  const handleSkip = () => {
    if (!prompt.trim()) { setError('Please enter a description to generate your thumbnail'); return; }
    setError('');
    startGeneration(); // directly to loading step
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => { resetFlow(); setCurrentStep('mode'); }} className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Options
        </button>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Describe Your Thumbnail</h2>
          <p className="text-lg text-gray-600">Tell us what kind of thumbnail you want to create</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-3">Thumbnail Description</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setError(''); }}
            className="w-full h-36 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
            placeholder="Describe your thumbnail idea... (e.g., 'A futuristic tech thumbnail with neon blue colors showing a robot hand reaching towards a glowing screen')"
          />
          <div className="flex justify-between items-center mt-2 mb-6">
            <span className="text-xs text-gray-500">{prompt.length} characters</span>
            <span className="text-xs text-gray-400">Be as detailed as possible for best results</span>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center">
              <Zap className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900">AI Prompt Enhancement — Always On</h4>
                <p className="text-xs text-blue-700 mt-0.5">Gemini 2.0 Flash will expand your description into a professional image prompt</p>
              </div>
            </div>
          </div>

          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <div className="flex items-center justify-between mt-8">
            <button onClick={handleSkip} className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors text-sm">
              Skip Questions & Generate Now
            </button>
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center transition-colors"
            >
              Next: Customize Style <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-blue-600" /> Prompt Tips
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include specific colors, emotions, or themes</li>
            <li>• Mention your content category (gaming, tech, vlog, etc.)</li>
            <li>• Describe the mood you want to convey</li>
            <li>• Be specific about visual elements you want</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
