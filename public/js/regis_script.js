const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

// // Form Animation
// registerBtn.addEventListener('click', () => {
//     container.classList.add("active");
// });
// // Form Animation
// loginBtn.addEventListener('click', () => {
//     container.classList.remove("active");
// });

// Function to switch between login and register tabs
function switchTab(tab) {
    // Update tabs
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
    });
    document.querySelector(`.tab:nth-child(${tab === 'login' ? 1 : 2})`).classList.add('active');
    
    // Update forms
    document.querySelectorAll('.form-container').forEach(form => {
      form.classList.remove('active');
    });
    document.getElementById(tab).classList.add('active');
    
    // Update bottom text
    const bottomText = document.getElementById('bottom-text');
    if (tab === 'login') {
      bottomText.innerHTML = 'Don\'t have an account? <a href="#" onclick="switchTab(\'register\')">Sign up</a>';
    } else {
      bottomText.innerHTML = 'Already have an account? <a href="#" onclick="switchTab(\'login\')">Sign in</a>';
    }
}

// Function to determine the greeting based on the local time
// function setGreeting() {
//     const hours = new Date().getHours(); // Get the current hour
//     let greeting = "Hello Friend";

//     if (hours >= 5 && hours < 12) {
//         greeting = "Good Morning";
//     } else if (hours >= 12 && hours < 18) {
//         greeting = "Good Afternoon";
//     } else if (hours >= 18 && hours < 22) {
//         greeting = "Good Evening";
//     } else if (hours >= 22 || hours < 5) {
//         greeting = "Hello there :)";
//     }

//     // Update the h1 element's text
//     document.getElementById("greeting").innerText = greeting;
// }

// Load Welcome Animation Below "Welcome!"
// document.addEventListener("DOMContentLoaded", function () {
//     lottie.loadAnimation({
//         container: document.getElementById("welcome-animation"), // Target the new div
//         renderer: "svg",
//         loop: true, // Keep it looping
//         autoplay: true,
//         path: "./animations/eva_robot.json" // Make sure the path is correct
//     });
//     lottie.loadAnimation({
//         container: document.getElementById("person-animation"), // Target the new div
//         renderer: "svg",
//         loop: true, // Keep it looping
//         autoplay: true,
//         path: "./animations/person_robot.json" // Make sure the path is correct
//     });
// });

// Call the function when the page loads
// window.onload = setGreeting;

document.addEventListener('DOMContentLoaded', () => {
// Registration Script
    document.getElementById("registerForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const regisErrorMessage = document.getElementById("regis-error-message");

        const inputNameRegis = document.getElementById("name");
        const inputEmailRegis = document.getElementById("email");
        const inputPassRegis = document.getElementById("password");
        const inputConPassRegis = document.getElementById("confirmPassword");

        if (password !== confirmPassword) {
            regisErrorMessage.textContent = "Passwords do not match!";
            inputPassRegis.classList.add("active");
            inputConPassRegis.classList.add("active");
            return;
        }

        try {
            const response = await fetch("/auth/register", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("username", data.user.name);

                console.log("User ID stored after registration:", data.user.id);
                console.log("Username stored after registration:", data.user.name);
                playSuccessAnimation();
                
                // Redirect after animation
                setTimeout(() => {
                    window.location.href = "/index.html";
                }, 2000); // Redirect after 2 sec
            } else {
                console.error("🔥 Registration Failed:", data.message);
                regisErrorMessage.textContent = data.message;    
                // Apply red border based on error message
                if (data.message.includes("All fields are required!")) {
                    inputNameRegis.classList.add("active");
                    inputEmailRegis.classList.add("active");
                    inputPassRegis.classList.add("active");
                    inputConPassRegis.classList.add("active");
                }
                if (data.message.includes("Email is already registered!")) {
                    inputEmailRegis.classList.add("active");
                } 
                if (data.message.includes("Password must be at least 6 characters long.")) {
                    inputPassRegis.classList.add("active");
                    inputConPassRegis.classList.add("active");
                }                
            }
        } catch (error) {
            console.error("🔥 Registration Error:", error);
            regisErrorMessage.textContent = "Something went wrong! Please try again.";
        }
    });

    // Login Script
    document.getElementById("loginForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const loginErrorMessage = document.getElementById("login-error-message");
        const inputEmailLogin = document.getElementById("loginEmail");
        const inputPassLogin = document.getElementById("loginPassword");

        // Prevent multiple clicks
        // loginBtn.disabled = true;
        // loginBtn.innerText = "Logging in...";

        try {
            const response = await fetch("/auth/login", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {        
                localStorage.setItem("userId", data.user.id);      
                localStorage.setItem("username", data.user.name);

                console.log("User ID stored:", data.user.id); // Debugging
                console.log("Username stored:", data.user.name); // Debugging

                window.location.href = "/index.html";              
            } else {
                // ✅ Handle different errors
                if (response.status === 429) {
                    console.warn("🚨 Too Many Requests (429) - Login rate limit reached!");
                    loginErrorMessage.textContent = "Too many login attempts. Try again later.";
                } else if (response.status === 401) {
                    console.warn("🔒 Unauthorized (401) - Invalid credentials.");
                    loginErrorMessage.textContent = "Invalid email or password.";
                } else {
                    console.error("🔥 Login Failed:", data.message || "Unexpected error.");
                    loginErrorMessage.textContent = data.message || "Something went wrong! Please try again.";
                }

                inputEmailLogin.classList.add("active"); // add red border
                inputPassLogin.classList.add("active"); // add red border
            }
        } catch (error) {
            console.error("Login Error:", error);
            loginErrorMessage.textContent = "Something went wrong! Please try again.";
        } 
        // finally {
        //     // ✅ Allow retry after some time
        //     setTimeout(() => {
        //         loginBtn.disabled = false;
        //         loginBtn.innerText = "Login";
        //     }, 3000); // Allow retry after 3 seconds
        // }
    });

    // This function is to execute success animation
    function playSuccessAnimation() {
        console.log("🎉 Playing success animation...");

        const animationContainer = document.getElementById("success-animation");
        const bodyContent = document.querySelector(".container"); 

        animationContainer.style.display = "block";
        bodyContent.classList.add("blur-effect"); // Add blur

        // Load the animation
        lottie.loadAnimation({
            container: animationContainer,
            renderer: "svg",
            loop: false,
            autoplay: true,
            path: "./animations/success_animation2.json" // Animation JSON file
        });
        // Hide animation after 2 seconds
        setTimeout(() => {
            animationContainer.style.display = "none";
            bodyContent.classList.remove("blur-effect"); // Remove blur
        }, 2000);
    }
});

