# Attendance Manager

## PHP + MySQL API (XAMPP)

This project includes a simple PHP API for managing students and units using MySQL (MariaDB) via XAMPP. Students for a unit are derived by matching `year_of_study`.

### Endpoints

- `GET /api/students.php` — list students
- `GET /api/students.php?id=1` — get one student
- `POST /api/students.php` — create student `{ name, email }`
- `PUT /api/students.php` — update student `{ id, name?, email? }`
- `DELETE /api/students.php?id=1` — delete student

- `GET /api/units.php` — list units
- `GET /api/units.php?id=1` — get one unit
- `POST /api/units.php` — create unit `{ code, title }`
- `PUT /api/units.php` — update unit `{ id, code?, title? }`
- `DELETE /api/units.php?id=1` — delete unit

- `GET /api/unit_students.php?unit_code=CS101` — get students for a unit by `year_of_study`

- `POST /api/import.php` — bulk import JSON of units, students, and enrollments
  - Body example:
    ```json
    {
      "units": [{ "code": "CS101", "title": "Intro to CS" }],
      "students": [
        { "name": "Alice Johnson", "email": "CS001@example.edu" },
        { "name": "Bob Smith", "email": "CS002@example.edu" }
      ],
      "enrollments": [
        { "student_email": "CS001@example.edu", "unit_code": "CS101" },
        { "student_email": "CS002@example.edu", "unit_code": "CS101" }
      ]
    }
    ```

All requests/response bodies are JSON. CORS is enabled for development.

### Setup (XAMPP on Windows)

1. Copy the `api` folder into your XAMPP `htdocs` so the path becomes something like:
   - `C:\xampp\htdocs\atte\api` (or adjust to your environment)
2. Start Apache and MySQL from XAMPP Control Panel.
3. Create the database and tables:
   - Open `http://localhost/phpmyadmin/`
   - Create database `atte` if it doesn't exist
   - Open the SQL tab and run the contents of `api/schema.sql`
4. Configure database credentials if needed:
   - Edit `api/config.php` and set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` if different from XAMPP defaults.
5. Test endpoints (examples use PowerShell):

```powershell
curl -Method GET http://localhost/atte/api/students.php | cat
curl -Method POST http://localhost/atte/api/students.php -ContentType 'application/json' -Body '{"name":"Alice","email":"alice@example.com"}' | cat
curl -Method POST http://localhost/atte/api/units.php -ContentType 'application/json' -Body '{"code":"CS101","title":"Intro to CS"}' | cat
curl -Method GET "http://localhost/atte/api/units_search.php?q=CS" | cat
curl -Method GET "http://localhost/atte/api/unit_students.php?unit_code=CS101" | cat
```

### Connect client

From your frontend in `client`, you can call the API using `fetch` to `http://localhost/atte/api/...` (or your chosen path). Ensure the client is served from a browser (e.g., open `client/index.html`).

### Notes
- Use `/api/import.php` to seed from existing CSVs: convert CSVs to JSON structure (or import CSVs via phpMyAdmin) and post once.


- The API uses PDO with prepared statements.
- Unique constraints prevent duplicate emails for students and duplicate unit codes.
- Deleting a student or unit cascades to remove related enrollments.

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
