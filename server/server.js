// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// السماح بالوصول للملفات الثابتة في المجلد الحالي
app.use(express.static(__dirname));

// المسار الرئيسي لتشغيل صفحة الداشبورد
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`✅ Server is running at: http://localhost:${PORT}`);
    console.log(`-------------------------------------------`);
});