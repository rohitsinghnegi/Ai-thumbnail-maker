import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  currentStep: 'landing', // landing -> mode -> input -> questions -> loading -> results
  generationMode: null, // 'prompt' or 'image'
  prompt: '',
  uploadedImage: null,
  imageDescription: '',
  enhancePrompt: true,
  currentQuestionIndex: 0,
  answers: {
    category: '',
    mood: '',
    theme: '',
    primaryColor: '',
    includeText: '',
    textStyle: '',
    thumbnailStyle: '',
    thumbnailTemplate: '',
    customPrompt: '',
    imageCount: '1'
  },

  setCurrentStep: (step) => set({ currentStep: step }),
  setGenerationMode: (mode) => set({ generationMode: mode }),
  setPrompt: (prompt) => set({ prompt }),
  setUploadedImage: (image) => set({ uploadedImage: image }),
  setImageDescription: (description) => set({ imageDescription: description }),
  setEnhancePrompt: (enhance) => set({ enhancePrompt: enhance }),

  setAnswer: (questionKey, value) => set((state) => ({
    answers: { ...state.answers, [questionKey]: value }
  })),

  removeAnswer: (questionKey) => set((state) => ({
    answers: { ...state.answers, [questionKey]: '' }
  })),

  nextQuestion: () => {
    const state = get();
    let nextIndex = state.currentQuestionIndex + 1;
    const questions = get().questions;
    if (nextIndex < questions.length && questions[nextIndex].key === 'textStyle' && state.answers.includeText === 'No') {
      nextIndex += 1;
    }
    set({ currentQuestionIndex: Math.min(nextIndex, questions.length - 1) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  previousQuestion: () => {
    const state = get();
    let prevIndex = state.currentQuestionIndex - 1;
    const questions = get().questions;
    if (prevIndex >= 0 && questions[prevIndex].key === 'textStyle' && state.answers.includeText === 'No') {
      prevIndex -= 1;
    }
    set({ currentQuestionIndex: Math.max(prevIndex, 0) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  skipQuestion: () => {
    const state = get();
    const questions = get().questions;
    if (state.currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: state.currentQuestionIndex + 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      set({ currentStep: 'loading' });
    }
  },

  startGeneration: () => set({ isGenerating: true, currentStep: 'loading' }),
  completeGeneration: () => set({ isGenerating: false, currentStep: 'results' }),

  resetFlow: () => set({
    currentStep: 'landing',
    generationMode: null,
    prompt: '',
    uploadedImage: null,
    imageDescription: '',
    enhancePrompt: true,
    currentQuestionIndex: 0,
    answers: {
      category: '',
      mood: '',
      theme: '',
      primaryColor: '',
      includeText: '',
      textStyle: '',
      thumbnailStyle: '',
      thumbnailTemplate: '',
      customPrompt: '',
      imageCount: '1'
    },
    isGenerating: false
  }),

  questions: [
    { key: 'category', title: 'What category is your content?', options: ['Tech', 'Gaming', 'Vlog', 'Tutorial', 'Entertainment', 'News'] },
    { key: 'mood', title: 'What mood do you want to convey?', options: ['Excited', 'Serious', 'Fun', 'Professional', 'Mysterious', 'Energetic'] },
    { key: 'theme', title: 'What theme do you prefer?', options: ['Bright', 'Dark', 'Colorful', 'Minimalist', 'Gradient', 'Neon'] },
    { key: 'primaryColor', title: 'Choose a primary color', options: ['Red', 'Blue', 'Green', 'Purple', 'Orange', 'Yellow', 'Pink', 'Cyan'] },
    { key: 'thumbnailStyle', title: 'What visual style do you want?', options: ['Photo-realistic', 'Cartoonish', 'Minimalistic', 'Artistic', 'Modern', 'Vintage'] },
    {
      key: 'thumbnailTemplate',
      title: 'Choose a composition template',
      isTemplate: true,
      options: [
        { name: 'Face Close-Up',     icon: '🧑', desc: 'Subject face fills frame, text space on side' },
        { name: 'Split Screen',      icon: '⬜⬛', desc: 'Two contrasting concepts side by side' },
        { name: 'Before & After',    icon: '🔄', desc: 'Horizontal split showing transformation' },
        { name: 'Product Showcase',  icon: '🎯', desc: 'Hero product centered, spotlight effect' },
        { name: 'Action Shot',       icon: '⚡', desc: 'Dynamic diagonal, motion blur, energy' },
        { name: 'Minimal Text',      icon: '📝', desc: 'Bold typography as the main visual' },
        { name: 'Collage Grid',      icon: '🔲', desc: '2×2 mosaic of related images' },
        { name: 'Full Immersive',    icon: '🌅', desc: 'Epic cinematic wide landscape scene' }
      ]
    },
    { key: 'includeText', title: 'Include text in thumbnail?', options: ['Yes', 'No'] },
    { key: 'textStyle', title: 'What text style do you prefer?', options: ['Bold', 'Minimal', 'Fancy', 'Outlined', 'Shadow', 'Gradient'] },
    { key: 'customPrompt', title: 'Any additional requirements?', isTextInput: true, placeholder: 'Optional: Add any specific details, elements, or instructions...' },
    { key: 'imageCount', title: 'How many thumbnails do you want?', options: ['1', '2'] }
  ]
}));

export default useUIStore;
