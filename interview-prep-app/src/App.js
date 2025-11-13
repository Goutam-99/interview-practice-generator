import React, { useState } from 'react';
import { Upload, FileText, Download, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';

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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    const addText = (text, fontSize, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach(line => {
        if (yPosition + 10 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      
      yPosition += 5;
    };

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Interview Questions & Answers', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated from: ${file.name}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Total Questions: ${questions.length}`, margin, yPosition);
    yPosition += 15;

    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    questions.forEach((qa, index) => {
      addText(`Question ${index + 1}:`, 12, true);
      addText(qa.question, 11, false);
      yPosition += 3;

      addText('Answer:', 11, true);
      addText(qa.answer, 10, false);
      yPosition += 8;

      if (index < questions.length - 1) {
        doc.setLineWidth(0.2);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      }
    });

    doc.save(`interview-questions-${new Date().getTime()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Interview Prep AI
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                Powered by AI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Get Started
                </h2>
                <p className="text-gray-600">
                  Upload your resume and let AI generate personalized interview questions
                </p>
              </div>

              <div className="space-y-6">
                {/* Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Upload Resume (PDF)
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center p-12 border-3 border-dashed border-gray-300 rounded-2xl cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/50 group-hover:scale-[1.02]"
                    >
                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      {file ? (
                        <>
                          <span className="text-lg font-semibold text-gray-800 mb-1">
                            {file.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            Click to change file
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-semibold text-gray-800 mb-1">
                            Click to upload
                          </span>
                          <span className="text-sm text-gray-500">
                            or drag and drop your PDF here
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start animate-in slide-in-from-top">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={generateQuestions}
                  disabled={loading || !file}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 mr-2" />
                      Generate Interview Questions
                    </>
                  )}
                </button>
              </div>

              {/* Features */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Why use this tool?</h3>
                <div className="space-y-3">
                  {[
                    '✨ AI-powered question generation',
                    '📚 10 personalized questions with answers',
                    '⚡ Fast and accurate',
                    '📥 Download as PDF'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Questions Display */}
          <div className="space-y-6">
            {questions.length > 0 ? (
              <>
                {/* Header with Download */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-xl p-8 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-bold">
                      Your Questions ({questions.length})
                    </h2>
                    <button
                      onClick={downloadPDF}
                      className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF
                    </button>
                  </div>
                  <p className="text-blue-100">
                    Review and practice with these AI-generated questions
                  </p>
                </div>

                {/* Questions List */}
                <div className="space-y-5">
                  {questions.map((qa, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.01] animate-in slide-in-from-bottom"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start mb-4">
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl w-10 h-10 flex items-center justify-center font-bold mr-4 flex-shrink-0 shadow-md">
                          {index + 1}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                          {qa.question}
                        </h3>
                      </div>
                      <div className="ml-14">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-l-4 border-blue-500">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {qa.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100 text-center">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Questions Yet
                </h3>
                <p className="text-gray-600">
                  Upload your resume and click generate to see your personalized interview questions here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}