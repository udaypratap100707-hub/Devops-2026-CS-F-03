const feedbackForm = document.getElementById("feedbackForm");
const response = document.getElementById("response");

feedbackForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const rating = document.getElementById("rating").value;
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !rating || !message) {
        response.textContent = "Please fill all fields.";
        return;
    }

    const feedback = {
        id: Date.now(),
        name: name,
        email: email,
        rating: Number(rating),
        message: message,
        date: new Date().toISOString()
    };

    console.log("Feedback submitted:", feedback);

    response.textContent = "Thank you! Your feedback has been submitted.";

    feedbackForm.reset();
});