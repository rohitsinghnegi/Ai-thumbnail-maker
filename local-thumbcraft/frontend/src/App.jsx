import useUIStore from './stores/uiStore';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import ModeSelection from './components/ModeSelection';
import PromptInput from './components/PromptInput';
import QuestionFlow from './components/QuestionFlow';
import LoadingScreen from './components/LoadingScreen';
import ResultsGrid from './components/ResultsGrid';
import HistoryPage from './components/HistoryPage';

function App() {
  const { currentStep } = useUIStore();

  const renderStep = () => {
    switch (currentStep) {
      case 'landing':   return <LandingPage />;
      case 'mode':      return <ModeSelection />;
      case 'input':     return <PromptInput />;
      case 'questions': return <QuestionFlow />;
      case 'loading':   return <LoadingScreen />;
      case 'results':   return <ResultsGrid />;
      case 'history':   return <HistoryPage />;
      default:          return <LandingPage />;
    }
  };

  const showFooter = currentStep === 'landing';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-grow">
        {renderStep()}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

export default App;
