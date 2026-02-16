const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// خدمة الملفات الثابتة (CSS, JS, Images)
app.use(express.static(__dirname));

// مسار افتراضي لخدمة ملف الـ Dashboard
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});