import useUIStore from '../stores/uiStore';
import { Sparkles, Image as ImageIcon, Zap, Star, Play, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const { setCurrentStep } = useUIStore();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white pt-24 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] bg-purple-50 rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-green-50 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              <span>The future of thumbnail creation is here</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
              Create Viral Thumbnails
              <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed mb-12">
              Stop spending hours on Photoshop. Generate high-converting, professional YouTube thumbnails
              in seconds using advanced artificial intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                id="get-started-btn"
                onClick={() => setCurrentStep('mode')}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:scale-105 flex items-center justify-center"
              >
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 text-lg font-bold rounded-xl border-2 border-gray-100 transition-all flex items-center justify-center">
                <Play className="mr-2 w-5 h-5 fill-current" />
                Watch Demo
              </button>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Trusted by creators worldwide</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" alt="YouTube" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_2022_logo.svg" alt="Instagram" className="h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose ThumbCraft?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've trained our AI on millions of high-performing thumbnails to ensure you get the best CTR possible.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">Generate stunning thumbnail concepts in under 60 seconds. No more waiting.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <ImageIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered</h3>
              <p className="text-gray-600 leading-relaxed">Describe your idea and let our AI generate stunning visuals, no design skills needed.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Higher CTR</h3>
              <p className="text-gray-600 leading-relaxed">Our designs are optimized for engagement, helping your videos stand out in a crowded feed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div><div className="text-4xl font-bold mb-2">2M+</div><div className="text-blue-100">Thumbnails Created</div></div>
            <div><div className="text-4xl font-bold mb-2">50k+</div><div className="text-blue-100">Active Creators</div></div>
            <div><div className="text-4xl font-bold mb-2">15%</div><div className="text-blue-100">Avg. CTR Boost</div></div>
            <div><div className="text-4xl font-bold mb-2">4.9/5</div><div className="text-blue-100">User Rating</div></div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-white">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Ready to create stunning thumbnails?</h2>
          <p className="text-xl text-gray-600 mb-10">Join creators who've transformed their channels with AI-powered thumbnails.</p>
          <button
            onClick={() => setCurrentStep('mode')}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:scale-105"
          >
            Start Creating Now — It's Free
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
