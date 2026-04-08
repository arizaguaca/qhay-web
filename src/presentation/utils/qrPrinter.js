/**
 * Generating professional print documents for QR codes.
 * Uses a temporary window to ensure style isolation and clean prints.
 */

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
  body { margin: 0; font-family: 'Inter', sans-serif; color: #000; }
  .print-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    page-break-after: always;
    text-align: center;
    padding: 60px 40px;
    box-sizing: border-box;
  }
  .header h1 { font-size: 1.8rem; margin: 0; font-weight: 700; text-transform: uppercase; color: #333; letter-spacing: 1px; }
  .qr-body { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 15px; }
  .qr-body img { width: 450px; height: 450px; }
  .qr-body h2 { font-size: 1.8rem; margin: 0; font-weight: 800; text-transform: uppercase; color: #111; }
  .qr-body p.label { font-size: 1.5rem; margin: 0; color: #666; text-transform: uppercase; font-weight: 600; }
  
  .footer { width: 100%; border-top: 2px solid #000; padding-top: 25px; }
  .footer h3 { font-size: 2.2rem; margin-bottom: 15px; font-weight: 800; }
  .footer div { font-size: 1.8rem; color: #222; margin-bottom: 10px; font-weight: 600; }
  
  @media print {
    @page { margin: 0; }
    body { -webkit-print-color-adjust: exact; }
  }
`;

const INSTRUCTIONS_HTML = `
  <div class="footer">
    <h3>¿Cómo pedir?</h3>
    <div>1. Escanea el código con tu cámara.</div>
    <div>2. Elige tus platos favoritos del menú.</div>
    <div>3. Confirma y ¡nosotros te lo llevamos!</div>
  </div>
`;

/**
 * Validates if the label is redundant (e.g. "Mesa 7" when it's already mesa 7)
 */
const shouldShowLabel = (qr) => {
  const isDuplicateLabel = qr.label?.toLowerCase().trim() === `mesa ${qr.tableNumber}`;
  return qr.label && !isDuplicateLabel;
};

/**
 * Prints a single QR code card
 */
export const printSingleQR = (qr, restaurantName) => {
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(window.location.origin + qr.slugPath)}&size=800&margin=1`;
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  
  const showLabel = shouldShowLabel(qr);

  const html = `
    <html>
      <head>
        <title>${restaurantName} - Mesa ${qr.tableNumber}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        <div class="print-page">
          <div class="header">
            <h1>${restaurantName || 'Mi Restaurante'}</h1>
          </div>
          
          <div class="qr-body">
            <img src="${qrUrl}" />
            <h2>MESA ${qr.tableNumber}</h2>
            ${showLabel ? `<p class="label">${qr.label}</p>` : ''}
          </div>
          
          ${INSTRUCTIONS_HTML}
        </div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => { window.close(); }, 1500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Prints all QR codes as a multi-page document
 */
export const printAllQRs = (qrs, restaurantName) => {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  
  let pagesHtml = '';

  qrs.filter(qr => qr.isActive).forEach(qr => {
    const showLabel = shouldShowLabel(qr);
    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(window.location.origin + qr.slugPath)}&size=800&margin=1`;

    pagesHtml += `
      <div class="print-page">
        <div class="header">
          <h1>${restaurantName || 'Mi Restaurante'}</h1>
        </div>
        
        <div class="qr-body">
          <img src="${qrUrl}" />
          <h2>MESA ${qr.tableNumber}</h2>
          ${showLabel ? `<p class="label">${qr.label}</p>` : ''}
        </div>
        
        ${INSTRUCTIONS_HTML}
      </div>
    `;
  });

  const html = `
    <html>
      <head>
        <title>QRs - ${restaurantName}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        ${pagesHtml}
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => { window.close(); }, 1500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
