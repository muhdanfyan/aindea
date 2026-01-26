import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Languages, GraduationCap, ArrowLeftRight, CheckCircle, XCircle, Info, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dictionary from './dictionary.json';
import grammar from './wolio_grammar.json';
import './App.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
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
      setConversationHistory([]);
    } else if (mode === 'learn') {
      // Ayi Conversational Mode
      setMessages([
        {
          role: 'ayi',
          primary: "Tabea! Yaku Ayi. 👋",
          secondary: "Halo! Saya Ayi.",
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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Helper to get relevant dictionary context
      const getRelevantContext = (query, limit = 50) => {
        if (!dictionary.entries) return "";

        let filtered = dictionary.entries;
        if (query) {
          const searchTerms = query.toLowerCase().split(/\s+/);
          filtered = dictionary.entries.filter(entry =>
            searchTerms.some(term =>
              entry.word.toLowerCase().includes(term) ||
              entry.definition.toLowerCase().includes(term) ||
              entry.example_id.toLowerCase().includes(term)
            )
          );
        }

        // If query too specific or no results, just take some general ones
        if (filtered.length === 0) {
          filtered = dictionary.entries.slice(0, limit);
        } else {
          filtered = filtered.slice(0, limit);
        }

        return filtered.map(e => `${e.word} (${e.definition}): ${e.example_wolio} -> ${e.example_id}`).join('\n');
      };

      const dictionaryContext = getRelevantContext(null); // Initial context for conversation start

      const prompt = `
        Kamu adalah Ayi, orang Buton yang berbicara bahasa Wolio secara alami. Kamu ingin mengajak temanmu berdiskusi dalam bahasa Wolio.
        
        ATURAN GRAMATIKA WOLIO (PENTING):
        - Semua kata Wolio berakhir dengan vokal (a, e, i, o, u)
        - Prefix ko- = memiliki/memakai (kobaju = memakai baju)
        - Prefix ma- = sifat/keadaan (malape = baik, masodo = panas)
        - Suffix -mo = sudah/telah (umbeamo = sudah datang)
        - Urutan kalimat: Subjek-Verba-Objek
        - Kata ganti: aku/yaku (saya), ingko (kamu), incia (dia)
        
        KATA-KATA UMUM:
        ${JSON.stringify(grammar.common_words, null, 2)}
        
        REFERENSI KAMUS WOLIO (Gunakan sebagai referensi kosakata):
        ${dictionaryContext}
        
        TUGAS:
        Ajukan pertanyaan sederhana dalam bahasa Wolio untuk memulai percakapan sehari-hari.
        Contoh topik: kabar, nama, kegiatan hari ini, makanan, keluarga.
        
        FORMAT RESPONS (HARUS TEPAT):
        WOLIO: [pertanyaan dalam bahasa Wolio yang natural - HARUS berakhir vokal]
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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const getRelevantContext = (query, limit = 100) => {
        if (!dictionary.entries) return "";
        const searchTerms = query.toLowerCase().split(/\s+/);
        let filtered = dictionary.entries.filter(entry =>
          searchTerms.some(term =>
            entry.word.toLowerCase().includes(term) ||
            entry.definition.toLowerCase().includes(term) ||
            entry.example_id.toLowerCase().includes(term) ||
            entry.example_wolio.toLowerCase().includes(term)
          )
        );

        if (filtered.length < 20) {
          // Add some general ones if too few results
          filtered = [...filtered, ...dictionary.entries.slice(0, 20)];
        }

        return filtered.slice(0, limit).map(e => `${e.word} (${e.definition}): ${e.example_wolio} -> ${e.example_id}`).join('\n');
      };

      if (mode === 'translate') {
        // Translation mode
        const dictionaryContext = getRelevantContext(userInput);
        let prompt;
        if (translateDirection === 'id-wolio') {
          prompt = `
            Kamu adalah penerjemah ahli bahasa Wolio.
            REFERENSI KAMUS: 
            ${dictionaryContext}

            Terjemahkan ke Wolio: "${userInput}"
            INSTRUKSI: Pahami konteks, terjemahkan natural. RESPONS HANYA HASIL TERJEMAHAN.
          `;
        } else {
          prompt = `
            Kamu adalah penerjemah ahli bahasa Wolio.
            REFERENSI KAMUS: 
            ${dictionaryContext}

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

        const dictionaryContext = getRelevantContext(userInput);
        const prompt = `
          Kamu adalah Ayi, orang Buton yang berbicara bahasa Wolio secara alami dan fasih.
          
          ATURAN GRAMATIKA WOLIO (WAJIB DIIKUTI):
          - Semua kata Wolio HARUS berakhir dengan vokal (a, e, i, o, u)
          - Prefix: ko- (memiliki), ma- (sifat), po-/pe- (aksi), me- (berkelanjutan)
          - Suffix: -mo (sudah), -po (dulu), -aka (menyebabkan)
          - Reduplikasi = intensif/berulang (malape-lape = sangat baik)
          - Urutan: Subjek-Verba-Objek
          
          KATA-KATA UMUM:
          ${JSON.stringify(grammar.common_words, null, 2)}
          
          RIWAYAT PERCAKAPAN:
          ${historyStr}
          Teman: "${userInput}"
          
          REFERENSI KAMUS WOLIO (Gunakan untuk mengevaluasi dan merespons):
          ${dictionaryContext}
          
          TUGAS:
          1. Evaluasi apakah respons teman sudah tepat/sesuai konteks percakapan
          2. Berikan respons dalam bahasa Wolio yang BENAR secara gramatika:
             - Jika tepat: puji dalam Wolio, lalu lanjutkan percakapan
             - Jika kurang tepat: koreksi dengan lembut dalam Wolio, berikan contoh yang benar
          
          FORMAT RESPONS (HARUS TEPAT):
          STATUS: [TEPAT atau PERLU_KOREKSI]
          RESPONS_WOLIO: [respons Ayi dalam bahasa Wolio - SEMUA kata harus berakhir vokal]
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
        {mode === 'about' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="about-view"
          >
            <header className="about-header">
              <button className="back-button" onClick={() => setMode('translate')}>
                <ArrowLeftRight size={20} />
              </button>
              <div className="header-info">
                <h1>Tentang Aindea</h1>
                <p>Digitalisasi Warisan Buton</p>
              </div>
            </header>

            <main className="about-content">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hero-branding"
              >
                <div className="hero-logo">
                  <img src="/logo.png" alt="Aindea Mark" />
                </div>
              </motion.div>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="about-section"
              >
                <h2>🚀 Visi & Misi</h2>
                <div className="about-card">
                  <p className="project-desc">
                    Aindea bukan sekadar penerjemah. Ini adalah upaya digitalisasi budaya untuk memastikan <strong>Bahasa Wolio</strong> tetap relevan di era kecerdasan buatan. Melalui integrasi literatur klasik dan teknologi Gemini AI, kami menghadirkan tutor bahasa yang cerdas dan berakar pada tradisi.
                  </p>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="about-section"
              >
                <h2>🧑‍💻 Profil Pengembang</h2>
                <div className="profile-card">
                  <div className="profile-header">
                    <div className="profile-avatar developer-photo">
                      <img src="https://res.cloudinary.com/duntlhjil/image/upload/v1765759801/pisantri/fotosantri/xcbhj9tffpopikh0mvrv.jpg" alt="Muhdan Fyan Syah Sofian" />
                    </div>
                    <div className="profile-info">
                      <h3>Muhdan Fyan Syah Sofian</h3>
                      <p>Full Stack & AI Enthusiast</p>
                    </div>
                  </div>
                  <p className="profile-bio">
                    Berdedikasi lebih dari 10 tahun dalam pengembangan perangkat lunak. Pengasuh di <a href="https://pondokinformatika.id" target="_blank" rel="noopener noreferrer" className="inline-link">Pondok Informatika</a> dan aktif dalam pengembangan komunitas lokal di Buton.
                  </p>
                  <div className="profile-socials">
                    <a href="https://muhdanfyan.github.io" target="_blank" rel="noopener noreferrer" className="social-link">
                      <ExternalLink size={16} />
                      <span>Portfolio</span>
                    </a>
                    <a href="https://github.com/muhdanfyan" target="_blank" rel="noopener noreferrer" className="social-link">
                      <Send size={16} />
                      <span>GitHub</span>
                    </a>
                  </div>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="about-section"
              >
                <h2>🛠️ Teknologi</h2>
                <div className="tech-grid">
                  <div className="tech-item">
                    <Bot size={24} color="#00D1B2" />
                    <span>Gemini AI</span>
                  </div>
                  <div className="tech-item">
                    <GraduationCap size={24} color="#00D1B2" />
                    <span>React JS</span>
                  </div>
                  <div className="tech-item">
                    <Languages size={24} color="#00D1B2" />
                    <span>Vite</span>
                  </div>
                  <div className="tech-item">
                    <Info size={24} color="#00D1B2" />
                    <span>Lucide</span>
                  </div>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="about-section"
              >
                <h2>📚 Referensi Literasi</h2>
                <div className="references-list">
                  <div className="ref-card">Kamus Ungkapan Wolio-Indonesia (1985)</div>
                  <div className="ref-card">Tata Bahasa Wolio (J.C. Anceaux)</div>
                  <div className="ref-card">Kamus Lengkap Husen Abas</div>
                </div>
              </motion.section>
            </main>
          </motion.div>
        ) : (
          <div className="chat-view">
            <header className="chat-header">
              <div className="header-icon branding">
                <img src="/logo.png" alt="Aindea Logo" />
              </div>
              <div className="header-info">
                <h1>{mode === 'translate' ? 'Aindea: Penerjemah' : 'Aindea: Tutor Wolio'}</h1>
                <p>{mode === 'translate' ? 'Penerjemah Cerdas Bahasa Wolio' : 'Belajar Langsung dengan La Ayi'}</p>
              </div>
            </header>

            <div className="controls-area">
              <div className="mode-toggle">
                <button className={`mode-btn ${mode === 'translate' ? 'active' : ''}`} onClick={() => setMode('translate')}>
                  <Languages size={16} />
                  <span>Terjemahan</span>
                </button>
                <button className={`mode-btn ${mode === 'learn' ? 'active' : ''}`} onClick={() => setMode('learn')}>
                  <GraduationCap size={16} />
                  <span>Diskusi</span>
                </button>
              </div>

              <AnimatePresence>
                {mode === 'translate' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="direction-toggle">
                    <button className="direction-btn" onClick={toggleDirection}>
                      <span className={translateDirection === 'id-wolio' ? 'active-lang' : ''}>Indonesia</span>
                      <ArrowLeftRight size={16} />
                      <span className={translateDirection === 'wolio-id' ? 'active-lang' : ''}>Wolio</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <main className="chat-window">
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => (
                  <div key={index} className={`message-wrapper ${msg.role}`}>
                    {(msg.role === 'ayi' || msg.role === 'bot') && (
                      <div className={`avatar ${msg.role === 'ayi' ? 'ayi-avatar' : ''}`}>
                        {msg.role === 'ayi' ? '🧑‍🏫' : <Bot size={18} />}
                      </div>
                    )}
                    {msg.role === 'user' && <div className="avatar"><User size={18} /></div>}

                    <div className="message-content">
                      {msg.role === 'correction' ? (
                        <div className="correction-text">
                          {msg.primary || msg.text}
                        </div>
                      ) : (
                        <div className={`message-bubble ${msg.isQuestion ? 'question-bubble' : ''}`}>
                          {msg.primary || msg.text}
                        </div>
                      )}

                      {msg.secondary && (
                        <div className="translation-section">
                          {!showTranslation[index] ? (
                            <button className="toggle-translation-btn" onClick={() => toggleTranslation(index)}>💡 Lihat terjemahan</button>
                          ) : (
                            <>
                              <div className="message-bubble-small translation-bubble">{msg.secondary}</div>
                              <button className="toggle-translation-btn" onClick={() => toggleTranslation(index)}>Sembunyikan</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="message-wrapper ayi ayi-thinking">
                  <div className="avatar ayi-avatar">🧑‍🏫</div>
                  <div className="message-bubble loading">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="loading-text">La Ayi mefiki-fikiri...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </main>

            <footer className="chat-input-area">
              <div className="input-container">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={mode === 'translate' ? 'Ketik pesan...' : 'Jawab dalam bahasa Wolio...'}
                  disabled={isLoading}
                />
                <button onClick={handleSend} disabled={!input.trim() || isLoading} className="send-button">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </footer>
          </div>
        )}
      </div>
      <footer className="app-footer-links">
        <button onClick={() => setMode('about')} className="dev-link">
          <Info size={14} />
          <span>Tentang Aindea</span>
        </button>
      </footer>
    </div>
  );
}

export default App;
