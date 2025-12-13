"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, FileText, Download, Check, Clock } from "lucide-react";

interface Signature {
  id: string;
  parentName: string;
  studentName: string;
  signature: string;
  timestamp: string;
  ipAddress: string;
  status: 'signed' | 'pending';
}

export default function TermsPage() {
  const [signatures, setSignatures] = useState<Signature[]>([
    {
      id: "1",
      parentName: "Jane Doe",
      studentName: "John Doe",
      signature: "Jane Doe",
      timestamp: "2024-09-20T10:30:00Z",
      ipAddress: "192.168.1.1",
      status: "signed"
    },
    {
      id: "2",
      parentName: "Robert Smith",
      studentName: "Emma Smith",
      signature: "Robert Smith",
      timestamp: "2024-09-21T14:15:00Z",
      ipAddress: "192.168.1.2",
      status: "signed"
    }
  ]);

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentTab, setCurrentTab] = useState<'terms' | 'signatures'>('terms');

  const termsContent = `
    SCHOOL MANAGEMENT SYSTEM - TERMS AND CONDITIONS

    LAST UPDATED: September 2024

    1. ACCEPTANCE OF TERMS
    By signing this document, you (the parent/guardian) acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions for your child's enrollment and participation in our school programs.

    2. Enrollment

Enrollment is confirmed only upon completion of the registration form and payment of the required fees.

Parents/Guardians must provide accurate student information, including emergency contact details.

3. Attendance & Punctuality

Students must attend classes regularly and arrive on time.

Missed lessons due to student absence are non-refundable and non-transferable.

In case of illness or emergencies, the school may allow a make-up session at the teacher’s discretion.

4. Payments & Fees

Tuition fees must be paid in full before the start of the term/session.

Late payments may result in suspension of lessons until fees are settled.

Registration fees, tuition fees, and other payments are non-refundable once classes begin.

5. Instruments & Materials

Students are expected to bring their own instruments and materials, unless otherwise provided by the school.

School-owned instruments must be handled with care. Any damages caused by negligence will be charged to the parent/guardian.

6. Student Conduct

Students must respect teachers, staff, and fellow students at all times.

Disruptive behavior may result in suspension or dismissal from the school without refund.

7. Practice & Progress

Students are expected to practice regularly at home as advised by their teachers.

Teachers may provide progress notes or updates to parents to track improvement.

8. Safety & Consent

Parents/Guardians must ensure timely drop-off and pick-up of students.

The school is not responsible for students outside scheduled lesson times.

By enrolling, parents/guardians consent to the school using photos or videos of students for educational and promotional purposes, unless otherwise stated in writing.

9. Withdrawal & Termination

Parents/Guardians must provide at least 2 weeks’ notice in writing for withdrawal.

The school reserves the right to terminate enrollment due to repeated absences, non-payment, or misconduct.

10. Communications

Official communication will be sent via SMS, email, or official school announcements.

Parents/Guardians are responsible for keeping their contact information up to date.

    By signing below, I acknowledge that I have read and understood these Terms and Conditions, and I agree to comply with all stated policies and procedures. I understand that this is a legally binding agreement.
  `;

  const totalSignatures = signatures.length;
  const pendingSignatures = signatures.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 rounded-2xl shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200">
                <ArrowLeft className="h-6 w-6 text-white" />
              </Link>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Terms & Conditions</h1>
                <p className="text-blue-100 text-lg mt-1">Digital signature platform for parents and guardians</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSignatureModal(true)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <FileText className="h-4 w-4" />
                Sign Terms
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
          <div className="flex bg-gray-50 rounded-xl p-1 mb-6 max-w-md">
            <button
              onClick={() => setCurrentTab('terms')}
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 font-medium ${
                currentTab === 'terms' 
                  ? 'bg-white text-blue-600 shadow-md' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => setCurrentTab('signatures')}
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 font-medium ${
                currentTab === 'signatures' 
                  ? 'bg-white text-blue-600 shadow-md' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Signatures ({totalSignatures})
            </button>
          </div>

        {currentTab === 'terms' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">School Terms and Conditions</h2>
              <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
                <Download className="h-5 w-5" />
                Download PDF
              </button>
            </div>
            
            <div className="prose prose-gray max-w-none">
              <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                {termsContent}
              </div>
            </div>

            <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-purple-800 mb-2">Digital Signature Required</h3>
                  <p className="text-purple-700 text-sm">
                    Parents and guardians must digitally sign these terms and conditions to complete the enrollment process. 
                    Your signature will be legally binding and timestamped for our records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'signatures' && (
          <div className="space-y-6">
            {/* Signature Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">{totalSignatures}</div>
                <div className="text-gray-600">Total Signatures</div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">{totalSignatures - pendingSignatures}</div>
                <div className="text-gray-600">Completed</div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                <div className="text-3xl font-bold text-orange-600 mb-2">{pendingSignatures}</div>
                <div className="text-gray-600">Pending</div>
              </div>
            </div>

            {/* Signatures List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Digital Signatures</h2>
              
              {signatures.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <div className="text-gray-500">No signatures recorded yet</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {signatures.map(signature => (
                    <div key={signature.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            signature.status === 'signed' ? 'bg-green-100' : 'bg-orange-100'
                          }`}>
                            {signature.status === 'signed' ? (
                              <Check className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{signature.parentName}</h3>
                            <p className="text-sm text-gray-600">Guardian of {signature.studentName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            signature.status === 'signed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {signature.status === 'signed' ? 'Signed' : 'Pending'}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(signature.timestamp).toLocaleDateString()} at {new Date(signature.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Digital Signature:</span>
                            <div className="font-mono text-purple-600 mt-1">{signature.signature}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">IP Address:</span>
                            <div className="font-mono text-gray-700 mt-1">{signature.ipAddress}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Timestamp:</span>
                            <div className="text-gray-700 mt-1">{new Date(signature.timestamp).toISOString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Digital Signature Modal */}
        {showSignatureModal && (
          <SignatureModal
            onClose={() => setShowSignatureModal(false)}
            onSave={(signatureData) => {
              const newSignature: Signature = {
                id: Date.now().toString(),
                ...signatureData,
                timestamp: new Date().toISOString(),
                ipAddress: "192.168.1." + Math.floor(Math.random() * 255), // Mock IP
                status: 'signed'
              };
              setSignatures([...signatures, newSignature]);
              setShowSignatureModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Signature Modal Component
interface SignatureModalProps {
  onClose: () => void;
  onSave: (data: { parentName: string; studentName: string; signature: string }) => void;
}

function SignatureModal({ onClose, onSave }: SignatureModalProps) {
  const [formData, setFormData] = useState({
    parentName: '',
    studentName: '',
    signature: '',
    agreed: false
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4F46E5';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreed) {
      alert("Please agree to the terms and conditions before signing.");
      return;
    }
    if (!formData.signature.trim()) {
      alert("Please provide your digital signature.");
      return;
    }
    
    onSave({
      parentName: formData.parentName,
      studentName: formData.studentName,
      signature: formData.signature
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Digital Signature</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent/Guardian Name</label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Digital Signature</label>
            <input
              type="text"
              value={formData.signature}
              onChange={(e) => setFormData({...formData, signature: e.target.value})}
              placeholder="Type your full name as digital signature"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Type your full legal name as it appears on official documents
            </p>
          </div>

          {/* Canvas for signature drawing (optional) */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or draw your signature (optional)
            </label>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              className="border border-gray-300 rounded cursor-crosshair w-full bg-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <button
              type="button"
              onClick={clearCanvas}
              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Drawing
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreement"
                checked={formData.agreed}
                onChange={(e) => setFormData({...formData, agreed: e.target.checked})}
                className="mt-1"
              />
              <label htmlFor="agreement" className="text-sm text-gray-700">
                I have read and understood the Terms and Conditions outlined above. 
                By signing this document, I agree to comply with all stated policies and procedures. 
                I understand that this digital signature is legally binding and equivalent to my handwritten signature.
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Sign & Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
