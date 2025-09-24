# School Management System

A modern, comprehensive web application for managing school administrative tasks, built with Next.js, React, TypeScript, and Firebase.

## 🚀 Live Demo
- **Production URL:** https://discover-music-mnl.web.app
- **Students Page:** https://discover-music-mnl.web.app/students

## Features

### 🔥 Real-time Database with Firebase
- Instant data synchronization across all devices
- Cloud-based storage with automatic backups
- Offline support with local caching
- Scalable infrastructure for growing schools

### 👥 Student Information System
- Complete student record management with real-time updates
- Enrollment forms and academic information
- Parent/guardian contact details
- Search and filter students by grade or name
- Statistical overview and analytics
- Google Sheets integration for data import/export

### 🗓️ Class Schedule Management
- Create and manage teacher schedules
- Organize class timings and room assignments
- Visual weekly schedule grid
- Add, edit, and delete schedule entries
- Track multiple grades and subjects

### 📋 Terms & Conditions Digital Signatures
- Digital signature platform for parents/guardians
- Legally binding electronic signatures
- Timestamp and IP tracking for security
- Terms and conditions document management
- Signature status tracking

## Technology Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript
- **Database**: Firebase Firestore (Real-time NoSQL)
- **Hosting**: Firebase Hosting
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Development**: Turbopack for fast development
- **API Integration**: Google Sheets API
- **CI/CD**: GitHub Actions for auto-deployment

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd DMS-1.0
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Homepage with navigation cards
│   ├── schedule/
│   │   └── page.tsx        # Class schedule management
│   ├── students/
│   │   └── page.tsx        # Student information system
│   └── terms/
│       └── page.tsx        # Terms & conditions with signatures
├── globals.css             # Global styles
└── components/             # Reusable components (future expansion)
```

## Features Overview

### Homepage
- Modern gradient design with card-based navigation
- Three main sections: Schedule, Students, and Terms
- Responsive layout for all device sizes

### Schedule Management
- Weekly calendar view
- CRUD operations for class schedules
- Teacher and room assignment tracking
- Grade-level organization
- Statistics dashboard

### Student Management
- Comprehensive student profiles
- Search and filtering capabilities
- Parent/guardian information
- Enrollment tracking
- Student statistics

### Digital Signatures
- Terms and conditions display
- Digital signature collection
- Signature verification and tracking
- Legal compliance features
- Audit trail with timestamps

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture

## Future Enhancements

- [ ] Database integration (Prisma + PostgreSQL)
- [ ] User authentication and authorization
- [ ] Email notifications
- [ ] PDF report generation
- [ ] Mobile app version
- [ ] Real-time updates
- [ ] Advanced analytics
- [ ] Backup and export features

## Contributing

This is a personal school project. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is for educational purposes. All rights reserved.

## Support

For questions or support, please contact the development team.

---

**Built with ❤️ for modern school management**
