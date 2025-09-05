# Attendance Manager

A modern, responsive web application for managing student attendance in educational institutions. Built with vanilla HTML, CSS, and JavaScript.

## Features

- **User Authentication**: Secure login and signup system
- **Unit Management**: Create and manage course units
- **Student Attendance**: Mark students as present or absent
- **CSV Export**: Download attendance records for present students only
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Demo Data**: Includes sample students for testing

## Screenshots

The application features a clean, modern interface with:
- Dark theme with gradient backgrounds
- Intuitive student list with present/absent buttons
- Responsive design that adapts to different screen sizes
- Professional toolbar with essential functions

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies required

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/attendance-manager.git
   ```

2. Navigate to the project directory:
   ```bash
   cd attendance-manager
   ```

3. Open `client/index.html` in your web browser

### Usage

1. **Sign Up**: Create a new account with your email and password
2. **Set Up Unit**: Enter your unit name and code
3. **Mark Attendance**: Click "Present" or "Absent" for each student
4. **Download CSV**: Export attendance records for present students only

## Project Structure

```
attendance-manager/
├── client/
│   ├── index.html          # Main HTML file
│   ├── index.css           # Styles and responsive design
│   └── index.js            # Application logic
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: LocalStorage for data persistence
- **Styling**: CSS Grid, Flexbox, CSS Variables
- **Responsive**: Mobile-first design with multiple breakpoints

## Features in Detail

### Authentication System
- Secure user registration and login
- Password validation
- Session management with localStorage

### Attendance Management
- Visual student list with registration numbers
- One-click present/absent marking
- Real-time status updates
- Daily session management

### Data Export
- CSV export functionality
- Only includes students marked as present
- Proper CSV formatting with headers
- Automatic filename generation with date and unit code

### Responsive Design
- **Desktop (1200px+)**: Full layout with all features
- **Tablet (900px-1200px)**: Optimized spacing and sizing
- **Mobile (600px-900px)**: Stacked layout with touch-friendly buttons
- **Small Mobile (<600px)**: Single-column layout with large touch targets

## Demo Data

The application includes 10 sample students for demonstration:
- Alice Johnson (CS001)
- Bob Smith (CS002)
- Carol Davis (CS003)
- David Wilson (CS004)
- Emma Brown (CS005)
- Frank Miller (CS006)
- Grace Taylor (CS007)
- Henry Anderson (CS008)
- Ivy Thomas (CS009)
- Jack Garcia (CS010)

## Future Enhancements

- API integration for real student data
- Database connectivity
- Multi-unit support
- Advanced reporting features
- User role management
- Bulk student import/export

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Your Name - [@yourusername](https://github.com/yourusername)

Project Link: [https://github.com/yourusername/attendance-manager](https://github.com/yourusername/attendance-manager)
