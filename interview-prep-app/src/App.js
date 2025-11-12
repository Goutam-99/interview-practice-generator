import React, { useState } from 'react';
import { Upload, FileText, Download, Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setError('');
    } else {
      setError('Please upload a PDF file');
    }
  };

  const generateQuestions = async () => {
    if (!file) {
      setError('Please upload a resume first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:5000/api/upload-and-generate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Server error');
      }

      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to generate questions. Please try again.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    let pdfContent = 'INTERVIEW QUESTIONS & ANSWERS\n';
    pdfContent += '='.repeat(80) + '\n\n';
    pdfContent += `Generated from: ${file.name}\n`;
    pdfContent += `Date: ${new Date().toLocaleDateString()}\n`;
    pdfContent += `Total Questions: ${questions.length}\n\n`;
    pdfContent += '='.repeat(80) + '\n\n';
    
    questions.forEach((qa, index) => {
      pdfContent += `QUESTION ${index + 1}:\n`;
      pdfContent += `${qa.question}\n\n`;
      pdfContent += `ANSWER:\n`;
      pdfContent += `${qa.answer}\n\n`;
      pdfContent += '-'.repeat(80) + '\n\n';
    });

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-questions-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Interview Practice Generator
            </h1>
            <p className="text-gray-600">
              Upload your resume and get AI-generated interview questions with answers
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Resume (PDF)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-gray-600 font-medium">
                  {file ? file.name : 'Click to upload PDF'}
                </span>
                {file && (
                  <span className="text-xs text-gray-500 mt-1">
                    Click to change file
                  </span>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <button
            onClick={generateQuestions}
            disabled={loading || !file}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Generate Interview Questions
              </>
            )}
          </button>

          {questions.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Generated Questions ({questions.length})
                </h2>
                <button
                  onClick={downloadPDF}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((qa, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start mb-3">
                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {qa.question}
                      </h3>
                    </div>
                    <div className="ml-11">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {qa.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}