import { useState } from 'react';
import useUIStore from '../stores/uiStore';
import useImageStore from '../stores/imageStore';
import { ArrowLeft, ArrowRight, CheckCircle, Zap, Loader2, X } from 'lucide-react';

const QuestionFlow = () => {
  const {
    currentQuestionIndex, questions, answers, prompt,
    setAnswer, removeAnswer, nextQuestion, previousQuestion,
    setCurrentStep, startGeneration, resetFlow, completeGeneration
  } = useUIStore();
  const { generateThumbnails } = useImageStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestion.key];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleGenerate = async () => {
    setIsGenerating(true);
    startGeneration();
    const result = await generateThumbnails(prompt, answers, null);
    if (result.success) {
      completeGeneration();
    } else {
      setIsGenerating(false);
      setCurrentStep('input');
      alert('Generation failed: ' + (result.error || 'Unknown error'));
    }
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      await handleGenerate();
    } else {
      nextQuestion();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => resetFlow()} disabled={isGenerating} className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors disabled:opacity-50">
          <ArrowLeft className="w-5 h-5 mr-2" /> Cancel
        </button>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{currentQuestion.title}</h2>
          {currentQuestion.isTextInput ? (
            <textarea
              value={currentAnswer || ''}
              onChange={(e) => setAnswer(currentQuestion.key, e.target.value)}
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={currentQuestion.placeholder}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswer(currentQuestion.key, option)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 font-medium ${currentAnswer === option ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {currentQuestionIndex > 0 && (
              <button onClick={previousQuestion} disabled={isGenerating} className="flex items-center text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleGenerate} disabled={isGenerating} className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors text-sm">
              Skip & Generate
            </button>
            <button
              onClick={handleNext}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center disabled:opacity-70 transition-colors"
            >
              {isGenerating ? (
                <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Generating...</>
              ) : isLastQuestion ? (
                <>Generate <Zap className="w-4 h-4 ml-2" /></>
              ) : (
                <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </button>
          </div>
        </div>

        {/* Selections Summary */}
        {Object.values(answers).some(a => a) && (
          <div className="mt-8 bg-gray-50 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-center text-lg">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600" /> Your Selections
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {questions.map(q => {
                const answer = answers[q.key];
                if (!answer) return null;
                return (
                  <div key={q.key} className="inline-flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm group">
                    <CheckCircle className="w-4 h-4 mr-1.5 text-blue-500" />
                    <span className="text-xs text-gray-500 mr-1.5">{q.key}:</span>
                    <span className="text-sm font-semibold text-blue-700">{answer.length > 12 ? answer.slice(0, 12) + '…' : answer}</span>
                    <button onClick={() => removeAnswer(q.key)} className="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionFlow;
