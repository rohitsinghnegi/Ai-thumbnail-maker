import { create } from 'zustand';

const API_BASE = 'http://localhost:5000/api';

const useImageStore = create((set) => ({
  generatedImages: [],   // array of image URLs
  lastCookedPrompt: '',  // expert prompt shown in the AI Brief card
  history: [],
  isLoading: false,
  isDownloadingZip: false,
  error: null,

  generateThumbnails: async (prompt, answers) => {
    set({ isLoading: true, error: null, generatedImages: [], lastCookedPrompt: '' });
    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: prompt,
          style: answers.thumbnailStyle || 'Photo-realistic',
          mood: answers.mood || '',
          category: answers.category || '',
          theme: answers.theme || '',
          primaryColor: answers.primaryColor || '',
          thumbnailTemplate: answers.thumbnailTemplate || '',
          includeText: answers.includeText || '',
          textStyle: answers.textStyle || '',
          customPrompt: answers.customPrompt || ''
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }
      if (!data.imageUrl) {
        throw new Error('Server returned no imageUrl');
      }

      set({
        generatedImages: [data.imageUrl],
        lastCookedPrompt: data.cookedPrompt || '',
        isLoading: false
      });
      return { success: true, images: [data.imageUrl], cookedPrompt: data.cookedPrompt };

    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  fetchHistory: async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      if (res.ok) set({ history: data });
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  },

  downloadImage: (imageUrl, fileName = 'thumbnail.png') => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  downloadAll: async (imageUrls) => {
    if (!imageUrls?.length) return;
    set({ isDownloadingZip: true });
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      await Promise.all(
        imageUrls.map(async (url, i) => {
          const blob = await fetch(url).then(r => r.blob());
          zip.file(`thumbnail-${i + 1}.png`, blob);
        })
      );
      const content = await zip.generateAsync({ type: 'blob' });
      const href = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = href;
      a.download = `thumbnails-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error('Download all failed:', err);
    } finally {
      set({ isDownloadingZip: false });
    }
  },

  clearImages: () => set({ generatedImages: [], lastCookedPrompt: '', error: null }),
}));

export default useImageStore;
