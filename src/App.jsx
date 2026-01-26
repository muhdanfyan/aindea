import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Languages, GraduationCap, ArrowLeftRight, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dictionary from './dictionary.json';
import './App.css';

const API_KEY = "AIzaSyBBQQbVPJr8Mv8RSZh7v64wFfaL__9malU";
const genAI = new GoogleGenerativeAI(API_KEY);

// Helper function to strip markdown formatting
const stripMarkdown = (text) => {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
};

function App() {
  const [mode, setMode] = useState('translate');
  const [translateDirection, setTranslateDirection] = useState('id-wolio');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState({});
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (mode === 'translate') {
      const directionText = translateDirection === 'id-wolio'
        ? 'Indonesia → Wolio'
        : 'Wolio → Indonesia';
      setMessages([
        { role: 'bot', text: `Halo! Saya asisten penerjemah bahasa Wolio. Mode: ${directionText}. Ketik teks yang ingin diterjemahkan.` }
      ]);
      setConversationHistory([]);
    } else {
      // Ayi Conversational Mode
      setMessages([
        {
          role: 'ayi',
          primary: "Tabea! Aku Ayi. 👋",
          secondary: "Halo! Aku Ayi.",
          isGreeting: true
        }
      ]);
      setConversationHistory([]);
      startConversation();
    }
    setShowTranslation({});
  }, [mode, translateDirection]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1beta' });

      const prompt = `
        Kamu adalah Ayi, orang Buton yang berbicara bahasa Wolio. Kamu ingin mengajak temanmu berdiskusi dalam bahasa Wolio.
        
        REFERENSI KAMUS WOLIO:
        ${dictionary.context.substring(0, 10000)}
        
        TUGAS:
        Ajukan pertanyaan sederhana dalam bahasa Wolio untuk memulai percakapan sehari-hari.
        Contoh topik: kabar, nama, kegiatan hari ini, makanan, keluarga.
        
        FORMAT RESPONS (HARUS TEPAT):
        WOLIO: [pertanyaan dalam bahasa Wolio yang natural]
        INDONESIA: [terjemahan ke Indonesia]
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const wolioMatch = text.match(/WOLIO:\s*(.+)/i);
      const indonesiaMatch = text.match(/INDONESIA:\s*(.+)/i);

      const wolioText = wolioMatch ? stripMarkdown(wolioMatch[1]) : "Umbemo?";
      const indonesiaText = indonesiaMatch ? stripMarkdown(indonesiaMatch[1]) : "Apa kabar?";

      setConversationHistory([{ role: 'ayi', wolio: wolioText }]);

      setMessages(prev => [...prev, {
        role: 'ayi',
        primary: wolioText,
        secondary: indonesiaText,
        isQuestion: true
      }]);
    } catch (error) {
      console.error('Conversation error:', error);
      setMessages(prev => [...prev, { role: 'ayi', primary: 'Umbemo?', secondary: 'Apa kabar?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', primary: input, secondary: null };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1beta' });

      if (mode === 'translate') {
        // Translation mode
        let prompt;
        if (translateDirection === 'id-wolio') {
          prompt = `
            Kamu adalah penerjemah ahli bahasa Wolio.
            REFERENSI KAMUS: ${dictionary.context}
            Terjemahkan ke Wolio: "${userInput}"
            INSTRUKSI: Pahami konteks, terjemahkan natural. RESPONS HANYA HASIL TERJEMAHAN.
          `;
        } else {
          prompt = `
            Kamu adalah penerjemah ahli bahasa Wolio.
            REFERENSI KAMUS: ${dictionary.context}
            Terjemahkan ke Indonesia: "${userInput}"
            INSTRUKSI: Pahami konteks, terjemahkan natural. RESPONS HANYA HASIL TERJEMAHAN.
          `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = stripMarkdown(response.text());

        setMessages(prev => [...prev, { role: 'bot', primary: text, secondary: null }]);
      } else {
        // Conversational mode - Ayi responds in Wolio
        const historyStr = conversationHistory.map(h => `${h.role}: ${h.wolio}`).join('\n');

        const prompt = `
          Kamu adalah Ayi, orang Buton yang berbicara bahasa Wolio. Kamu sedang berdiskusi dengan temanmu.
          
          RIWAYAT PERCAKAPAN:
          ${historyStr}
          Teman: "${userInput}"
          
          REFERENSI KAMUS WOLIO:
          ${dictionary.context.substring(0, 8000)}
          
          TUGAS:
          1. Evaluasi apakah respons teman sudah tepat/sesuai konteks percakapan
          2. Berikan respons dalam bahasa Wolio:
             - Jika tepat: puji dalam Wolio, lalu lanjutkan percakapan dengan pertanyaan/pernyataan baru
             - Jika kurang tepat atau tidak sesuai: koreksi dengan lembut dalam Wolio, berikan contoh yang benar
          
          FORMAT RESPONS (HARUS TEPAT):
          STATUS: [TEPAT atau PERLU_KOREKSI]
          RESPONS_WOLIO: [respons Ayi dalam bahasa Wolio - termasuk pujian/koreksi dan pertanyaan lanjutan]
          TERJEMAHAN: [terjemahan respons ke Indonesia]
          KOREKSI: [jika perlu koreksi, tuliskan cara yang benar. jika tepat, kosongkan]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const statusMatch = text.match(/STATUS:\s*(TEPAT|PERLU_KOREKSI)/i);
        const responsWolioMatch = text.match(/RESPONS_WOLIO:\s*(.+)/i);
        const terjemahanMatch = text.match(/TERJEMAHAN:\s*(.+)/i);
        const koreksiMatch = text.match(/KOREKSI:\s*(.+)/i);

        const isCorrect = statusMatch && statusMatch[1].toUpperCase() === 'TEPAT';
        const ayiWolio = responsWolioMatch ? stripMarkdown(responsWolioMatch[1]) : "Iyo!";
        const terjemahan = terjemahanMatch ? stripMarkdown(terjemahanMatch[1]) : "";
        const koreksi = koreksiMatch ? stripMarkdown(koreksiMatch[1]) : "";

        // Update conversation history
        setConversationHistory(prev => [
          ...prev,
          { role: 'teman', wolio: userInput },
          { role: 'ayi', wolio: ayiWolio }
        ]);

        // Show correction if needed
        if (!isCorrect && koreksi && koreksi.toLowerCase() !== 'kosongkan' && koreksi !== '-') {
          setMessages(prev => [...prev, {
            role: 'correction',
            primary: `💡 ${koreksi}`,
            secondary: null
          }]);
        }

        // Add Ayi's response
        setMessages(prev => [...prev, {
          role: 'ayi',
          primary: ayiWolio,
          secondary: terjemahan,
          isResponse: true
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'ayi', primary: 'Maaf, ada kesalahan. Coba lagi ya!', secondary: null }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTranslation = (index) => {
    setShowTranslation(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleDirection = () => {
    setTranslateDirection(prev => prev === 'id-wolio' ? 'wolio-id' : 'id-wolio');
  };

  return (
    <div className="app-container">
      <div className="glass-card">
        <header className="chat-header">
          <div className="header-icon">
            {mode === 'translate' ? <Languages size={24} color="#fff" /> : <GraduationCap size={24} color="#fff" />}
          </div>
          <div className="header-info">
            <h1>{mode === 'translate' ? 'Penerjemah Wolio' : 'Diskusi dengan Ayi'}</h1>
            <p>{mode === 'translate' ? 'Didukung oleh Gemini AI' : 'Belajar Bahasa Wolio'}</p>
          </div>
        </header>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'translate' ? 'active' : ''}`}
            onClick={() => setMode('translate')}
          >
            <Languages size={16} />
            <span>Terjemahan</span>
          </button>
          <button
            className={`mode-btn ${mode === 'learn' ? 'active' : ''}`}
            onClick={() => setMode('learn')}
          >
            <GraduationCap size={16} />
            <span>Diskusi</span>
          </button>
        </div>

        {/* Direction Toggle (only for translate mode) */}
        {mode === 'translate' && (
          <div className="direction-toggle">
            <button className="direction-btn" onClick={toggleDirection}>
              <span className={translateDirection === 'id-wolio' ? 'active-lang' : ''}>Indonesia</span>
              <ArrowLeftRight size={16} />
              <span className={translateDirection === 'wolio-id' ? 'active-lang' : ''}>Wolio</span>
            </button>
          </div>
        )}

        <main className="chat-window">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`message-wrapper ${msg.role}`}
              >
                {msg.role === 'ayi' && (
                  <div className="avatar ayi-avatar">
                    🧑‍🏫
                  </div>
                )}
                {msg.role === 'bot' && (
                  <div className="avatar">
                    <Bot size={18} />
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="avatar">
                    <User size={18} />
                  </div>
                )}

                <div className="message-content">
                  {msg.role === 'correction' ? (
                    <div className="correction-bubble">
                      {msg.primary}
                    </div>
                  ) : (
                    <>
                      <div className={`message-bubble shadow-premium ${msg.isQuestion ? 'question-bubble' : ''}`}>
                        {msg.primary || msg.text}
                      </div>

                      {msg.secondary && (
                        <div className="translation-section">
                          {!showTranslation[index] ? (
                            <button
                              className="toggle-translation-btn"
                              onClick={() => toggleTranslation(index)}
                            >
                              💡 Lihat terjemahan
                            </button>
                          ) : (
                            <>
                              <div className="message-bubble-small translation-bubble">
                                {msg.secondary}
                              </div>
                              <button
                                className="toggle-translation-btn"
                                onClick={() => toggleTranslation(index)}
                              >
                                Sembunyikan
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`message-wrapper ${mode === 'learn' ? 'ayi' : 'bot'}`}
            >
              <div className={`avatar ${mode === 'learn' ? 'ayi-avatar' : ''}`}>
                {mode === 'learn' ? '🧑‍🏫' : <Bot size={18} />}
              </div>
              <div className="message-bubble loading shadow-premium">
                <Loader2 className="animate-spin" size={18} />
                <span>{mode === 'translate' ? 'Menerjemahkan...' : 'Ayi sedang berpikir...'}</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="chat-input-area">
          <div className="input-container shadow-premium">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                mode === 'translate'
                  ? (translateDirection === 'id-wolio' ? 'Ketik dalam bahasa Indonesia...' : 'Ketik dalam bahasa Wolio...')
                  : 'Jawab dalam bahasa Wolio...'
              }
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="send-button"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
