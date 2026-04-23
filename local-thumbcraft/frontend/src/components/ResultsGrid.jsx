import { useState } from 'react';
import useUIStore from '../stores/uiStore';
import useImageStore from '../stores/imageStore';
import { CheckCircle, Download, Plus, Eye, Loader2 } from 'lucide-react';

const ResultsGrid = () => {
  const { resetFlow, answers } = useUIStore();
  const { generatedImages, downloadImage, downloadAll, clearImages, isDownloadingZip } = useImageStore();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const count = parseInt(answers.imageCount) || 1;
  const imagesToShow = generatedImages.length > 0 ? generatedImages : [];

  const handleCreateNew = () => { clearImages(); resetFlow(); };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Your Thumbnails Are Ready!</h2>
          </div>
          <p className="text-lg text-gray-600">Choose your favorite or download all of them</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <button
            onClick={() => downloadAll(imagesToShow)}
            disabled={isDownloadingZip || imagesToShow.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl flex items-center transition-colors shadow-md shadow-blue-100"
          >
            {isDownloadingZip ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
            {isDownloadingZip ? 'Creating ZIP...' : 'Download All as ZIP'}
          </button>
          <button
            onClick={handleCreateNew}
            className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-xl flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" /> Create New Thumbnails
          </button>
        </div>

        {/* Grid */}
        {imagesToShow.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No images generated yet.</div>
        ) : (
          <div className={`grid gap-6 ${count === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-2'}`}>
            {imagesToShow.map((imageUrl, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Generated thumbnail ${index + 1}`}
                    className="w-full object-cover"
                    style={{ aspectRatio: '16/9' }}
                    onError={(e) => { e.target.src = `https://placehold.co/1280x720/3B82F6/fff?text=Thumbnail+${index + 1}`; }}
                  />
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                      onClick={() => setPreviewImg(imageUrl)}
                      className="bg-white text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 flex items-center shadow-lg transform hover:scale-105 transition-transform"
                    >
                      <Eye className="w-4 h-4 mr-2" /> Preview
                    </button>
                    <button
                      onClick={() => downloadImage(imageUrl, `thumbnail-${index + 1}.png`)}
                      className="bg-blue-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center shadow-lg transform hover:scale-105 transition-transform"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download
                    </button>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">HD Quality</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 text-gray-900 text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow">{index + 1}</span>
                  </div>
                </div>
                <div className="p-4">
                  <button
                    onClick={() => downloadImage(imageUrl, `thumbnail-${index + 1}.png`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 bg-yellow-50 rounded-xl p-6 border border-yellow-100">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Pro Tips for Your Thumbnails
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-800">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Use as your YouTube thumbnail immediately</li>
              <li>Test different versions to see what works best</li>
              <li>Make sure text is readable on mobile devices</li>
            </ul>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>A/B test your thumbnails for better CTR</li>
              <li>Keep important elements away from edges</li>
              <li>Ensure high contrast for better visibility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img src={previewImg} alt="Preview" className="w-full rounded-2xl shadow-2xl" />
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => downloadImage(previewImg, 'thumbnail.png')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4 mr-2" /> Download
              </button>
              <button onClick={() => setPreviewImg(null)} className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsGrid;
