import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Languages, MessageCircle, ArrowLeftRight } from 'lucide-react';
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
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
    .replace(/\*(.*?)\*/g, '$1')       // Remove *italic*
    .replace(/__(.*?)__/g, '$1')       // Remove __underline__
    .replace(/_(.*?)_/g, '$1')         // Remove _italic_
    .replace(/`(.*?)`/g, '$1')         // Remove `code`
    .trim();
};

function App() {
  const [mode, setMode] = useState('translate'); // 'translate' or 'discuss'
  const [translateDirection, setTranslateDirection] = useState('id-wolio'); // 'id-wolio' or 'wolio-id'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (mode === 'translate') {
      const directionText = translateDirection === 'id-wolio'
        ? 'Indonesia → Wolio'
        : 'Wolio → Indonesia';
      setMessages([
        { role: 'bot', text: `Halo! Saya asisten penerjemah bahasa Wolio. Mode: ${directionText}. Ketik teks yang ingin diterjemahkan.`, wolio: null }
      ]);
    } else {
      setMessages([
        { role: 'bot', text: 'Mari berdiskusi dalam bahasa Wolio! Saya akan mengajukan pertanyaan, dan Anda bisa menjawab dalam bahasa Indonesia.', wolio: null }
      ]);
      startDiscussion();
    }
    setShowTranslation({});
  }, [mode, translateDirection]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startDiscussion = async () => {
    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1beta' });

      const prompt = `
        Kamu adalah guru bahasa Wolio yang ahli dan sabar.
        
        LANGKAH 1 - REFERENSI KAMUS:
        Pelajari kamus Wolio berikut untuk memahami kosakata dan pola bahasa Wolio:
        ${dictionary.context.substring(0, 8000)}
        
        LANGKAH 2 - BUAT PERTANYAAN:
        Ajukan satu pertanyaan sederhana dalam bahasa Wolio kepada siswa.
        Pertanyaan harus mudah dipahami dan menggunakan kosakata dari kamus di atas.
        
        FORMAT RESPONS (HARUS TEPAT):
        WOLIO: [pertanyaan dalam bahasa Wolio - harus natural dan benar secara tata bahasa]
        INDONESIA: [terjemahan pertanyaan dalam bahasa Indonesia]
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const wolioMatch = text.match(/WOLIO:\s*(.+)/i);
      const indonesiaMatch = text.match(/INDONESIA:\s*(.+)/i);

      const wolioText = wolioMatch ? stripMarkdown(wolioMatch[1]) : stripMarkdown(text);
      const indonesiaText = indonesiaMatch ? stripMarkdown(indonesiaMatch[1]) : '';

      const botMessage = {
        role: 'bot',
        primary: wolioText,
        secondary: indonesiaText,
        isWolioPrimary: true
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Discussion error:', error);
      setMessages(prev => [...prev, { role: 'bot', primary: 'Maaf, terjadi kesalahan. Silakan coba lagi.', secondary: null }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', primary: input, secondary: null };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1beta' });

      let prompt;
      if (mode === 'translate') {
        if (translateDirection === 'id-wolio') {
          prompt = `
            Kamu adalah penerjemah ahli bahasa Wolio (bahasa daerah Sulawesi Tenggara, Indonesia).
            
            LANGKAH 1 - PAHAMI KONTEKS:
            Baca dan pahami dulu makna dari teks berikut ini. Perhatikan konteks, maksud, dan nuansa yang ingin disampaikan.
            
            LANGKAH 2 - REFERENSI KAMUS:
            Gunakan kamus Wolio berikut sebagai referensi utama untuk menerjemahkan:
            ${dictionary.context}
            
            LANGKAH 3 - TERJEMAHKAN:
            Teks Indonesia yang akan diterjemahkan: "${input}"
            
            INSTRUKSI PENTING:
            1. Pahami dulu MAKNA dan KONTEKS teks, bukan hanya kata per kata.
            2. Cari padanan kata dalam kamus yang sesuai dengan konteks.
            3. Jika kata tidak ada di kamus, gunakan pola bahasa Wolio yang umum.
            4. Pastikan terjemahan terdengar alami dalam bahasa Wolio.
            5. RESPONS HANYA BERISI HASIL TERJEMAHAN WOLIO SAJA, tanpa penjelasan.
          `;
        } else {
          prompt = `
            Kamu adalah penerjemah ahli bahasa Wolio (bahasa daerah Sulawesi Tenggara, Indonesia).
            
            LANGKAH 1 - PAHAMI KONTEKS:
            Baca dan pahami dulu makna dari teks Wolio berikut ini. Perhatikan konteks dan maksud yang ingin disampaikan.
            
            LANGKAH 2 - REFERENSI KAMUS:
            Gunakan kamus Wolio berikut sebagai referensi untuk memahami arti kata:
            ${dictionary.context}
            
            LANGKAH 3 - TERJEMAHKAN:
            Teks Wolio yang akan diterjemahkan: "${input}"
            
            INSTRUKSI PENTING:
            1. Pahami dulu MAKNA dan KONTEKS teks Wolio tersebut.
            2. Cari arti kata dalam kamus yang sesuai dengan konteks.
            3. Jika kata tidak ada di kamus, coba deduksi dari konteks.
            4. Pastikan terjemahan terdengar alami dalam bahasa Indonesia.
            5. RESPONS HANYA BERISI HASIL TERJEMAHAN INDONESIA SAJA, tanpa penjelasan.
          `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = stripMarkdown(response.text());

        const botMessage = { role: 'bot', primary: text, secondary: null };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // Discussion mode
        prompt = `
          Kamu adalah guru bahasa Wolio yang ahli dan sabar. Siswa menjawab dalam bahasa Indonesia.
          
          LANGKAH 1 - PAHAMI JAWABAN SISWA:
          Baca dan pahami dulu makna dari jawaban siswa ini: "${input}"
          Perhatikan konteks, maksud, dan nuansa yang ingin disampaikan siswa.
          
          LANGKAH 2 - REFERENSI KAMUS WOLIO:
          Gunakan kamus Wolio berikut sebagai referensi utama untuk menerjemahkan:
          ${dictionary.context.substring(0, 8000)}
          
          LANGKAH 3 - TERJEMAHKAN DAN TANGGAPI:
          1. Terjemahkan jawaban siswa ke bahasa Wolio dengan memahami konteksnya, bukan kata per kata
          2. Berikan tanggapan/feedback singkat dalam bahasa Wolio yang natural
          3. Ajukan pertanyaan baru dalam bahasa Wolio
          
          FORMAT RESPONS (HARUS TEPAT):
          TERJEMAHAN_WOLIO: [terjemahan jawaban siswa ke Wolio - harus natural dan sesuai konteks]
          TANGGAPAN_WOLIO: [tanggapan dalam Wolio]
          TANGGAPAN_INDONESIA: [terjemahan tanggapan]
          PERTANYAAN_WOLIO: [pertanyaan baru dalam Wolio]
          PERTANYAAN_INDONESIA: [terjemahan pertanyaan]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const translationMatch = text.match(/TERJEMAHAN_WOLIO:\s*(.+)/i);
        const tanggapanWolioMatch = text.match(/TANGGAPAN_WOLIO:\s*(.+)/i);
        const tanggapanIndonesiaMatch = text.match(/TANGGAPAN_INDONESIA:\s*(.+)/i);
        const pertanyaanWolioMatch = text.match(/PERTANYAAN_WOLIO:\s*(.+)/i);
        const pertanyaanIndonesiaMatch = text.match(/PERTANYAAN_INDONESIA:\s*(.+)/i);

        // Add translation of user's answer (small bubble - Indonesian source, large bubble - Wolio translation)
        if (translationMatch) {
          setMessages(prev => [...prev, {
            role: 'system',
            primary: stripMarkdown(translationMatch[1]),
            secondary: input,
            isWolioPrimary: true,
            isUserTranslation: true
          }]);
        }

        // Add bot response (Wolio primary, Indonesian secondary)
        if (tanggapanWolioMatch) {
          setMessages(prev => [...prev, {
            role: 'bot',
            primary: stripMarkdown(tanggapanWolioMatch[1]),
            secondary: tanggapanIndonesiaMatch ? stripMarkdown(tanggapanIndonesiaMatch[1]) : '',
            isWolioPrimary: true
          }]);
        }

        // Add new question
        if (pertanyaanWolioMatch) {
          setMessages(prev => [...prev, {
            role: 'bot',
            primary: stripMarkdown(pertanyaanWolioMatch[1]),
            secondary: pertanyaanIndonesiaMatch ? stripMarkdown(pertanyaanIndonesiaMatch[1]) : '',
            isWolioPrimary: true,
            isQuestion: true
          }]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'bot', primary: 'Maaf, terjadi kesalahan. Silakan coba lagi.', secondary: null }]);
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
            <Languages size={24} color="#fff" />
          </div>
          <div className="header-info">
            <h1>Penerjemah Wolio</h1>
            <p>Didukung oleh Gemini AI</p>
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
            className={`mode-btn ${mode === 'discuss' ? 'active' : ''}`}
            onClick={() => setMode('discuss')}
          >
            <MessageCircle size={16} />
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
                className={`message-wrapper ${msg.role} ${msg.isUserTranslation ? 'user-translation' : ''}`}
              >
                {msg.role !== 'system' && (
                  <div className="avatar">
                    {msg.role === 'bot' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                )}
                <div className="message-content">
                  {/* Primary bubble (large) */}
                  <div className={`message-bubble shadow-premium ${msg.isWolioPrimary ? 'wolio-bubble' : ''}`}>
                    {msg.primary || msg.text}
                  </div>

                  {/* Secondary bubble (small translation) */}
                  {msg.secondary && (
                    <div className="translation-section">
                      {mode === 'discuss' && !showTranslation[index] ? (
                        <button
                          className="toggle-translation-btn"
                          onClick={() => toggleTranslation(index)}
                        >
                          Lihat terjemahan
                        </button>
                      ) : null}

                      {(mode === 'translate' || showTranslation[index]) && (
                        <div className="message-bubble-small translation-bubble">
                          {msg.secondary}
                        </div>
                      )}

                      {mode === 'discuss' && showTranslation[index] && (
                        <button
                          className="toggle-translation-btn"
                          onClick={() => toggleTranslation(index)}
                        >
                          Sembunyikan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="message-wrapper bot"
            >
              <div className="avatar"><Bot size={18} /></div>
              <div className="message-bubble loading shadow-premium">
                <Loader2 className="animate-spin" size={18} />
                <span>{mode === 'translate' ? 'Menerjemahkan...' : 'Berpikir...'}</span>
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
                  : 'Jawab dalam bahasa Indonesia...'
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
