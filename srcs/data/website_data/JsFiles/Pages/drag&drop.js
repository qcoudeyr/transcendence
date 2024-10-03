const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");

uploadArea.addEventListener("click", () => {
    fileInput.click();
});

uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("hover");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("hover");
});

uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("hover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
});

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file);
    }
});

function uploadFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        const img = document.createElement("img");
        img.src = reader.result;
        img.classList.add("uploaded-image"); // Add the class to the image

        uploadArea.innerHTML = ""; // Clear the previous content
        uploadArea.appendChild(img); // Append the image
    };
    reader.readAsDataURL(file);
}