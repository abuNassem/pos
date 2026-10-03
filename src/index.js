
import app from "./app.js"; // استيراد التطبيق الذي قمنا بإعداده فوق

const PORT =  4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
