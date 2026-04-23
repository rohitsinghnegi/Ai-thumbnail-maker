import { useState } from 'react';
import useImageStore from '../stores/imageStore';
import useUIStore from '../stores/uiStore';
import { Download, Eye, Clock, ChevronDown, ChevronUp, Trash2, Image, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

const HistoryPage = () => {
  const { history, fetchHistory, downloadImage } = useImageStore();
  const { resetFlow } = useUIStore();
  const [previewImg, setPreviewImg] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { fetchHistory(); }, []);

  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => resetFlow()} className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Generation History</h1>
          <p className="text-lg text-gray-600">Browse and download your previously generated thumbnails</p>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Image className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No history yet</h3>
            <p className="text-gray-500">Start generating thumbnails and they'll appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-gray-900 font-semibold text-base line-clamp-2">{item.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {item.style && <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">{item.style}</span>}
                        {item.mood && <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">{item.mood}</span>}
                        {item.focus && <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">{item.focus}</span>}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-400 ml-4 shrink-0">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(item.createdAt)}
                    </div>
                  </div>

                  <div className="relative">
                    <img
                      src={item.imageUrl}
                      alt={item.description}
                      className="w-full rounded-xl object-cover shadow-sm"
                      style={{ maxHeight: '300px', objectPosition: 'top' }}
                      onError={(e) => { e.target.src = 'https://placehold.co/1280x720/3B82F6/fff?text=Image+Unavailable'; }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">HD</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <button onClick={() => setExpanded(p => ({ ...p, [item.id]: !p[item.id] }))} className="text-sm text-gray-500 hover:text-gray-800 flex items-center transition-colors">
                      {expanded[item.id] ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                      {expanded[item.id] ? 'Hide prompt' : 'View prompt'}
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => setPreviewImg(item.imageUrl)} className="flex items-center text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Eye className="w-4 h-4 mr-1.5" /> Preview
                      </button>
                      <button onClick={() => downloadImage(item.imageUrl, `thumbnail-${item.id}.png`)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Download className="w-4 h-4 mr-1.5" /> Download
                      </button>
                    </div>
                  </div>

                  {expanded[item.id] && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">AI-Baked Prompt</p>
                      <p className="text-sm text-gray-700 italic leading-relaxed">"{item.prompt}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img src={previewImg} alt="Preview" className="w-full rounded-2xl shadow-2xl" />
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => downloadImage(previewImg, 'thumbnail.png')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" /> Download
              </button>
              <button onClick={() => setPreviewImg(null)} className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
