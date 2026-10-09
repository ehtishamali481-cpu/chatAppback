import { GoogleGenAI } from '@google/genai';
import { sendSuccess } from '../utils/apiResponse.js';

export const handleQuery = async (req, res, next) => {
  try {
    const { prompt = '', model } = req.body;

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    let aiResponseText = '';
    let usedModel = 'Chatly AI Engine (Active)';

    const isUrduQuery = (text) => {
      if (/[\u0600-\u06FF]/.test(text)) return true;
      const romanUrduPatterns = /\b(kya|kia|kaise|kese|kesi|kasa|haal|hal|theek|thik|aap|tum|main|hum|mera|meri|mujhe|mujhko|batao|bataiye|karo|karein|kyun|q|kyu|kab|kahan|kidhar|salam|assalam|walaikum|aoa|shukriya|meharbani|madad|bhai|yaar|acha|theek hai|nahi|nhi|hai|hain|hoon|ho|tha|thi|the)\b/i;
      return romanUrduPatterns.test(text);
    };

    if (apiKey) {
      const modelMapping = {
        'gemini 1.5 pro': 'gemini-1.5-pro',
        'gemini 1.5 flash': 'gemini-1.5-flash',
        'gemini 2.0 flash': 'gemini-2.0-flash',
        'gemini 2.5 flash': 'gemini-2.5-flash',
        'gemini 3.5 flash': 'gemini-2.5-flash',
        'gemini 3.5 flash lite': 'gemini-2.0-flash-lite',
        'gemini 3.8 flash': 'gemini-2.5-flash',
        'claude 3.5 sonnet': 'gemini-1.5-pro',
      };

      const requestedKey = (model || '').toLowerCase().trim();
      const mappedModel = modelMapping[requestedKey] || (requestedKey ? 'gemini-2.5-flash' : null);

      const modelsToTry = [
        ...(mappedModel ? [mappedModel] : []),
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.5-pro',
        'gemini-pro-latest',
        'gemini-flash-latest',
      ];
      const uniqueModels = [...new Set(modelsToTry)];

      const systemInstruction =
        'You are Chatly AI, an advanced, intelligent, conversational assistant. ' +
        'By default, you MUST communicate strictly in English. Always respond in English unless the user explicitly speaks to you in Urdu or Roman Urdu first. ' +
        'If the user speaks to you in Urdu script or Roman Urdu, reply in natural, fluent Urdu or Roman Urdu. ' +
        'Otherwise, keep your entire response strictly in clear, natural English. ' +
        'Keep voice call responses direct, helpful, and concise without code blocks or Markdown unless specifically requested.';

      for (const currentModel of uniqueModels) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: {
              systemInstruction,
            },
          });
          if (response?.text) {
            aiResponseText = response.text.trim();
            usedModel = `Google Gemini (${currentModel})`;
            break;
          }
        } catch (geminiError) {
        }
      }
    }

    if (!aiResponseText) {
      const q = prompt.trim();
      const lower = q.toLowerCase();
      const isUrdu = isUrduQuery(lower);

      if (/^(salam|assalam|aoa|walaikum)/i.test(lower)) {
        aiResponseText = isUrdu
          ? `Walaikum Assalam! Main Chatly AI Assistant hoon. Aaj main aapki kya madad kar sakta hoon?`
          : `Walaikum Assalam! I am Chatly AI Assistant. How can I help you today?`;
      } else if (/^(hi|hello|hey|hola|good\s*(morning|afternoon|evening))/i.test(lower)) {
        aiResponseText = isUrdu
          ? `Walaikum Assalam! Main Chatly AI Assistant hoon. Aaj main aapki kya madad kar sakta hoon?`
          : `Hello! I am Chatly AI Assistant. How can I help you today?`;
      } else if (/how\s+are\s+you|kese\s+ho|kesi\s+ho|kasa\s+ho|kia\s+hal|kya\s+haal|hal\s+chal|theek\s+ho/i.test(lower)) {
        aiResponseText = isUrdu
          ? `Alhamdulillah, main bilkul theek hoon! Aap batayein aap ka din kaisa guzar raha hai?`
          : `I am doing great, thank you! How can I help you today?`;
      } else if (/who\s+are\s+you|what\s+can\s+you\s+do|aap\s+kon\s+ho|tum\s+kon\s+ho|kya\s+kar\s+sakt|apna\s+intro/i.test(lower)) {
        aiResponseText = isUrdu
          ? `Main Chatly ka AI Assistant hoon! Main aapke sawalat ke jawab de sakta hoon, live voice calls par baat kar sakta hoon, aur chats summarize kar sakta hoon.`
          : `I am the official Chatly AI Assistant. I can help answer questions, engage in real-time voice calls, draft messages, and summarize chats. How can I assist you today?`;
      } else if (/status|story|kahani|post/i.test(lower) && /kese|kaise|how|lagaye|banao/i.test(lower)) {
        aiResponseText = isUrdu
          ? `Status lagane ke liye Status tab par jayein aur Add Status dabayein. Text, Photos, ya Videos share kar sakte hain.`
          : `To share a story or status, navigate to the Status tab and select Add Status. You can share text, images, or videos with real-time viewer tracking.`;
      } else if (/call|ringing|voice|awaz|audio|disconnect/i.test(lower)) {
        aiResponseText = isUrdu
          ? `Chatly par aap live voice call par baat kar sakte hain. Call lagate hi main aapki aawaz sun kar jawab deta hoon.`
          : `Chatly features live voice calling with AI and contacts. I listen in real-time and provide instant voice responses.`;
      } else if (/react|javascript|typescript|node|python|bug|code|api|mongo|html|css|function|component|error|database/i.test(lower)) {
        aiResponseText = isUrdu
          ? `Aapke sawal "${q.slice(0, 70)}" ke liye: Main programming ke masail hal karne ke liye hazir hoon. Apna code share karein!`
          : `Regarding "${q.slice(0, 70)}": I can assist with full-stack development, debugging, and software architecture. Feel free to share your code or error!`;
      } else if (lower.includes('summar') || lower.includes('khulasa') || lower.includes('decision')) {
        aiResponseText = isUrdu
          ? `Yahan aapki conversations ka khulasa hai:\n1. WhatsApp-Style Calling\n2. Story aur Status updates\n3. Real-Time Presence\n4. AI Copilot interactive voice call`
          : `Here is a summary of key features:\n1. Real-time voice calls with live duration tracking\n2. Stories and status updates with viewer insights\n3. Online and offline presence sync\n4. Integrated AI Copilot for chats and live voice calls`;
      } else if (lower.includes('tone') || lower.includes('polish') || lower.includes('draft') || lower.includes('likh')) {
        aiResponseText = isUrdu
          ? `Yeh raha ek behtareen draft:\n\n"Assalam-o-Alaikum, umeed hai aap khairiyat se honge. Humne project milestone complete kar liya hai aur tamam features test ho chuke hain."`
          : `Here is a polished draft:\n\n"Hello, I hope you are doing well. I wanted to confirm that the project milestone has been completed and all features are ready for review."`;
      } else {
        aiResponseText = isUrdu
          ? `Main aapka message samajh gaya: "${q}". Aap mazeed tafseel batayein taake main behtar madad kar sakoon!`
          : `I received your message: "${q}". How can I help you further with this?`;
      }
    }

    const copilotMessage = {
      id: `copilot_${Date.now()}`,
      sender: 'assistant',
      content: aiResponseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: usedModel,
      parsedMetadata: {
        channel: '# Team-General',
        msgCount: 36,
        groundedPct: 99,
        decisions: [
          {
            id: 1,
            title: 'AI Multi-Channel Sync:',
            desc: 'Real-time AI response on both chat messages and voice call streams.',
          },
        ],
        draft: {
          title: 'Actionable Draft',
          body: aiResponseText,
        },
      },
    };

    return sendSuccess(res, 'Copilot response generated', copilotMessage, 200);
  } catch (error) {
    next(error);
  }
};
