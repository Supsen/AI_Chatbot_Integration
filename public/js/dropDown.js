// document.addEventListener("DOMContentLoaded", function() {
//     // Toggle profile dropdown menu
//     document.getElementById("profileBtn").addEventListener("click", function(event) {
//         console.log("Profile button clicked"); // Debugging
//         event.stopPropagation(); // Prevent closing when clicking button
//         document.getElementById("dropdown2").classList.toggle("active");
//     });

//     // Close dropdown when clicking outside
//     document.addEventListener("click", function(event) {
//         let dropdown = document.getElementById("dropdown2");
//         if (!dropdown.contains(event.target) && !document.getElementById("profileBtn").contains(event.target)) {
//             dropdown.classList.remove("active");
//         }
//     });

// });