import React, { useState, useEffect } from 'react';
import { PromptConfig, GeneratorType } from '../types.ts';
import { GENERATOR_PROMPTS } from '../constants.ts';
import { generateArtifact, GeminiError } from '../services/geminiService.ts';
import { Terminal, Copy, Check, Loader2, Cpu, FileCode, Presentation, Zap, ChevronRight, Binary, BrainCircuit, AlertTriangle, RefreshCw } from 'lucide-react';

const LOADING_MESSAGES = [
  "Initializing neural pathways...",
  "Analyzing system architecture...",
  "Synthesizing technical logic...",
  "Compiling distributed artifacts...",
  "Optimizing for RAM Vista...",
  "Finalizing generator sequence..."
];

// Error Display Component
interface ErrorDisplayProps {
  message: string;
  code: string;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, code, onRetry }) => {
  const getHowToFix = (code: string): string => {
    switch(code) {
      case 'API_KEY_MISSING':
        return 'Add your Gemini API key to the environment variables and restart the application.';
      case 'INVALID_API_KEY':
        return 'Verify your API key at https://aistudio.google.com/app/apikey and update your environment variables.';
      case 'QUOTA_EXCEEDED':
        return 'Wait a few minutes before trying again, or upgrade your API quota at Google AI Studio.';
      case 'ACCESS_FORBIDDEN':
        return 'Check that your API key has the necessary permissions for the selected model.';
      case 'MODEL_NOT_FOUND':
        return 'The model may have been updated. Try selecting a different artifact type or check the Gemini documentation.';
      case 'NETWORK_ERROR':
        return 'Verify your internet connection is stable and try again.';
      default:
        return 'Review the error details and try again. If the problem persists, check the console for more information.';
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="max-w-md w-full bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900/50 rounded-2xl p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">Generation Failed</h3>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{message}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-doodle-black rounded-xl p-4 border border-red-200 dark:border-red-900/50">
          <h4 className="text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-wider mb-2">How to Fix</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{getHowToFix(code)}</p>
        </div>

        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Error Code: {code}</p>
        </div>
      </div>
    </div>
  );
};

const Generator: React.FC = () => {
  const [selectedType, setSelectedType] = useState<GeneratorType>(GeneratorType.ARCHITECTURE);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [output, setOutput] = useState<Partial<Record<GeneratorType, string>>>({});
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);

  const activePrompt = GENERATOR_PROMPTS[selectedType];

  // Clear error when switching artifact types
  useEffect(() => {
    setError(null);
  }, [selectedType]);

  // Cycling loading messages and progress bar simulation
  useEffect(() => {
    let messageInterval: number;
    let progressInterval: number;

    if (loading) {
      setProgress(0);
      setLoadingMessageIndex(0);
      
      messageInterval = window.setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);

      progressInterval = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Hold at 90% until done
          return prev + Math.random() * 5;
        });
      }, 400);
    }

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [loading]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      const result = await generateArtifact(
        activePrompt.model,
        activePrompt.systemInstruction,
        activePrompt.userPrompt,
        activePrompt.isComplex
      );
      setOutput(prev => ({ ...prev, [selectedType]: result }));
      setProgress(100);
    } catch (err) {
      console.error(err);
      // Handle GeminiError
      if (err instanceof GeminiError) {
        setError({ message: err.message, code: err.code });
      } else {
        // Fallback for unexpected errors
        setError({ 
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR'
        });
      }
      // Clear output for current type on error
      setOutput(prev => ({ ...prev, [selectedType]: '' }));
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const handleCopy = () => {
    const textToCopy = output[selectedType];
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getIcon = (type: GeneratorType) => {
    switch(type) {
      case GeneratorType.ARCHITECTURE: return <Cpu className="w-5 h-5" />;
      case GeneratorType.PYTHON_ENGINE: return <Terminal className="w-5 h-5" />;
      case GeneratorType.DASHBOARD_CODE: return <FileCode className="w-5 h-5" />;
      case GeneratorType.PITCH: return <Presentation className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <div className="w-full lg:w-80 bg-white dark:bg-doodle-surface rounded-[2rem] border border-gray-200 dark:border-doodle-border p-6 space-y-2 overflow-y-auto shadow-xl">
        <h3 className="text-gray-500 dark:text-doodle-muted text-xs font-bold uppercase tracking-widest mb-6 px-2">Artifact Types</h3>
        {(Object.values(GENERATOR_PROMPTS) as PromptConfig[]).map((prompt) => {
          const isSelected = selectedType === prompt.id;
          return (
            <button
              key={`gen-tab-${prompt.id}`}
              onClick={() => setSelectedType(prompt.id)}
              className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${
                isSelected
                  ? 'bg-doodle-blue text-white shadow-lg shadow-blue-900/20' 
                  : 'hover:bg-gray-100 dark:hover:bg-doodle-base text-gray-500 dark:text-doodle-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-gray-100 dark:bg-doodle-base border border-gray-200 dark:border-doodle-border'}`}>
                {getIcon(prompt.id)}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{prompt.title}</div>
                <div className={`text-[10px] truncate w-32 opacity-70 ${isSelected ? 'text-blue-100' : 'text-gray-400 dark:text-doodle-muted'}`}>
                  {prompt.model.split('-')[2]}
                </div>
              </div>
              {isSelected && <ChevronRight className="w-4 h-4 opacity-50" />}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white dark:bg-doodle-surface rounded-[2rem] border border-gray-200 dark:border-doodle-border flex flex-col overflow-hidden shadow-2xl relative">
        {/* Top Gradient Bar */}
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-doodle-blue to-doodle-purple z-10"></div>
        
        {/* Loading Progress Bar */}
        {loading && (
          <div className="absolute top-1 left-0 w-full h-1 bg-gray-100 dark:bg-doodle-black z-10">
            <div 
              className="h-full bg-doodle-blue transition-all duration-300 ease-out shadow-[0_0_8px_rgba(66,133,244,0.5)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        <div className="p-8 border-b border-gray-200 dark:border-doodle-border bg-gray-50 dark:bg-doodle-base/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{activePrompt.title}</h2>
              <p className="text-sm text-gray-500 dark:text-doodle-muted">{activePrompt.description}</p>
            </div>
            
            <div className="flex gap-3">
              {output[selectedType] && !loading && (
                <button
                  onClick={handleCopy}
                  className="p-3 text-gray-500 dark:text-doodle-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-doodle-base rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-doodle-border"
                  title="Copy"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
                              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  output[selectedType] || error
                    ? 'bg-gray-100 dark:bg-doodle-base text-gray-900 dark:text-white border border-gray-200 dark:border-doodle-border hover:border-gray-300 dark:hover:border-doodle-highlight' 
                    : 'bg-doodle-blue text-white hover:bg-blue-600'
                }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {loading ? 'Initializing...' : (output[selectedType] || error ? 'Regenerate' : 'Generate Artifact')}
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-doodle-black rounded-xl p-4 border border-gray-200 dark:border-doodle-border flex items-start gap-3">
             <div className="mt-1">
               <span className="text-[10px] font-bold bg-gray-100 dark:bg-doodle-border px-2 py-0.5 rounded text-gray-500 dark:text-doodle-muted">PROMPT</span>
             </div>
             <p className="text-sm font-mono text-gray-500 dark:text-doodle-muted leading-relaxed">
               {activePrompt.userPrompt.substring(0, 150)}...
             </p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-white dark:bg-doodle-black">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
               <div className="relative">
                  <div className="absolute inset-0 bg-doodle-blue/20 rounded-full blur-2xl animate-pulse scale-150"></div>
                  <div className="relative w-32 h-32 rounded-full border-4 border-doodle-blue/30 border-t-doodle-blue animate-spin flex items-center justify-center">
                    <BrainCircuit className="w-12 h-12 text-doodle-blue animate-pulse" />
                  </div>
               </div>
               <div className="text-center space-y-3">
                 <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">AI Reasoning in Progress</h4>
                 <div className="flex items-center justify-center gap-3">
                    <Binary className="w-4 h-4 text-doodle-blue animate-bounce" />
                    <p className="text-sm font-mono text-doodle-blue/80 font-bold min-w-[240px]">
                      {LOADING_MESSAGES[loadingMessageIndex]}
                    </p>
                 </div>
               </div>
            </div>
          ) : error ? (
            <ErrorDisplay message={error.message} code={error.code} onRetry={handleGenerate} />
          ) : output[selectedType] ? (
            <pre className="font-mono text-sm text-gray-800 dark:text-doodle-text whitespace-pre-wrap leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
              {output[selectedType]}
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-doodle-border">
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-200 dark:border-doodle-border flex items-center justify-center mb-6 opacity-50">
                 <Terminal className="w-10 h-10" />
              </div>
              <p className="text-gray-400 dark:text-doodle-muted font-medium">Ready to initialize generator sequence</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-300 dark:text-doodle-border">
                <div className="w-2 h-2 rounded-full bg-doodle-blue"></div>
                {activePrompt.model}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generator;