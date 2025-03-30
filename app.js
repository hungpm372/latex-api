const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/compile-latex', (req, res) => {
    const { content } = req.body;

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'latex-'));
    const texFilePath = path.join(tempDir, 'document.tex');
    const pdfFilePath = path.join(tempDir, 'document.pdf');

    try {
        fs.writeFileSync(texFilePath, content);
        // lualatex -interaction=nonstopmode
        // pdflatex
        exec(`pdflatex -interaction=nonstopmode -output-directory=${tempDir} ${texFilePath}`,
            (error, stdout, stderr) => {
                if (error) {
                    fs.rmSync(tempDir, { recursive: true, force: true });

                    return res.status(500).json({
                        message: 'Biên dịch không thành công',
                        error: stderr || error.message
                    });
                }

                try {
                    const pdfBuffer = fs.readFileSync(pdfFilePath);
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    res.contentType('application/pdf');
                    res.send(pdfBuffer);
                } catch (readError) {
                    fs.rmSync(tempDir, { recursive: true, force: true });

                    res.status(500).json({
                        message: 'Không thể đọc file PDF',
                        error: readError.message
                    });
                }
            }
        );
    } catch (writeError) {
        fs.rmSync(tempDir, { recursive: true, force: true });

        res.status(500).json({
            message: 'Lỗi trong quá trình xử lý',
            error: writeError.message
        });
    }
});

app.get("/check", (req, res) => {
    res.send("Ok");
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});