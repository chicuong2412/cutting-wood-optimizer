import React, { useRef } from 'react'
import * as XLSX from 'xlsx'
import type { StockPanel, RequiredPart } from './CuttingOptimizer'
import { useLanguage } from './LanguageContext'

interface ExcelImportProps {
  onStockPanelsImport: (panels: StockPanel[]) => void
  onRequiredPartsImport: (parts: RequiredPart[]) => void
  onClose: () => void
}

const ExcelImport: React.FC<ExcelImportProps> = ({ 
  onStockPanelsImport, 
  onRequiredPartsImport, 
  onClose 
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Process each sheet
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
          
          if (sheetName.toLowerCase().includes('stock') || sheetName.toLowerCase().includes('material')) {
            processStockData(jsonData)
          } else if (sheetName.toLowerCase().includes('part') || sheetName.toLowerCase().includes('cut')) {
            processPartsData(jsonData)
          } else {
            // Default: try to detect data type based on content
            const headers = jsonData[0]?.map(h => String(h).toLowerCase()) || []
            if (headers.some(h => h.includes('stock') || h.includes('sheet') || h.includes('material'))) {
              processStockData(jsonData)
            } else {
              processPartsData(jsonData)
            }
          }
        })
        
        alert(t.importSuccess)
        onClose()
      } catch (error) {
        console.error('Error reading Excel file:', error)
        alert(t.importError)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const processStockData = (data: any[][]) => {
    const stockPanels: StockPanel[] = []
    
    // Skip header row and process data
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length < 3) continue
      
      const length = parseFloat(row[0]) || parseFloat(row[1]) || 0
      const width = parseFloat(row[1]) || parseFloat(row[2]) || 0
      const quantity = parseInt(row[2]) || parseInt(row[3]) || 1
      
      if (length > 0 && width > 0) {
        stockPanels.push({
          id: `stock_${Date.now()}_${i}`,
          length,
          width,
          quantity
        })
      }
    }
    
    if (stockPanels.length > 0) {
      onStockPanelsImport(stockPanels)
    }
  }

  const processPartsData = (data: any[][]) => {
    const requiredParts: RequiredPart[] = []
    
    // Skip header row and process data
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length < 3) continue
      
      const length = parseFloat(row[0]) || parseFloat(row[1]) || 0
      const width = parseFloat(row[1]) || parseFloat(row[2]) || 0
      const quantity = parseInt(row[2]) || parseInt(row[3]) || 1
      const label = String(row[3] || row[4] || row[0] || `Part ${i}`)
      
      if (length > 0 && width > 0) {
        requiredParts.push({
          id: `part_${Date.now()}_${i}`,
          length,
          width,
          quantity,
          label: label.substring(0, 50) // Limit label length
        })
      }
    }
    
    if (requiredParts.length > 0) {
      onRequiredPartsImport(requiredParts)
    }
  }

  const downloadTemplate = () => {
    // Create comprehensive Excel template
    const stockData = [
      ['Length (mm)', 'Width (mm)', 'Quantity', 'Notes'],
      [1220, 2440, 5, 'Standard plywood sheet'],
      [1220, 2440, 3, 'MDF sheet'],
      [800, 1200, 2, 'Small plywood sheet'],
      ['', '', '', ''],
      ['Instructions:', '', '', ''],
      ['- Length: Panel length in mm', '', '', ''],
      ['- Width: Panel width in mm', '', '', ''],
      ['- Quantity: Number of panels available', '', '', ''],
      ['- Notes: Optional description', '', '', '']
    ]
    
    const partsData = [
      ['Length (mm)', 'Width (mm)', 'Quantity', 'Label'],
      [300, 600, 5, 'Shelf'],
      [400, 800, 3, 'Side Panel'],
      [600, 1200, 2, 'Back Panel'],
      [200, 300, 8, 'Drawer Front'],
      [250, 400, 4, 'Door Panel'],
      ['', '', '', ''],
      ['Instructions:', '', '', ''],
      ['- Length: Part length in mm', '', '', ''],
      ['- Width: Part width in mm', '', '', ''],
      ['- Quantity: Number of parts needed', '', '', ''],
      ['- Label: Part name/description', '', '', '']
    ]
    
    const wb = XLSX.utils.book_new()
    const stockWs = XLSX.utils.aoa_to_sheet(stockData)
    const partsWs = XLSX.utils.aoa_to_sheet(partsData)
    
    XLSX.utils.book_append_sheet(wb, stockWs, 'Stock Materials')
    XLSX.utils.book_append_sheet(wb, partsWs, 'Required Parts')
    
    XLSX.writeFile(wb, 'Cutlist_Template.xlsx')
  }

  return (
    <div className="excel-import-overlay">
      <div className="excel-import-modal">
        <div className="modal-header">
          <h3>
            <span className="material-icons" style={{marginRight: '10px', verticalAlign: 'middle'}}>
              file_upload
            </span>
            {t.importFromExcel}
          </h3>
          <button onClick={onClose} className="close-btn">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="modal-content">
          <div className="import-section">
            <h4>{t.uploadExcelFile}</h4>
            <p>{t.uploadDescription}</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="file-input"
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
            >
              <span className="material-icons" style={{marginRight: '8px'}}>folder_open</span>
              {t.chooseExcelFile}
            </button>
          </div>
          
          <div className="template-section">
            <h4>{t.excelFormat}</h4>
            <p>{t.formatDescription}</p>
            
            <div className="format-examples">
              <div className="format-example">
                <h5>{t.stockMaterialsSheet}</h5>
                <table className="format-table">
                  <thead>
                    <tr>
                      <th>{t.length}</th>
                      <th>{t.width}</th>
                      <th>{t.quantity}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1220</td>
                      <td>2440</td>
                      <td>5</td>
                    </tr>
                    <tr>
                      <td>1200</td>
                      <td>2400</td>
                      <td>3</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="format-example">
                <h5>{t.requiredPartsSheet}</h5>
                <table className="format-table">
                  <thead>
                    <tr>
                      <th>{t.length}</th>
                      <th>{t.width}</th>
                      <th>{t.quantity}</th>
                      <th>{t.label}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>300</td>
                      <td>600</td>
                      <td>10</td>
                      <td>Shelf</td>
                    </tr>
                    <tr>
                      <td>400</td>
                      <td>800</td>
                      <td>6</td>
                      <td>Side Panel</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <button onClick={downloadTemplate} className="template-btn">
              <span className="material-icons" style={{marginRight: '8px'}}>download</span>
              {t.downloadTemplate}
            </button>
          </div>
        </div>
        
        <div className="modal-footer">
          <p className="note">
            <span className="material-icons" style={{marginRight: '8px', verticalAlign: 'middle'}}>lightbulb</span>
            {t.tipLabel} {t.tipDescription}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ExcelImport
