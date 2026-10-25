const table = document.querySelector("tbody");
const addButton = document.querySelector(".add-btn");
const computeButton = document.querySelector(".compute-btn");
const downloadButton = document.querySelector(".download-btn");

// Magdagdag ng bagong subject row
addButton.addEventListener("click", function () {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td class="number"></td>
        <td>
            <input type="text" class="subject-name" placeholder="e.g. Subject Name">
        </td>
        <td>
            <input type="number" class="subject-units" placeholder="e.g. 3" min="1">
        </td>
        <td>
            <select class="subject-grade">
                <option value="" selected disabled>Select Grade</option>
                <option value="1.00">1.00</option>
                <option value="1.25">1.25</option>
                <option value="1.50">1.50</option>
                <option value="1.75">1.75</option>
                <option value="2.00">2.00</option>
                <option value="2.25">2.25</option>
                <option value="2.50">2.50</option>
                <option value="2.75">2.75</option>
                <option value="3.00">3.00</option>
                <option value="4.00">4.00</option>
                <option value="5.00">5.00</option>
            </select>
        </td>
        <td>
            <button class="delete-btn" type="button">♜</button>
        </td>
    `;

    table.appendChild(row);
    updateNumbers();
});

// Mag-delete ng subject row
table.addEventListener("click", function (event) {
    if (event.target.closest(".delete-btn")) {
        event.target.closest("tr").remove();
        updateNumbers();
    }
});

// I-update ang numbering ng mga rows
function updateNumbers() {
    const rows = table.querySelectorAll("tr");
    rows.forEach(function (row, index) {
        row.querySelector(".number").textContent = index + 1;
    });
}

updateNumbers();

// Kumuha ng datos ng mga subjects mula sa form
function getSubjectData() {
    const rows = table.querySelectorAll("tr");
    const subjects = [];

    rows.forEach(function (row) {
        const nameInput = row.querySelector(".subject-name");
        const unitsInput = row.querySelector(".subject-units");
        const gradeSelect = row.querySelector(".subject-grade");

        const name = nameInput ? nameInput.value : "";
        const units = unitsInput ? unitsInput.value : "";
        const grade = gradeSelect ? gradeSelect.value : "";

        if (units && grade) {
            subjects.push({
                name: name,
                units: parseFloat(units),
                grade: parseFloat(grade)
            });
        }
    });

    return subjects;
}

// Compute GWA button click event
computeButton.addEventListener("click", function () {
    const subjects = getSubjectData();

    if (subjects.length === 0) {
        alert("Mangyaring maglagay kahit isang subject na may units at grade.");
        return;
    }

    fetch("/compute", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ subjects: subjects })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("gwa-value").textContent = data.gwa;
        document.getElementById("total-subjects").textContent = data.total_subjects;
        document.getElementById("total-units").textContent = data.total_units;
        document.getElementById("gwa-status").textContent = "Computed";
        document.getElementById("gwa-remarks").textContent = data.remarks;
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Nabigo ang pagkalkula ng GWA mula sa backend.");
    });
});

// Download Result button click event
downloadButton.addEventListener("click", function () {
    const subjects = getSubjectData();

    if (subjects.length === 0) {
        alert("Maglagay muna ng mga subject at i-compute bago mag-download ng resulta.");
        return;
    }

    fetch("/download", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ subjects: subjects })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Download failed");
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "gwa_computation_result.txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error("Error downloading file:", error);
        alert("Nagkaroon ng problema sa pag-download ng resulta.");
    });
});