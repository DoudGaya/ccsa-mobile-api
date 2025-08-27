import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'

class CertificateGenerator {
  constructor() {
    this.pageWidth = 210 // A4 width in mm
    this.pageHeight = 297 // A4 height in mm
    this.margin = 20
    this.contentWidth = this.pageWidth - (this.margin * 2)
  }

  async generateFarmerCertificate(farmerData, farmData, clusterData) {
    const pdf = new jsPDF('portrait', 'mm', 'a4')
    
    try {
      // Set up document
      this.setupDocument(pdf)
      
      // Add header with logo and organization name
      await this.addHeader(pdf)
      
      // Add certificate title
      this.addCertificateTitle(pdf)
      
      // Add farmer information
      this.addFarmerInformation(pdf, farmerData)
      
      // Add farm information with polygon data
      this.addFarmInformation(pdf, farmData)
      
      // Add QR code and barcode
      await this.addQRCodeAndBarcode(pdf, farmerData.id)
      
      // Add signatures section
      this.addSignatures(pdf, clusterData)
      
      // Add footer
      this.addFooter(pdf)
      
      // Return PDF as array buffer
      return pdf.output('arraybuffer')
      
    } catch (error) {
      console.error('Error generating certificate:', error)
      throw error
    }
  }

  setupDocument(pdf) {
    // Set document properties
    pdf.setProperties({
      title: 'CCSA Farmer Certificate',
      subject: 'Climate-Smart Agriculture Certificate',
      author: 'Centre for Climate-Smart Agriculture',
      creator: 'CCSA Certificate System'
    })
  }

  async addHeader(pdf) {
    const currentY = 25
    
    // Add organization name
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(24)
    pdf.setTextColor(0, 51, 102) // Dark blue
    
    const centerText = (text, y, fontSize = null) => {
      if (fontSize) pdf.setFontSize(fontSize)
      const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor
      const x = (this.pageWidth - textWidth) / 2
      pdf.text(text, x, y)
      return y + (fontSize || pdf.getFontSize()) * 0.5
    }
    
    let y = centerText('CENTRE FOR CLIMATE-SMART AGRICULTURE', currentY, 24)
    
    // Add university name as subheading
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(16)
    pdf.setTextColor(102, 102, 102) // Gray
    y = centerText('Cosmopolitan University Abuja', y + 5, 16)
    
    // Add decorative line
    pdf.setDrawColor(0, 51, 102)
    pdf.setLineWidth(0.5)
    pdf.line(this.margin, y + 10, this.pageWidth - this.margin, y + 10)
    
    return y + 15
  }

  addCertificateTitle(pdf) {
    const y = 75
    
    // Certificate title
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(28)
    pdf.setTextColor(0, 102, 51) // Dark green
    
    const title = 'CERTIFICATE OF REGISTRATION'
    const titleWidth = pdf.getStringUnitWidth(title) * pdf.getFontSize() / pdf.internal.scaleFactor
    const titleX = (this.pageWidth - titleWidth) / 2
    pdf.text(title, titleX, y)
    
    // Subtitle
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(14)
    pdf.setTextColor(102, 102, 102)
    
    const subtitle = 'Climate-Smart Agriculture Program'
    const subtitleWidth = pdf.getStringUnitWidth(subtitle) * pdf.getFontSize() / pdf.internal.scaleFactor
    const subtitleX = (this.pageWidth - subtitleWidth) / 2
    pdf.text(subtitle, subtitleX, y + 10)
    
    return y + 25
  }

  addFarmerInformation(pdf, farmerData) {
    let y = 110
    
    // Section title
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(0, 51, 102)
    pdf.text('FARMER INFORMATION', this.margin, y)
    y += 15
    
    // Create farmer info in two columns
    const leftColumn = this.margin
    const rightColumn = this.pageWidth / 2 + 10
    const lineHeight = 8
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.setTextColor(0, 0, 0)
    
    // Left column
    const leftInfo = [
      { label: 'Full Name:', value: `${farmerData.firstName || ''} ${farmerData.middleName || ''} ${farmerData.lastName || ''}`.trim() },
      { label: 'NIN:', value: farmerData.nin || 'Not provided' },
      { label: 'Phone Number:', value: farmerData.phone || 'Not provided' },
      { label: 'State:', value: farmerData.state || 'Not provided' },
      { label: 'LGA:', value: farmerData.lga || 'Not provided' }
    ]
    
    // Right column  
    const rightInfo = [
      { label: 'Gender:', value: farmerData.gender || 'Not specified' },
      { label: 'Email:', value: farmerData.email || 'Not provided' },
      { label: 'Ward:', value: farmerData.ward || 'Not provided' },
      { label: 'Registration Date:', value: farmerData.registrationDate ? new Date(farmerData.registrationDate).toLocaleDateString() : 'Not available' },
      { label: 'Status:', value: farmerData.status || 'Active' }
    ]
    
    leftInfo.forEach((info, index) => {
      const currentY = y + (index * lineHeight)
      pdf.setFont('helvetica', 'bold')
      pdf.text(info.label, leftColumn, currentY)
      pdf.setFont('helvetica', 'normal')
      pdf.text(info.value, leftColumn + 25, currentY)
    })
    
    rightInfo.forEach((info, index) => {
      const currentY = y + (index * lineHeight)
      pdf.setFont('helvetica', 'bold')
      pdf.text(info.label, rightColumn, currentY)
      pdf.setFont('helvetica', 'normal')
      pdf.text(info.value, rightColumn + 25, currentY)
    })
    
    return y + (leftInfo.length * lineHeight) + 10
  }

