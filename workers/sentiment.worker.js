import { pipeline } from '@xenova/transformers';

let sentimentAnalyzer = null;

// Initialize the sentiment analysis pipeline
async function initSentimentAnalysis() {
  if (sentimentAnalyzer === null) {
    try {
      console.log('Initializing sentiment analyzer...');
      sentimentAnalyzer = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
      console.log('Sentiment analyzer initialized successfully');
    } catch (e) {
      console.error('Error initializing sentiment analyzer:', e);
      throw e;
    }
  }
  return sentimentAnalyzer;
}

// Handle messages from the main thread
self.addEventListener('message', async (event) => {
  const { text, id } = event.data;
  
  if (!text) {
    self.postMessage({
      id,
      error: 'No text provided for analysis',
      success: false
    });
    return;
  }
  
  console.log(`Worker received request ${id} with text: ${text.substring(0, 50)}...`);
  
  try {
    const analyzer = await initSentimentAnalysis();
    const result = await analyzer(text);
    console.log(`Analysis result for ${id}:`, result);
    
    // Get the raw model output
    const rawLabel = result[0].label;
    const rawScore = result[0].score;
    
    // Map the result to our expected format
    let sentiment = {
      label: rawLabel.toLowerCase(),
      score: rawScore,
      rawScore: rawScore,  // Include raw score for display
      rawScorePercent: (rawScore * 100).toFixed(1) + '%'  // Formatted percentage
    };
    
    // First determine if it's positive or negative
    if (sentiment.label.includes('negative') || sentiment.label === 'label_0') {
      sentiment.label = 'negative';
    } else if (sentiment.label.includes('positive') || sentiment.label === 'label_1') {
      sentiment.label = 'positive';
    } else {
      sentiment.label = 'neutral';
    }
    
    // Now apply confidence thresholds to potentially set as neutral
    // If confidence is between 0.45 and 0.55, mark as neutral
    if (rawScore >= 0.45 && rawScore <= 0.55) {
      sentiment.label = 'neutral';
    }
    
    // Log the final classification for debugging
    console.log(`Final sentiment for ${id}: ${sentiment.label} (${sentiment.rawScorePercent})`);
    
    self.postMessage({
      id,
      result: {
        label: sentiment.label,           // Explicitly include these fields to ensure
        score: sentiment.score,           // they're present in the database schema
        confidence: rawScore,             // Keep for backwards compatibility
        rawScore: sentiment.rawScore,     // Include raw score
        rawScorePercent: sentiment.rawScorePercent, // Include percentage
        tweet: text,                      // Include the tweet text for database storage
        sentimentCategory: sentiment.label // Explicit sentiment category for DB queries
      },
      success: true
    });
  } catch (error) {
    console.error(`Worker error for ${id}:`, error);
    self.postMessage({
      id,
      error: error.message,
      success: false
    });
  }
});

// Send a ready message when the worker loads
self.postMessage({ ready: true });