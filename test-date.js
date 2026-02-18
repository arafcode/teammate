
const dateStrFromController = "2024-02-14 12:00:00"; // Assume this was UTC 12:00, but stripped of Z

console.log("Original String:", dateStrFromController);

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    console.log("Interpreted Date (Local):", d.toString());
    console.log("Interpreted Date (ISO):", d.toISOString());
    return d.toISOString().slice(0, 19).replace('T', ' ');
};

const result = formatDate(dateStrFromController);
console.log("Resulting String:", result);
