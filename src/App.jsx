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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1beta' });

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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1beta' });

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
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>
      <div className="bg-blob bg-blob-3"></div>
      <div className="glass-card">
        {mode === 'about' ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="about-view"
          >
            <header className="chat-header">
              <button className="back-button" onClick={() => setMode('translate')}>
                <ArrowLeftRight size={20} />
              </button>
              <div className="header-info">
                <h1>Tentang Aindea</h1>
                <p>Mengenal lebih dekat</p>
              </div>
            </header>
            <main className="about-content">
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="about-section"
              >
                <h2>🌟 Tujuan Proyek</h2>
                <div className="glass-inner-card">
                  <p>Aindea adalah asisten digital cerdas untuk melestarikan <strong>Bahasa Wolio</strong>. Melalui teknologi AI, kami mendigitalisasi literatur Buton agar tetap hidup di era modern.</p>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="about-section"
              >
                <h2>🧔 Profil Pengembang</h2>
                <div className="profile-card premium-shadow">
                  <div className="profile-header">
                    <div className="profile-avatar ripple">MF</div>
                    <div className="profile-info">
                      <h3>Muhdan Fyan Syah Sofian</h3>
                      <p className="subtitle">Full Stack Developer | Mentor</p>
                    </div>
                  </div>
                  <div className="profile-body">
                    <p className="profile-bio">
                      Berpengalaman 10+ tahun. IT Freelancer, Marbot Masjid, dan Mentor di <strong>Pondok Informatika</strong>. Berdedikasi menggabungkan teknologi dengan nilai religi dan budaya.
                    </p>
                    <div className="profile-links">
                      <a href="https://muhdanfyan.github.io" target="_blank" rel="noopener noreferrer" className="premium-link-btn">
                        <ExternalLink size={14} />
                        <span>Visit Portfolio</span>
                      </a>
                    </div>
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
                <div className="tech-stack-container">
                  <span className="tech-tag">React.js</span>
                  <span className="tech-tag">Gemini AI</span>
                  <span className="tech-tag">Framer Motion</span>
                  <span className="tech-tag">Lucide Icons</span>
                  <span className="tech-tag">Vite</span>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="about-section references"
              >
                <h2>📚 Referensi</h2>
                <div className="references-grid">
                  <div className="ref-item">Kamus Ungkapan Wolio (1985)</div>
                  <div className="ref-item">Kamus Husen Abas</div>
                  <div className="ref-item">Grammar by J.C. Anceaux</div>
                </div>
              </motion.section>
            </main>
          </motion.div>
        ) : (
          <>
            <header className="chat-header">
              <div className="header-icon">
                {mode === 'translate' ? <Languages size={24} color="#fff" /> : <GraduationCap size={24} color="#fff" />}
              </div>
              <div className="header-info">
                <h1>{mode === 'translate' ? 'Penerjemah Wolio' : 'Diskusi dengan La Ayi'}</h1>
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
                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: msg.isResponse ? 0.3 : 0 }}
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`message-wrapper ayi ayi-thinking`}
                >
                  <div className="avatar ayi-avatar">
                    🧑‍🏫
                  </div>
                  <div className="message-bubble loading shadow-premium">
                    <Loader2 className="animate-spin" size={18} />
                    <span>{mode === 'translate' ? 'Menerjemahkan...' : 'La Ayi sedang berpikir...'}</span>
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
          </>
        )}
      </div>
      <footer className="app-footer-links">
        <button
          onClick={() => setMode('about')}
          className="dev-link"
        >
          <Info size={14} />
          <span>Tentang Aindea & Profil Pengembang</span>
        </button>
      </footer>
    </div>
  );
}

export default App;
