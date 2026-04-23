import useUIStore from '../stores/uiStore';
import { Edit3, Image, ArrowLeft } from 'lucide-react';

const ModeSelection = () => {
  const { setGenerationMode, setCurrentStep, resetFlow } = useUIStore();

  const handleOptionSelect = (mode) => {
    setGenerationMode(mode);
    setCurrentStep('input');
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => { resetFlow(); setCurrentStep('landing'); }} className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
        </button>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Choose Your Starting Point</h1>
          <p className="text-lg text-gray-600">How would you like to create your thumbnail?</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div
            onClick={() => handleOptionSelect('prompt')}
            className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 p-8 cursor-pointer group"
          >
            <div className="w-16 h-16 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mb-6 mx-auto transition-colors">
              <Edit3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Create from Text</h3>
            <p className="text-gray-600 leading-relaxed text-center">Describe your thumbnail idea and let AI create stunning visuals from your words</p>
          </div>
          <div
            onClick={() => handleOptionSelect('image')}
            className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:border-green-400 hover:shadow-lg transition-all duration-200 p-8 cursor-pointer group opacity-60"
          >
            <div className="w-16 h-16 bg-green-50 group-hover:bg-green-100 rounded-xl flex items-center justify-center mb-6 mx-auto transition-colors">
              <Image className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Create from Image</h3>
            <p className="text-gray-600 leading-relaxed text-center">Upload your image and enhance it with AI-powered thumbnail optimization</p>
            <p className="text-center text-xs text-gray-400 mt-3 font-medium">(Coming soon in local version)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;
