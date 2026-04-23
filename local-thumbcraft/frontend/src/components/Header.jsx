import { useState, useEffect } from 'react';
import useUIStore from '../stores/uiStore';
import { Sparkles, Menu, X } from 'lucide-react';

const Header = () => {
  const { setCurrentStep, resetFlow } = useUIStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <button onClick={() => { resetFlow(); setCurrentStep('landing'); }} className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-blue-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">ThumbCraft</span>
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            <button className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Features</button>
            <button className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Gallery</button>
            <button
              onClick={() => setCurrentStep('mode')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all hover:scale-105"
            >
              Create Now
            </button>
          </nav>

          <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4 shadow-xl">
          <button className="block w-full text-left py-2 font-medium text-gray-700">Features</button>
          <button className="block w-full text-left py-2 font-medium text-gray-700">Gallery</button>
          <button
            onClick={() => { setCurrentStep('mode'); setIsMobileMenuOpen(false); }}
            className="block w-full py-3 text-center font-bold text-white bg-blue-600 rounded-xl"
          >
            Create Now
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