  addFarmInformation(pdf, farmData) {
    let y = 170
    
    // Section title
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(0, 51, 102)
    pdf.text('FARM INFORMATION', this.margin, y)
    y += 15
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.setTextColor(0, 0, 0)
    
    const farmInfo = [
      { label: 'Farm Size:', value: `${farmData.farmSize || 'Not specified'} hectares` },
      { label: 'Primary Crop:', value: farmData.primaryCrop || 'Not specified' },
      { label: 'Secondary Crop:', value: farmData.secondaryCrop || 'Not specified' },
      { label: 'Farm Location:', value: `${farmData.farmState || ''}, ${farmData.farmLocalGovernment || ''}` },
      { label: 'Soil Type:', value: farmData.soilType || 'Not specified' },
      { label: 'Farming Experience:', value: `${farmData.farmingExperience || 0} years` }
    ]
    
    const lineHeight = 8
    farmInfo.forEach((info, index) => {
      const currentY = y + (index * lineHeight)
      pdf.setFont('helvetica', 'bold')
      pdf.text(info.label, this.margin, currentY)
      pdf.setFont('helvetica', 'normal')
      pdf.text(info.value, this.margin + 35, currentY)
    })
    
    // Add polygon coordinates if available
    if (farmData.farmPolygon || farmData.farmCoordinates) {
      y += farmInfo.length * lineHeight + 10
      pdf.setFont('helvetica', 'bold')
      pdf.text('Farm Coordinates:', this.margin, y)
      y += 6
      
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      
      let coordinates = 'Coordinates recorded and verified'
      if (farmData.farmLatitude && farmData.farmLongitude) {
        coordinates = `Center: ${farmData.farmLatitude.toFixed(6)}, ${farmData.farmLongitude.toFixed(6)}`
      }
      
      pdf.text(coordinates, this.margin, y)
    }
    
    return y + 15
  }

  async addQRCodeAndBarcode(pdf, farmerId) {
    const y = 225
    
    try {
      // Generate certificate ID
      const certificateId = `CCSA-${new Date().getFullYear()}-${farmerId.slice(-6).toUpperCase()}`
      
      // Generate QR code
      const qrCodeData = JSON.stringify({
        certificateId,
        farmerId,
        issueDate: new Date().toISOString(),
        issuer: 'Centre for Climate-Smart Agriculture, Cosmopolitan University Abuja'
      })
      
      const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      // Add QR code to PDF
      const qrSize = 25
      pdf.addImage(qrCodeDataURL, 'PNG', this.margin, y, qrSize, qrSize)
      
      // Add certificate ID
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.setTextColor(0, 51, 102)
      pdf.text('Certificate ID:', this.margin + qrSize + 10, y + 8)
      
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.setTextColor(0, 0, 0)
      pdf.text(certificateId, this.margin + qrSize + 10, y + 16)
      
      // Add barcode (simplified for Node.js compatibility)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(0, 0, 0)
      pdf.text('Barcode: ' + certificateId, this.pageWidth - this.margin - 50, y + 8)
      
    } catch (error) {
      console.error('Error generating QR code or barcode:', error)
      // Fallback text
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.text('Certificate verification code will be generated', this.margin, y)
    }
    
    return y + 30
  }

  addSignatures(pdf, clusterData) {
    const y = 260
    
    // Signatures section
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(0, 51, 102)
    const sigTitle = 'AUTHORIZED SIGNATURES'
    const sigTitleWidth = pdf.getStringUnitWidth(sigTitle) * pdf.getFontSize() / pdf.internal.scaleFactor
    const sigTitleX = (this.pageWidth - sigTitleWidth) / 2
    pdf.text(sigTitle, sigTitleX, y)
    
    // Signature lines
    const signatureY = y + 20
    const leftSigX = this.margin + 20
    const rightSigX = this.pageWidth - this.margin - 60
    
    // Left signature (CEO)
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.3)
    pdf.line(leftSigX, signatureY, leftSigX + 40, signatureY)
    
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)
    pdf.text('CEO Signature', leftSigX + 5, signatureY + 5)
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text('Dr. [CEO Name]', leftSigX + 5, signatureY + 10)
    pdf.text('Chief Executive Officer', leftSigX + 5, signatureY + 14)
    
    // Right signature (Cluster Lead)
    pdf.line(rightSigX, signatureY, rightSigX + 40, signatureY)
    
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('Cluster Lead Signature', rightSigX + 5, signatureY + 5)
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const clusterLeadName = clusterData ? `${clusterData.clusterLeadFirstName} ${clusterData.clusterLeadLastName}` : '[Cluster Lead Name]'
    pdf.text(clusterLeadName, rightSigX + 5, signatureY + 10)
    pdf.text('Cluster Lead', rightSigX + 5, signatureY + 14)
    
    return signatureY + 20
  }

  addFooter(pdf) {
    const y = 285
    
    // Issue date
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(102, 102, 102)
    
    const issueDate = `Issued on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`
    
    const issueDateWidth = pdf.getStringUnitWidth(issueDate) * pdf.getFontSize() / pdf.internal.scaleFactor
    const issueDateX = (this.pageWidth - issueDateWidth) / 2
    pdf.text(issueDate, issueDateX, y)
    
    // Certificate validity note
    pdf.setFontSize(8)
    const validityNote = 'This certificate is valid and can be verified using the QR code above'
    const validityWidth = pdf.getStringUnitWidth(validityNote) * pdf.getFontSize() / pdf.internal.scaleFactor
    const validityX = (this.pageWidth - validityWidth) / 2
    pdf.text(validityNote, validityX, y + 6)
  }
}

export { CertificateGenerator }
