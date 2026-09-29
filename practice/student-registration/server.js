const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(
    __dirname,
    "data",
    "users.json"
);


// ================================
// Middleware
// ================================

app.use(cors());

app.use(express.json());

app.use(express.static(
    path.join(__dirname, "public")
));


// ================================
// Database Helpers
// ================================

function readUsers() {

    try {

        if (!fs.existsSync(DATA_FILE)) {

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify({ users: [] }, null, 2)
            );

        }

        const data =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "Error reading users:",
            error
        );

        return {
            users: []
        };
    }
}


function saveUsers(data) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}


// ================================
// Home
// ================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ================================
// Register
// ================================

app.post("/api/register", (req, res) => {

    const {
        name,
        email,
        phone,
        college,
        course,
        password
    } = req.body;


    if (
        !name ||
        !email ||
        !phone ||
        !college ||
        !course ||
        !password
    ) {

        return res.status(400).json({

            message:
                "All fields are required."

        });

    }


    const data = readUsers();


    const existingUser =
        data.users.find(
            user =>
                user.email.toLowerCase() ===
                email.toLowerCase()
        );


    if (existingUser) {

        return res.status(409).json({

            message:
                "Email is already registered."

        });

    }


    const newUser = {

        id: Date.now(),

        name,

        email,

        phone,

        college,

        course,

        password,

        createdAt:
            new Date().toISOString()

    };


    data.users.push(newUser);

    saveUsers(data);


    res.status(201).json({

        message:
            "Registration successful!",

        user: {

            id: newUser.id,

            name: newUser.name,

            email: newUser.email,

            phone: newUser.phone,

            college: newUser.college,

            course: newUser.course

        }

    });

});


// ================================
// Login
// ================================

app.post("/api/login", (req, res) => {

    const {
        email,
        password
    } = req.body;


    if (!email || !password) {

        return res.status(400).json({

            message:
                "Email and password are required."

        });

    }


    const data = readUsers();


    const user =
        data.users.find(
            user =>
                user.email.toLowerCase() ===
                email.toLowerCase() &&
                user.password === password
        );


    if (!user) {

        return res.status(401).json({

            message:
                "Invalid email or password."

        });

    }


    res.json({

        message:
            "Login successful!",

        user: {

            id: user.id,

            name: user.name,

            email: user.email,

            phone: user.phone,

            college: user.college,

            course: user.course

        }

    });

});


// ================================
// Health Check
// ================================

app.get("/api/health", (req, res) => {

    res.json({

        status: "OK",

        application:
            "Student Registration Portal",

        timestamp:
            new Date().toISOString()

    });

});


// ================================
// Start Server
// ================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "=========================================="
        );

        console.log(
            " Student Registration Portal"
        );

        console.log(
            ` Server running on port ${PORT}`
        );

        console.log(
            "=========================================="
        );

    }
);