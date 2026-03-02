const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate unique certificate ID
const generateCertificateId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `COLLEXA-${timestamp}-${random}`.toUpperCase();
};

// Ensure certificates directory exists
const ensureCertificatesDir = () => {
  const certDir = path.join(__dirname, '../../uploads/certificates');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }
  return certDir;
};

// Generate PDF certificate
const generateCertificate = async (participantName, eventName, eventDate, collegeName, rank) => {
  return new Promise((resolve, reject) => {
    try {
      const certificateId = generateCertificateId();
      const certDir = ensureCertificatesDir();
      const fileName = `certificate_${certificateId}.pdf`;
      const filePath = path.join(certDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Create write stream
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9fa');

      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(3)
        .stroke('#3b82f6');

      // Inner border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .lineWidth(1)
        .stroke('#60a5fa');

      // Logo text at top
      doc.fontSize(36)
        .font('Helvetica-Bold')
        .fillColor('#3b82f6')
        .text('COLLEXA', 0, 80, { align: 'center' });

      doc.fontSize(14)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text('College Event Management System', { align: 'center' });

      // Certificate title
      doc.moveDown(2);
      doc.fontSize(32)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Certificate of Participation', { align: 'center' });

      // Decorative line
      doc.moveDown(0.5);
      doc.lineWidth(2)
        .strokeColor('#3b82f6')
        .moveTo(doc.page.width / 2 - 150, doc.y)
        .lineTo(doc.page.width / 2 + 150, doc.y)
        .stroke();

      // "This is to certify that" text
      doc.moveDown(1.5);
      doc.fontSize(16)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text('This is to certify that', { align: 'center' });

      // Participant name
      doc.moveDown(0.5);
      doc.fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text(participantName, { align: 'center' });

      let activityText = 'has successfully participated in';
      if (rank && rank !== 'participated') {
        activityText = `has secured Rank ${rank} in`;
      }

      // "has successfully participated in" text
      doc.moveDown(1);
      doc.fontSize(16)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text(activityText, { align: 'center' });

      // Event name
      doc.moveDown(0.5);
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#3b82f6')
        .text(eventName, { align: 'center' });

      // College name
      doc.moveDown(0.5);
      doc.fontSize(16)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text(`organized by ${collegeName || 'Collexa'}`, { align: 'center' });

      // Event date
      doc.moveDown(0.5);
      const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(14)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(`held on ${formattedDate}`, { align: 'center' });

      // Certificate ID
      doc.moveDown(2);
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#9ca3af')
        .text(`Certificate ID: ${certificateId}`, { align: 'center' });

      // Footer message
      doc.moveDown(1);
      doc.fontSize(12)
        .font('Helvetica-Oblique')
        .fillColor('#6b7280')
        .text('Certificate of Participation – Collexa', { align: 'center' });

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      stream.on('finish', () => {
        resolve({
          certificateId,
          certificatePath: `/uploads/certificates/${fileName}`,
          filePath: filePath
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateCertificate,
  generateCertificateId
};
