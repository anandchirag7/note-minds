import { GoogleGenAI, Modality } from "@google/genai";
import { Source, MindMapData } from "../types";

// Helper to decode base64 audio
const decodeAudio = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a chat response based on the provided sources and history.
 */
export const streamChatResponse = async (
  sources: Source[],
  history: { role: string; parts: { text: string }[] }[],
  lastMessage: string,
  onChunk: (text: string) => void
) => {
  if (!apiKey) throw new Error("API Key is missing.");

  const context = sources.map(s => `Source: ${s.title}\nContent: ${s.content}`).join("\n\n---\n\n");
  const systemInstruction = `You are a helpful and knowledgeable research assistant. 
  Answer the user's questions strictly based on the provided sources. 
  If the answer is not in the sources, say so. 
  
  Sources:
  ${context}`;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
    history: history as any, // Cast to avoid strict type mismatch with SDK's internal types if any
  });

  const result = await chat.sendMessageStream({ message: lastMessage });

  for await (const chunk of result) {
    if (chunk.text) {
      onChunk(chunk.text);
    }
  }
};

/**
 * Generates a "Deep Dive" audio overview (Podcast style).
 * 1. Generates a script using Flash.
 * 2. Converts script to Audio using Flash TTS.
 */
export const generateAudioOverview = async (sources: Source[]): Promise<{ audioUrl: string; transcript: string }> => {
  if (!apiKey) throw new Error("API Key is missing.");
  
  const context = sources.map(s => `Source: ${s.title}\nContent: ${s.content}`).join("\n\n---\n\n");

  // Step 1: Generate the script
  const scriptPrompt = `Based on the following sources, write a lively and engaging podcast script between two hosts, Joe and Jane. 
  They should discuss the key insights, find them interesting, and explain complex points simply.
  The format MUST be strictly:
  Joe: [Text]
  Jane: [Text]
  
  Keep it under 3 minutes of speaking time (approx 400-500 words).
  
  Sources:
  ${context}`;

  const scriptResp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: scriptPrompt,
  });
  
  const scriptText = scriptResp.text;
  if (!scriptText) throw new Error("Failed to generate podcast script.");

  // Step 2: Generate Audio from Script
  // We prepend a direction to the model to TTS the specific conversation.
  const ttsPrompt = `TTS the following conversation:\n${scriptText}`;

  const audioResp = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: ttsPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: 'Joe',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            {
              speaker: 'Jane',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
            }
          ]
        }
      }
    }
  });

  const base64Audio = audioResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("Failed to generate audio.");
  }

  const audioBuffer = decodeAudio(base64Audio);
  const blob = new Blob([audioBuffer], { type: 'audio/wav' }); 
  
  return {
    audioUrl: URL.createObjectURL(blob), 
    transcript: scriptText
  };
};

/**
 * Generates a Mind Map JSON structure from the source content.
 */
export const generateMindMap = async (sourceContent: string): Promise<MindMapData> => {
  if (!apiKey) throw new Error("API Key is missing.");

  const prompt = `
    Analyze the following text and create a comprehensive mind map structure.
    Return ONLY a valid JSON object. Do not include Markdown formatting (like \`\`\`json).
    
    The JSON structure must be:
    {
      "label": "Main Topic",
      "description": "A concise summary (10-20 words) explaining this concept.",
      "children": [
        {
          "label": "Subtopic",
          "description": "A concise summary (10-20 words) explaining this concept.",
          "children": [ ... ]
        }
      ]
    }

    Keep labels concise (under 5-6 words).
    Limit depth to 3-4 levels.
    Ensure descriptions are insightful.
    
    Text to analyze:
    ${sourceContent.substring(0, 30000)} 
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from model");

  try {
    return JSON.parse(text) as MindMapData;
  } catch (e) {
    console.error("Failed to parse Mind Map JSON", text);
    throw new Error("Failed to generate a valid mind map structure.");
  }
};

// Helper for UI component to play raw PCM if needed
export const playRawAudio = async (arrayBuffer: ArrayBuffer, audioContext: AudioContext) => {
  // 24kHz is standard for Gemini output usually, though guide says 24000 in example.
  const audioBuffer = await decodeRawPCM(arrayBuffer, audioContext, 24000);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  return source;
}

async function decodeRawPCM(
  arrayBuffer: ArrayBuffer,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(arrayBuffer);
  const numChannels = 1; // Usually mono unless configured otherwise
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
