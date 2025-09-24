import Link from "next/link";
import { Calendar, Users, FileText, GraduationCap, UserCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="h-12 w-12 text-blue-600" />
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          School Management System
          <span className="block text-lg md:text-xl font-normal text-blue-200 mt-2">
            🚀 Now with Auto-Deployment & Firebase Real-time Database
          </span>
        </h1>
          </div>
          <p className="text-xl text-gray-600">Manage schedules, students, and administrative tasks</p>
        </header>

        {/* Main Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          
          {/* Class Schedule */}
          <Link href="/schedule" className="group">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 mx-auto">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Class Schedule</h2>
              <p className="text-gray-600 text-center leading-relaxed">
                Organize and manage class schedules, timings, and room assignments
              </p>
            </div>
          </Link>

          {/* Teachers Schedule */}
          <Link href="/teachers" className="group">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6 mx-auto">
                <UserCheck className="h-8 w-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Teachers Schedule</h2>
              <p className="text-gray-600 text-center leading-relaxed">
                Manage teacher profiles and their individual teaching schedules
              </p>
            </div>
          </Link>

          {/* Student Information System */}
          <Link href="/students" className="group">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 mx-auto">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Student Information</h2>
              <p className="text-gray-600 text-center leading-relaxed">
                Manage student records, enrollment forms, and academic information
              </p>
            </div>
          </Link>

          {/* Terms & Conditions */}
          <Link href="/terms" className="group">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 mx-auto">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Terms & Conditions</h2>
              <p className="text-gray-600 text-center leading-relaxed">
                Digital signature platform for parents and guardians
              </p>
            </div>
          </Link>

        </div>

        {/* Quick Stats or Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Your School Management Hub</h3>
            <p className="text-gray-600 leading-relaxed">
              Streamline your school administration with our comprehensive management system. 
              From scheduling classes and managing teacher profiles to handling student information and digital signatures, 
              everything you need is just a click away.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
