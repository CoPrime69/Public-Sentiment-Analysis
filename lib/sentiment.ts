let worker: Worker | null = null;

// Initialize the worker
export function initSentimentWorker() {
  if (typeof window !== 'undefined' && !worker) {
    worker = new Worker(new URL('../workers/sentiment.worker.js', import.meta.url));
  }
  return worker;
}

// Analyze sentiment
export async function analyzeSentiment(text: string): Promise<{
  score: number;
  label: string;
  confidence: number;
}> {
  return new Promise((resolve, reject) => {
    const worker = initSentimentWorker();
    
    if (!worker) {
      reject(new Error('Worker initialization failed'));
      return;
    }
    
    const id = Math.random().toString(36).substring(2, 9);
    
    const handleMessage = (event: MessageEvent) => {
      const { id: responseId, success, result, error } = event.data;
      
      if (responseId === id) {
        worker.removeEventListener('message', handleMessage);
        
        if (success) {
          // Return the standardized sentiment result
          resolve(result);
        } else {
          reject(new Error(error || 'Sentiment analysis failed'));
        }
      }
    };
    
    worker.addEventListener('message', handleMessage);
    worker.postMessage({ id, text });
  });
}
