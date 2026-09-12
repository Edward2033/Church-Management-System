import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadAsPdf(html: string, filename: string): Promise<void> {
  // Render HTML in a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:900px;height:1200px;border:none;visibility:hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();

  // Wait for images/fonts to load
  await new Promise((res) => setTimeout(res, 800));

  const canvas = await html2canvas(doc.body, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    width: 900,
    windowWidth: 900,
  });

  document.body.removeChild(iframe);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * pageW) / canvas.width;

  let y = 0;
  while (y < imgH) {
    if (y > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, -y, imgW, imgH);
    y += pageH;
  }

  pdf.save(`${filename}.pdf`);
}
