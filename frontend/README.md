# PlaceMate Frontend

React + Vite frontend for the Student Placement Management System.

## Run

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually http://localhost:5173.

The current login is a frontend demo flow. Replace the demo `AuthContext` login with your Express/JWT API when the backend is ready.

## Roles
- student
- admin
- company

## Backend URL
Copy `.env.example` to `.env` and set:

`VITE_API_URL=http://localhost:5000/api`
