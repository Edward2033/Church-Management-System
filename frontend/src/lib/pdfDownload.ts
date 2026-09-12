import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// A4 at 96dpi: 794 x 1123px
const A4_W = 794;
const A4_H = 1123;

export async function downloadAsPdf(html: string, filename: string): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${A4_W}px;height:auto;border:none;visibility:hidden;`;
  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument!;
  idoc.open();
  idoc.write(html);
  idoc.close();

  await new Promise((res) => setTimeout(res, 1000));

  const body = idoc.body;
  const totalHeight = body.scrollHeight;

  const canvas = await html2canvas(body, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    width: A4_W,
    height: totalHeight,
    windowWidth: A4_W,
    windowHeight: totalHeight,
    scrollX: 0,
    scrollY: 0,
  });

  document.body.removeChild(iframe);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();   // 595.28pt
  const pdfH = pdf.internal.pageSize.getHeight();  // 841.89pt

  // Scale canvas to fit PDF width exactly
  const scale = pdfW / canvas.width;
  const scaledH = canvas.height * scale;
  const pageContentH = pdfH;

  let renderedH = 0;
  let pageIndex = 0;

  while (renderedH < scaledH) {
    if (pageIndex > 0) pdf.addPage();

    // Crop the canvas slice for this page
    const srcY = renderedH / scale;
    const srcH = Math.min(pageContentH / scale, canvas.height - srcY);

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.ceil(srcH);
    const ctx = pageCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.97);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, srcH * scale);

    renderedH += pageContentH;
    pageIndex++;
  }

  pdf.save(`${filename}.pdf`);
}
