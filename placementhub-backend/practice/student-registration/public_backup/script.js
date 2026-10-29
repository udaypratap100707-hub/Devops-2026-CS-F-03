// ==========================================
// PASSWORD VISIBILITY
// ==========================================

function togglePassword(inputId, button) {

    const input = document.getElementById(inputId);

    if (!input) return;

    const icon = button.querySelector("i");

    if (input.type === "password") {

        input.type = "text";

        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");

    } else {

        input.type = "password";

        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");

    }
}



// ==========================================
// REGISTRATION
// ==========================================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document.getElementById("name").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const phone =
                document.getElementById("phone").value.trim();

            const college =
                document.getElementById("college").value.trim();

            const course =
                document.getElementById("course").value;

            const password =
                document.getElementById("password").value;

            const confirmPassword =
                document.getElementById("confirmPassword").value;

            const message =
                document.getElementById("message");


            // Password validation

            if (password !== confirmPassword) {

                message.textContent =
                    "Passwords do not match.";

                message.style.color = "#ef4444";

                return;
            }


            // Phone validation

            if (!/^[0-9]{10}$/.test(phone)) {

                message.textContent =
                    "Please enter a valid 10-digit phone number.";

                message.style.color = "#ef4444";

                return;
            }


            // API request

            try {

                const response =
                    await fetch("/api/register", {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            name,
                            email,
                            phone,
                            college,
                            course,
                            password

                        })

                    });


                const result =
                    await response.json();


                message.textContent =
                    result.message;


                message.style.color =
                    response.ok
                        ? "#16a34a"
                        : "#ef4444";


                if (response.ok) {

                    registerForm.reset();


                    setTimeout(() => {

                        window.location.href =
                            "index.html";

                    }, 1500);

                }


            } catch (error) {

                console.error(error);

                message.textContent =
                    "Unable to connect to server.";

                message.style.color =
                    "#ef4444";

            }

        }
    );

}



// ==========================================
// LOGIN
// ==========================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;


            const message =
                document.getElementById("message");


            try {

                const response =
                    await fetch("/api/login", {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            email,
                            password

                        })

                    });


                const result =
                    await response.json();


                message.textContent =
                    result.message;


                message.style.color =
                    response.ok
                        ? "#16a34a"
                        : "#ef4444";


                if (response.ok) {

                    localStorage.setItem(
                        "student",
                        JSON.stringify(result.user)
                    );


                    setTimeout(() => {

                        window.location.href =
                            "dashboard.html";

                    }, 700);

                }


            } catch (error) {

                console.error(error);

                message.textContent =
                    "Unable to connect to server.";

                message.style.color =
                    "#ef4444";

            }

        }
    );

}



// ==========================================
// DASHBOARD
// ==========================================

const studentData =
    localStorage.getItem("student");


if (
    window.location.pathname.includes("dashboard.html")
) {

    if (!studentData) {

        window.location.href =
            "index.html";

    } else {

        const student =
            JSON.parse(studentData);


        // Header

        const firstLetter =
            student.name
                ? student.name.charAt(0).toUpperCase()
                : "S";


        document.getElementById("avatar")
            .textContent = firstLetter;


        document.getElementById("headerName")
            .textContent = student.name;


        document.getElementById("welcomeName")
            .textContent = student.name + "!";


        // Stats

        document.getElementById("studentName")
            .textContent = student.name;

        document.getElementById("studentEmail")
            .textContent = student.email;

        document.getElementById("studentCollege")
            .textContent = student.college;

        document.getElementById("studentCourse")
            .textContent = student.course;


        // Information

        document.getElementById("infoName")
            .textContent = student.name;

        document.getElementById("infoEmail")
            .textContent = student.email;

        document.getElementById("infoCollege")
            .textContent = student.college;

        document.getElementById("infoCourse")
            .textContent = student.course;

    }

}



// ==========================================
// LOGOUT
// ==========================================

function logoutStudent() {

    localStorage.removeItem("student");

    window.location.href =
        "index.html";
}


const logoutButton =
    document.getElementById("logout");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logoutStudent
    );

}


const dashboardLogout =
    document.getElementById("dashboardLogout");


if (dashboardLogout) {

    dashboardLogout.addEventListener(
        "click",
        logoutStudent
    );

}