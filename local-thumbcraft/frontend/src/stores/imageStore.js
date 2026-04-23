import { create } from 'zustand';

const API_BASE = 'http://localhost:5000/api';

const useImageStore = create((set, get) => ({
  generatedImages: [],
  history: [],
  isLoading: false,
  isDownloadingZip: false,
  error: null,

  generateThumbnails: async (prompt, answers, uploadedImage) => {
    set({ isLoading: true, error: null });
    try {
      const count = parseInt(answers.imageCount) || 1;
      const results = [];

      for (let i = 0; i < count; i++) {
        const res = await fetch(`${API_BASE}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: prompt,
            style: answers.thumbnailStyle || 'Photo-realistic',
            mood: answers.mood || 'Professional',
            focus: answers.category || 'General',
            theme: answers.theme,
            primaryColor: answers.primaryColor,
            includeText: answers.includeText,
            textStyle: answers.textStyle,
            customPrompt: answers.customPrompt,
            enhancePrompt: true
          })
        });
        const data = await res.json();
        if (res.ok && data.imageUrl) {
          results.push(data.imageUrl);
        } else {
          throw new Error(data.error || 'Generation failed');
        }
      }

      set({ generatedImages: results, isLoading: false });
      return { success: true, images: results };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  fetchHistory: async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      if (res.ok) {
        set({ history: data });
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  },

  downloadImage: (imageUrl, fileName) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = fileName || 'thumbnail.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  downloadAll: async (imageUrls) => {
    set({ isDownloadingZip: true });
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (let i = 0; i < imageUrls.length; i++) {
        const response = await fetch(imageUrls[i]);
        const blob = await response.blob();
        zip.file(`thumbnail-${i + 1}.png`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thumbnails-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download all failed', err);
    } finally {
      set({ isDownloadingZip: false });
    }
  },

  clearImages: () => set({ generatedImages: [] }),
}));

export default useImageStore;
