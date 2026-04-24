import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  currentStep: 'landing', // landing → mode → input → questions → loading → results
  generationMode: null,
  prompt: '',
  isGenerating: false,     // FIX: was missing from initial state
  currentQuestionIndex: 0,
  answers: {
    category: '',
    mood: '',
    theme: '',
    primaryColor: '',
    thumbnailStyle: '',
    thumbnailTemplate: '',
    includeText: '',
    textStyle: '',
    customPrompt: '',
  },

  setCurrentStep: (step) => set({ currentStep: step }),
  setGenerationMode: (mode) => set({ generationMode: mode }),
  setPrompt: (prompt) => set({ prompt }),

  setAnswer: (key, value) => set((state) => ({
    answers: { ...state.answers, [key]: value }
  })),

  removeAnswer: (key) => set((state) => ({
    answers: { ...state.answers, [key]: '' }
  })),

  nextQuestion: () => {
    const { currentQuestionIndex, questions, answers } = get();
    let next = currentQuestionIndex + 1;
    // Skip textStyle if user chose No text
    if (questions[next]?.key === 'textStyle' && answers.includeText === 'No') next++;
    set({ currentQuestionIndex: Math.min(next, questions.length - 1) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  previousQuestion: () => {
    const { currentQuestionIndex, questions, answers } = get();
    let prev = currentQuestionIndex - 1;
    // Skip textStyle if user chose No text
    if (questions[prev]?.key === 'textStyle' && answers.includeText === 'No') prev--;
    set({ currentQuestionIndex: Math.max(prev, 0) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  startGeneration: () => set({ isGenerating: true, currentStep: 'loading' }),
  completeGeneration: () => set({ isGenerating: false, currentStep: 'results' }),

  resetFlow: () => set({
    currentStep: 'landing',
    generationMode: null,
    prompt: '',
    isGenerating: false,
    currentQuestionIndex: 0,
    answers: {
      category: '',
      mood: '',
      theme: '',
      primaryColor: '',
      thumbnailStyle: '',
      thumbnailTemplate: '',
      includeText: '',
      textStyle: '',
      customPrompt: '',
    }
  }),

  // ── Optimised question set ──────────────────────────────────────────────
  // Removed: imageCount (generates 1 only — sequential multi-gen doubles quota)
  // Reordered: category first so the AI knows context for all subsequent answers
  // Added: icons and cleaner descriptions for better UX
  questions: [
    {
      key: 'category',
      title: '📂 What is your content category?',
      options: ['Tech', 'Gaming', 'Vlog', 'Tutorial', 'Entertainment', 'News']
    },
    {
      key: 'mood',
      title: '🎭 What mood should the thumbnail convey?',
      options: ['Excited', 'Serious', 'Fun', 'Professional', 'Mysterious', 'Energetic']
    },
    {
      key: 'thumbnailStyle',
      title: '🖼️ What visual style do you want?',
      options: ['Photo-realistic', 'Cartoonish', 'Minimalistic', 'Artistic', 'Modern', 'Vintage']
    },
    {
      key: 'theme',
      title: '🌈 What color theme do you prefer?',
      options: ['Bright', 'Dark', 'Colorful', 'Minimalist', 'Gradient', 'Neon']
    },
    {
      key: 'primaryColor',
      title: '🎨 Choose a primary accent color',
      options: ['Red', 'Blue', 'Green', 'Purple', 'Orange', 'Yellow', 'Pink', 'Cyan']
    },
    {
      key: 'thumbnailTemplate',
      title: '📐 Choose a composition template',
      isTemplate: true,
      options: [
        { name: 'Face Close-Up',    icon: '🧑',  desc: 'Emotional close-up, text space on side' },
        { name: 'Split Screen',     icon: '↔️',  desc: 'Two contrasting concepts side by side' },
        { name: 'Before & After',   icon: '🔄',  desc: 'Dramatic transformation, top/bottom split' },
        { name: 'Product Showcase', icon: '🎯',  desc: 'Hero item centered, spotlight effect' },
        { name: 'Action Shot',      icon: '⚡',  desc: 'Dynamic diagonal with motion energy' },
        { name: 'Minimal Text',     icon: '📝',  desc: 'Bold typography as the hero visual' },
        { name: 'Collage Grid',     icon: '🔲',  desc: '2×2 mosaic of related images' },
        { name: 'Full Immersive',   icon: '🌅',  desc: 'Epic cinematic wide scene' }
      ]
    },
    {
      key: 'includeText',
      title: '✏️ Should we include text in the thumbnail?',
      options: ['Yes', 'No']
    },
    {
      key: 'textStyle',
      title: '🔤 What text style do you prefer?',
      options: ['Bold', 'Minimal', 'Fancy', 'Outlined', 'Shadow', 'Gradient']
    },
    {
      key: 'customPrompt',
      title: '💡 Any additional details? (optional)',
      isTextInput: true,
      placeholder: 'e.g., "include a glowing trophy", "dark forest background", "man in red jacket reacting with shock"...'
    }
  ]
}));

export default useUIStore;
