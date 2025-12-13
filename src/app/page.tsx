import Link from "next/link";
import { Calendar, Users, FileText, GraduationCap, UserCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 rounded-2xl shadow-xl mb-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold">
                School Management System
              </h1>
            </div>
            <p className="text-blue-200 text-lg mt-4">Manage schedules, students, teachers, and administrative tasks</p>
          </div>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          
          {/* Class Schedule */}
          <Link href="/schedule" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-gray-100 hover:border-blue-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-6 mx-auto">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Class Schedule</h2>
              <p className="text-gray-600 text-center leading-relaxed">
                Organize and manage class schedules, timings, and room assignments
              </p>
            </div>
          </Link>

          {/* Teachers Schedule */}
          <Link href="/teachers" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-gray-100 hover:border-orange-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl mb-6 mx-auto">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Teachers Schedule</h2>
              <p className="text-gray-600 text-center leading-relaxed">
                Manage teacher profiles and their individual teaching schedules
              </p>
            </div>
          </Link>

          {/* Student Information System */}
                    {/* Student Information System */}
          <Link href="/students" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-gray-100 hover:border-green-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-6 mx-auto">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Student Information</h2>
              <p className="text-gray-600 text-center leading-relaxed">
                Comprehensive student database with Google Sheets integration
              </p>
            </div>
          </Link>

          {/* Terms & Conditions */}
          <Link href="/terms" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-gray-100 hover:border-purple-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-6 mx-auto">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Terms & Conditions</h2>
              <p className="text-gray-600 text-center leading-relaxed">
                Digital signature platform for enrollment agreements
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
