// Create a JSONEditor instance
const container = document.getElementById("jsoneditor");
const options = {};
const editor = new JSONEditor(container, options);

let initialJson = {};

function loadFolderStructure() {
    fetch("https://chess-memorizer-production.up.railway.app/api/folder-structure")
        .then((response) => response.json())
        .then((data) => {
            initialJson = data;
            editor.set(initialJson);
        })
        .catch((error) =>
            console.error("Error fetching folder structure:", error)
        );
}
loadFolderStructure();

// When the save button is clicked, get the updated JSON and send it to the server
document.getElementById("saveBtn").addEventListener("click", function () {
    const updatedJson = editor.get(); // Get updated JSON from the editor

    // Send POST request to save the updated JSON
    fetch("https://chess-memorizer-production.up.railway.app/api/folder-structure", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ json: updatedJson }),
    })
        .then((response) => response.json())
        .then((data) => {
            alert("JSON updated successfully: " + data.message);
        })
        .then(() => loadFolderStructure())
        .catch((error) => {
            alert("Error: " + error.message);
        });
});
