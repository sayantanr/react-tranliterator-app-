import React, { useState } from 'react';
import { Upload, FileText, Image, Package, Globe, Loader2, Download, ChevronDown } from 'lucide-react';

const TransliteratorApp = () => {
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sourceScript, setSourceScript] = useState('Latin');
  const [targetScript, setTargetScript] = useState('Devanagari');
  const [mode, setMode] = useState('text');

  const scripts = [
    'Latin', 'Devanagari', 'Arabic', 'Cyrillic', 'Chinese', 'Japanese (Hiragana)', 'Japanese (Katakana)',
    'Korean (Hangul)', 'Greek', 'Hebrew', 'Thai', 'Bengali', 'Tamil', 'Telugu', 'Gujarati',
    'Kannada', 'Malayalam', 'Oriya', 'Punjabi (Gurmukhi)', 'Sinhala', 'Tibetan', 'Burmese',
    'Khmer', 'Lao', 'Georgian', 'Armenian', 'Ethiopic', 'Cherokee', 'Mongolian', 'Tifinagh',
    'N\'Ko', 'Vai', 'Osmanya', 'Hanifi Rohingya', 'Syriac', 'Thaana', 'Adlam', 'Bamum',
    'Mandaic', 'Samaritan', 'Coptic', 'Glagolitic', 'Gothic', 'Ogham', 'Runic', 'Old Italic',
    'Phoenician', 'Lydian', 'Carian', 'Lycian', 'Ugaritic', 'Old Persian', 'Deseret', 'Shavian',
    'Osmanya', 'Elbasan', 'Caucasian Albanian', 'Linear A', 'Linear B', 'Cypriot', 'Imperial Aramaic',
    'Palmyrene', 'Nabataean', 'Hatran', 'Phoenician', 'Meroitic', 'Old South Arabian', 'Old North Arabian',
    'Manichaean', 'Avestan', 'Inscriptional Parthian', 'Inscriptional Pahlavi', 'Psalter Pahlavi',
    'Old Turkic', 'Old Hungarian', 'Hanunoo', 'Buhid', 'Tagbanwa', 'Tagalog', 'Sundanese',
    'Batak', 'Lepcha', 'Ol Chiki', 'Cyrillic Extended', 'Glagolitic Supplement', 'Nyiakeng Puachue Hmong',
    'Wancho', 'Chorasmian', 'Dives Akuru', 'Khitan Small Script', 'Yezidi', 'Old Sogdian', 'Sogdian',
    'Elymaic', 'Nandinagari', 'Zanabazar Square', 'Soyombo', 'Pau Cin Hau', 'Bhaiksuki', 'Marchen',
    'Masaram Gondi', 'Gunjala Gondi', 'Makasar', 'Medefaidrin', 'Mende Kikakui', 'Modi',
    'Mro', 'Multani', 'Newa', 'Nushu', 'Pahawh Hmong', 'Tai Tham', 'Tai Viet', 'Warang Citi',
    'Ahom', 'Anatolian Hieroglyphs', 'Bassa Vah', 'Duployan', 'Elbasan', 'Grantha', 'Khojki',
    'Khudawadi', 'Linear A', 'Mahajani', 'Meroitic Cursive', 'Meroitic Hieroglyphs', 'Old Permic',
    'Palmyrene', 'Pau Cin Hau', 'Siddham', 'Tirhuta', 'Takri', 'Cuneiform', 'Egyptian Hieroglyphs'
  ];

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();
      
      if (uploadedFile.type === 'text/plain') {
        reader.onload = (event) => setInputText(event.target.result);
        reader.readAsText(uploadedFile);
      } else if (uploadedFile.type.startsWith('image/')) {
        setMode('ocr');
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
        };
        reader.readAsDataURL(uploadedFile);
      } else if (uploadedFile.name.endsWith('.zip')) {
        setMode('zip');
      }
    }
  };

  const transliterate = async () => {
    if (!inputText && !file) {
      alert('Please provide text or upload a file');
      return;
    }

    setLoading(true);

    try {
      let textToTransliterate = inputText;

      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result.split(',')[1]);
          reader.readAsDataURL(file);
        });

        const ocrResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: file.type, data: base64 }
                },
                {
                  type: 'text',
                  text: 'Extract all text from this image. Return only the extracted text with no additional commentary.'
                }
              ]
            }]
          })
        });

        const ocrData = await ocrResponse.json();
        textToTransliterate = ocrData.content.map(c => c.type === 'text' ? c.text : '').join('');
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Transliterate the following text from ${sourceScript} script to ${targetScript} script. Provide only the transliterated text with no explanations or additional commentary:\n\n${textToTransliterate}`
          }]
        })
      });

      const data = await response.json();
      const result = data.content.map(c => c.type === 'text' ? c.text : '').join('');
      setOutputText(result);
    } catch (error) {
      console.error('Transliteration error:', error);
      alert('Error during transliteration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transliterated_${targetScript}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Globe className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">AI Transliterator</h1>
          </div>
          <p className="text-gray-600 text-lg">Convert text between 142+ scripts using AI</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Source Script
            </label>
            <select
              value={sourceScript}
              onChange={(e) => setSourceScript(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {scripts.map(script => (
                <option key={script} value={script}>{script}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Script
            </label>
            <select
              value={targetScript}
              onChange={(e) => setTargetScript(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {scripts.map(script => (
                <option key={script} value={script}>{script}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Input
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (TXT, Image, ZIP)
            </label>
            <input
              type="file"
              accept=".txt,.zip,image/*"
              onChange={handleFileUpload}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                {file.type.startsWith('image/') ? <Image className="w-4 h-4" /> : 
                 file.name.endsWith('.zip') ? <Package className="w-4 h-4" /> : 
                 <FileText className="w-4 h-4" />}
                {file.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Enter Text Directly
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to transliterate..."
              className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={transliterate}
            disabled={loading || (!inputText && !file)}
            className="mt-4 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Globe className="w-5 h-5" />
                Transliterate
              </>
            )}
          </button>
        </div>

        {outputText && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Output
              </h2>
              <button
                onClick={downloadResult}
                className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-40 whitespace-pre-wrap">
              {outputText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransliteratorApp;
