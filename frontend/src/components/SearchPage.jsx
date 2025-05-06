import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Adjust the import to your path

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setMessage('❌ Please enter a search term.');
      setResults([]);
      return;
    }

    const { data, error } = await supabase
    .from('files')
    .select('*')
    .textSearch('document', searchTerm, {
      config: 'english',
      type: 'plain'
    });
  
    if (error) {
      console.error('Search error:', error.message);
      setMessage(`❌ Search failed: ${error.message}`);
      setResults([]);
    } else {
      setMessage(`✅ Found ${data.length} result(s).`);
      setResults(data);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg space-y-6">
      <h2 className="text-3xl font-bold">🔍 File Search</h2>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow p-3 rounded bg-gray-800 border border-gray-700"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded font-semibold"
        >
          Search
        </button>
      </div>

      {message && (
        <div className="bg-yellow-800 text-yellow-200 p-3 rounded">
          {message}
        </div>
      )}

      <ul className="space-y-2">
        {results.map((file) => (
          <li
            key={file.id}
            className="p-4 border border-gray-700 rounded bg-gray-800"
          >
            📄 <strong>{file.filename}</strong>
            <div className="text-sm text-gray-400">
              Type: {file.type} | Size: {file.size} bytes
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchPage;
