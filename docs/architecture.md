# System Architecture
The architecture includes core components integrated with frontend and backend:

```
+-------------------+       +-------------------+       +-------------------+
| Frontend (React)  | <--> | Backend (FastAPI) | <--> | Core Components   |
| - Dashboard       |       | - APIs            |       | - Scanner (Py)    |
| - Charts/Tables   |       | - Scan/Report     |       | - Emulator (C++)  |
| - API Calls (Axios|       | - C++ Integration |       | - Tests (pytest)  |
+-------------------+       +-------------------+       +-------------------+
         |                          |                          |
         v                          v                          v
+-------------------+       +-------------------+       +-------------------+
| User Interactions |       | SQLite Database   |       | GitLab CI/Docker  |
| - Run Scans       |<----->| - Logs/Results    |       | - Testing/Deploy  |
| - View Reports    |       |                   |       |                   |
+-------------------+       +-------------------+       +-------------------+
