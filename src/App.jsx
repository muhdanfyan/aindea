import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Languages, GraduationCap, ArrowLeftRight, CheckCircle, XCircle, Info, ExternalLink, Trash2, Book, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dictionary from './dictionary.json';
import grammar from './wolio_grammar.json';
import phrases from './wolio_phrases.json';
import './App.css';

// Helper function to call Gemini via Netlify Function Proxy
const callGeminiProxy = async (modelName, prompt) => {
  const response = await fetch('/.netlify/functions/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelName, prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Proxy error: ${response.status}`);
  }

  return await response.json();
};

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

// Storage keys for different modes
const STORAGE_KEYS = {
  translate: 'aindea_chat_translate',
  learn: 'aindea_chat_learn'
};

function App() {
  const [mode, setMode] = useState('translate');
  const [translateDirection, setTranslateDirection] = useState('id-wolio');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState({});
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [dictionarySearch, setDictionarySearch] = useState('');
  const [dictionaryMode, setDictionaryMode] = useState('id-wolio');
  const messagesEndRef = useRef(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    // Check first-time visitor
    const seenWelcome = localStorage.getItem('aindea_welcome_seen');
    if (!seenWelcome) {
      setShowWelcome(true);
    }

    const savedMessages = localStorage.getItem(STORAGE_KEYS[mode]);
    const savedHistory = localStorage.getItem(`${STORAGE_KEYS[mode]}_history`);

    if (savedMessages) {
      try {
        const parsedMsgs = JSON.parse(savedMessages);
        if (parsedMsgs.length > 0) {
          setMessages(parsedMsgs);
          if (savedHistory) setConversationHistory(JSON.parse(savedHistory));
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }

    // Default initialization if no history
    if (mode === 'translate') {
      const directionText = translateDirection === 'id-wolio' ? 'Indonesia → Wolio' : 'Wolio → Indonesia';
      setMessages([{ role: 'bot', text: `Halo! Saya asisten penerjemah bahasa Wolio. Mode: ${directionText}. Ketik teks yang ingin diterjemahkan.` }]);
    } else if (mode === 'learn') {
      setMessages([{ role: 'ayi', primary: "Tabea! Yaku Ayi. 👋", secondary: "Halo! Saya Ayi.", isGreeting: true }]);
      startConversation();
    }
  }, [mode]); // Re-run when mode changes

  // Save messages and history to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEYS[mode], JSON.stringify(messages));
      localStorage.setItem(`${STORAGE_KEYS[mode]}_history`, JSON.stringify(conversationHistory));
    }
  }, [messages, mode, conversationHistory]);

  // Sync state across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS[mode]) {
        try {
          setMessages(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Storage sync error:', err);
        }
      }
      if (e.key === `${STORAGE_KEYS[mode]}_history`) {
        try {
          setConversationHistory(JSON.parse(e.newValue));
        } catch (err) {
          console.error('History sync error:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mode]);

  // Clear chat function
  const clearChat = () => {
    localStorage.removeItem(STORAGE_KEYS[mode]);
    localStorage.removeItem(`${STORAGE_KEYS[mode]}_history`);

    if (mode === 'translate') {
      const directionText = translateDirection === 'id-wolio'
        ? 'Indonesia → Wolio'
        : 'Wolio → Indonesia';
      setMessages([
        { role: 'bot', text: `Halo! Saya asisten penerjemah bahasa Wolio. Mode: ${directionText}. Ketik teks yang ingin diterjemahkan.` }
      ]);
    } else {
      setMessages([
        {
          role: 'ayi',
          primary: "Tabea! Yaku Ayi. 👋",
          secondary: "Halo! Saya Ayi.",
          isGreeting: true
        }
      ]);
      startConversation();
    }
    setConversationHistory([]);
    setShowTranslation({});
  };

  const closeWelcome = () => {
    localStorage.setItem('aindea_welcome_seen', 'true');
    setShowWelcome(false);
  };

  const welcomeSlides = [
    {
      title: "Tabea! 👋",
      subtitle: "Selamat Datang di Aindea",
      content: "Aindea adalah asisten digital cerdas yang dirancang khusus untuk melestarikan dan memperkenalkan kekayaan Bahasa Wolio.",
      icon: <Bot size={48} className="welcome-icon-large" />
    },
    {
      title: "Kenali La Ayi 🧑‍🏫",
      subtitle: "Teman Diskusi Anda",
      content: "Bicara langsung dengan La Ayi dalam mode Diskusi. La Ayi akan membantu Anda berlatih dan memberikan koreksi tata bahasa secara natural.",
      icon: <GraduationCap size={48} className="welcome-icon-large" />
    },
    {
      title: "Fitur Cerdas 💡",
      subtitle: "Terjemahan & Kamus",
      content: "Gunakan fitur Penerjemah untuk komunikasi cepat atau Kamus Per Kata untuk memahami kosakata lebih mendalam.",
      icon: <Languages size={48} className="welcome-icon-large" />
    },
    {
      title: "Warisan Buton 🏰",
      subtitle: "Digitalisasi Budaya",
      content: "Mari bersama menjaga kelestarian Bahasa Wolio. Setiap kata yang Anda pelajari adalah langkah kecil menjaga budaya Buton.",
      icon: <CheckCircle size={48} className="welcome-icon-large" />
    },
    {
      title: "Siap Menjelajah? 🚀",
      subtitle: "Ringkasan Fitur Aindea",
      content: "Semua alat yang Anda butuhkan untuk menguasai Bahasa Wolio ada di sini.",
      isSummary: true,
      features: [
        { icon: <Languages size={20} />, label: "Penerjemah Cerdas" },
        { icon: <GraduationCap size={20} />, label: "Tutor Diskusi" },
        { icon: <Book size={20} />, label: "Kamus Per Kata" },
        { icon: <CheckCircle size={20} />, label: "Koreksi Otomatis" }
      ]
    }
  ];

  useEffect(() => {
    if (mode === 'translate') {
      const directionText = translateDirection === 'id-wolio'
        ? 'Indonesia → Wolio'
        : 'Wolio → Indonesia';
      // Only set welcome message if empty or just containing the welcome message
      if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'bot')) {
        setMessages([{ role: 'bot', text: `Halo! Saya asisten penerjemah bahasa Wolio. Mode: ${directionText}. Ketik teks yang ingin diterjemahkan.` }]);
      }
    }
    setShowTranslation({});
  }, [translateDirection]); // Removed 'mode' from dependency to let the new useEffect handle it

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      // Use proxy instead of direct model

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
        
        WOLIO: [pertanyaan atau sapaan dalam bahasa Wolio yang natural dan hangat - HARUS berakhir vokal]
        INDONESIA: [terjemahan ke Indonesia]
      `;

      const result = await callGeminiProxy("gemini-2.5-flash", prompt);
      const text = result.text;

      const wolioMatch = text.match(/WOLIO:\s*(.+)/i);
      const indonesiaMatch = text.match(/INDONESIA:\s*(.+)/i);

      const wolioText = wolioMatch ? stripMarkdown(wolioMatch[1]) : "Tabea, umbemo?";
      const indonesiaText = indonesiaMatch ? stripMarkdown(indonesiaMatch[1]) : "Halo, apa kabar?";

      setConversationHistory([{ role: 'ayi', wolio: wolioText }]);

      setMessages(prev => [...prev, {
        role: 'ayi',
        primary: wolioText,
        secondary: indonesiaText,
        isQuestion: true
      }]);
    } catch (error) {
      console.error('Conversation error:', error);
      if (error.message?.includes('429')) {
        setMessages(prev => [...prev, { role: 'ayi', primary: 'Waduu, La Ayi te mofiki-fikiri bari! (Quota Limit). Tunggu sebentar ya...', secondary: null }]);
      } else {
        setMessages(prev => [...prev, { role: 'ayi', primary: 'Tabea, umbemo?', secondary: 'Halo, apa kabar?' }]);
      }
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
      // Use proxy instead of direct model

      const getRelevantContext = (query, limit = 40) => {
        if (!dictionary.entries) return "";
        const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

        let filtered = dictionary.entries.filter(entry =>
          searchTerms.some(term =>
            entry.word.toLowerCase().includes(term) ||
            entry.definition.toLowerCase().includes(term)
          )
        );

        // If too many results or no search terms, pick representative ones
        if (filtered.length === 0 || searchTerms.length === 0) {
          filtered = dictionary.entries.filter(e => e.word.length < 6).slice(0, 15);
        }

        return filtered.slice(0, limit).map(e => `${e.word}: ${e.definition}`).join('\n');
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

        const result = await callGeminiProxy("gemini-2.5-flash", prompt);
        const text = stripMarkdown(result.text);

        setMessages(prev => [...prev, { role: 'bot', primary: text, secondary: null }]);
      } else {
        // Conversational mode - Ayi responds in Wolio
        const historyStr = conversationHistory.map(h => `${h.role}: ${h.wolio}`).join('\n');

        const dictionaryContext = getRelevantContext(userInput);
        const prompt = `
          Kamu adalah Ayi, orang Buton yang berbicara bahasa Wolio secara alami dan fasih.
          
          PETUNJUK LINGUISTIK WOLIO (PENTING):
          FONOLOGI: ${JSON.stringify(grammar.phonology.rules)}
          MORFOLOGI (PREFIX): ${JSON.stringify(grammar.morphology.prefixes)}
          MORFOLOGI (SUFFIX): ${JSON.stringify(grammar.morphology.suffixes)}
          SINTAKSIS (POLA): ${JSON.stringify(grammar.syntax.phrase_patterns)}
          KATA GANTI (CLITIC): ${JSON.stringify(grammar.pronouns.subject_clitics)}
          
          RIWAYAT PERCAKAPAN:
          ${historyStr}
          Teman: "${userInput}"
          
          REFERENSI FRASE IDIOMATIK:
          ${JSON.stringify(phrases.categories, null, 1)}

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

        const result = await callGeminiProxy("gemini-2.5-flash", prompt);
        const text = result.text;

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
      if (error.message?.includes('429')) {
        setMessages(prev => [...prev, { role: 'ayi', primary: 'Waduu, La Ayi capek sedikit (Quota Terlampaui). Coba kirim lagi dalam 15-30 detik ya!', secondary: null }]);
      } else {
        setMessages(prev => [...prev, { role: 'ayi', primary: 'Maaf, ada kesalahan teknis. Coba lagi ya!', secondary: null }]);
      }
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
                  <div className="ref-card">Struktur Bahasa Wolio (Husen Abas et al., 1983)</div>
                  <div className="ref-card">Tata Bahasa Wolio (J.C. Anceaux, 1952)</div>
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
              <div className="header-actions">
                <button className="header-btn dictionary-btn" onClick={() => setIsDictionaryOpen(true)} title="Kamus Per Kata">
                  <Book size={18} />
                </button>
                <button onClick={() => setMode('about')} className="header-btn about-btn" title="Tentang Aindea">
                  <Info size={18} />
                </button>
                <button className="header-btn clear-btn" onClick={clearChat} title="Hapus riwayat chat">
                  <Trash2 size={18} />
                </button>
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
                    <span className="loading-text">{mode === 'translate' ? 'Pekamontaai...' : 'La Ayi mefiki-fikiri...'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />

              {/* Dictionary Modal */}
              <AnimatePresence>
                {isDictionaryOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-overlay"
                    onClick={() => setIsDictionaryOpen(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="dictionary-modal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="modal-header">
                        <h3>Kamus Per Kata</h3>
                        <button className="close-btn" onClick={() => setIsDictionaryOpen(false)}>
                          <X size={20} />
                        </button>
                      </div>

                      <div className="dictionary-controls">
                        <div className="dict-search-wrapper">
                          <Search className="search-icon" size={18} />
                          <input
                            type="text"
                            placeholder="Cari kata..."
                            value={dictionarySearch}
                            onChange={(e) => setDictionarySearch(e.target.value)}
                          />
                        </div>
                        <button
                          className="dict-direction-btn"
                          onClick={() => setDictionaryMode(prev => prev === 'id-wolio' ? 'wolio-id' : 'id-wolio')}
                        >
                          {dictionaryMode === 'id-wolio' ? 'ID → Wolio' : 'Wolio → ID'}
                          <ArrowLeftRight size={14} />
                        </button>
                      </div>

                      <div className="dictionary-results">
                        {dictionarySearch.length > 0 ? (
                          dictionary.entries
                            .filter(entry => {
                              // Skip compiler/meta entries
                              if (entry.word.toLowerCase() === 'penyusun') return false;

                              const q = dictionarySearch.toLowerCase().trim();
                              if (!q) return false;

                              if (dictionaryMode === 'id-wolio') {
                                // Search only in the Indonesian word part (before first comma/period/semicolon)
                                const primaryDef = entry.definition.split(/[;.,]/)[0].toLowerCase();
                                return primaryDef.includes(q);
                              } else {
                                // Search only in the Wolio word field
                                return entry.word.toLowerCase().includes(q);
                              }
                            })
                            .slice(0, 50)
                            .map((entry, idx) => (
                              <div key={idx} className="dict-entry">
                                <div className="entry-word">{entry.word}</div>
                                <div className="entry-def">{entry.definition}</div>
                                {entry.example_wolio && (
                                  <div className="entry-example">
                                    <span className="wolio-ex">{entry.example_wolio}</span>
                                    <span className="id-ex">{entry.example_id}</span>
                                  </div>
                                )}
                              </div>
                            ))
                        ) : (
                          <div className="dict-placeholder">
                            <Book size={48} />
                            <p>Masukkan kata untuk mencari terjemahan</p>
                          </div>
                        )}
                        {dictionarySearch.length > 0 && dictionary.entries.filter(entry => {
                          if (entry.word.toLowerCase() === 'penyusun') return false;
                          const q = dictionarySearch.toLowerCase().trim();
                          if (!q) return false;
                          if (dictionaryMode === 'id-wolio') {
                            const primaryDef = entry.definition.split(/[;.,]/)[0].toLowerCase();
                            return primaryDef.includes(q);
                          } else {
                            return entry.word.toLowerCase().includes(q);
                          }
                        }).length === 0 && (
                            <div className="no-results">Kata tidak ditemukan</div>
                          )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            <footer className="chat-input-area">
              <div className="input-container">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={
                    mode === 'translate'
                      ? (translateDirection === 'id-wolio' ? 'Ketik pesan bahasa Indonesia...' : 'Ketik pesan bahasa Wolio...')
                      : 'Jawab dalam bahasa Wolio...'
                  }
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

      {/* Welcome Showcase Modal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="modal-overlay welcome-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="welcome-card"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="welcome-content">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={welcomeStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="slide-content"
                  >
                    {welcomeSlides[welcomeStep].isSummary ? (
                      <div className="features-summary-grid">
                        {welcomeSlides[welcomeStep].features.map((f, i) => (
                          <div key={i} className="summary-feature-item">
                            <div className="summary-feature-icon">{f.icon}</div>
                            <span>{f.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="welcome-icon-wrapper">
                        {welcomeSlides[welcomeStep].icon}
                      </div>
                    )}
                    <h2>{welcomeSlides[welcomeStep].title}</h2>
                    <h3>{welcomeSlides[welcomeStep].subtitle}</h3>
                    <p>{welcomeSlides[welcomeStep].content}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="welcome-footer">
                <div className="step-indicators">
                  {welcomeSlides.map((_, idx) => (
                    <div
                      key={idx}
                      className={`step-dot ${idx === welcomeStep ? 'active' : ''}`}
                      onClick={() => setWelcomeStep(idx)}
                    />
                  ))}
                </div>

                <div className="welcome-actions">
                  {welcomeStep < welcomeSlides.length - 1 ? (
                    <button
                      className="welcome-next-btn"
                      onClick={() => setWelcomeStep(prev => prev + 1)}
                    >
                      Lanjut
                    </button>
                  ) : (
                    <button
                      className="welcome-start-btn"
                      onClick={closeWelcome}
                    >
                      Mulai Sekarang
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
