import { useState } from 'react'
import './App.css'
import { CuttingOptimizer } from './CuttingOptimizer'
import type { StockPanel, RequiredPart, CuttingSettings, OptimizationResult } from './CuttingOptimizer'
import CuttingDiagram from './CuttingDiagram'
import ExcelImport from './ExcelImport'
import { useLanguage } from './LanguageContext'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

function App() {
  const { language, setLanguage, t } = useLanguage();

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, tableType: 'stock' | 'required', rowIndex: number, fieldName: string) => {
    const { key } = e
    
    if (key === 'Enter') {
      e.preventDefault()
      
      if (tableType === 'stock') {
        const fields = settings.calculatePanelCount ? ['length', 'width'] : ['length', 'width', 'quantity']
        const currentFieldIndex = fields.indexOf(fieldName)
        
        if (currentFieldIndex < fields.length - 1) {
          // Move to next field in same row
          const nextField = fields[currentFieldIndex + 1]
          const nextInput = document.querySelector(`input[data-panel-id="${stockPanels[rowIndex].id}"][data-field="${nextField}"]`) as HTMLInputElement
          if (nextInput) {
            nextInput.focus()
            nextInput.select()
          }
        } else {
          // Last field in row, add new row or move to first field of next row
          if (rowIndex === stockPanels.length - 1) {
            addStockPanel()
          } else {
            const nextRowInput = document.querySelector(`input[data-panel-id="${stockPanels[rowIndex + 1].id}"][data-field="length"]`) as HTMLInputElement
            if (nextRowInput) {
              nextRowInput.focus()
              nextRowInput.select()
            }
          }
        }
      } else if (tableType === 'required') {
        const fields = ['length', 'width', 'quantity', 'label']
        const currentFieldIndex = fields.indexOf(fieldName)
        
        if (currentFieldIndex < fields.length - 1) {
          // Move to next field in same row
          const nextField = fields[currentFieldIndex + 1]
          const nextInput = document.querySelector(`input[data-part-id="${requiredParts[rowIndex].id}"][data-field="${nextField}"]`) as HTMLInputElement
          if (nextInput) {
            nextInput.focus()
            nextInput.select()
          }
        } else {
          // Last field in row, add new row or move to first field of next row
          if (rowIndex === requiredParts.length - 1) {
            addRequiredPart()
          } else {
            const nextRowInput = document.querySelector(`input[data-part-id="${requiredParts[rowIndex + 1].id}"][data-field="length"]`) as HTMLInputElement
            if (nextRowInput) {
              nextRowInput.focus()
              nextRowInput.select()
            }
          }
        }
      }
    } else if (key === 'Tab') {
      // Let default tab behavior work
      return
    } else if (key === 'Escape') {
      // Clear field
      e.preventDefault()
      ;(e.target as HTMLInputElement).value = ''
    }
  }
  
  // State management - with sample data for demo
  const [stockPanels, setStockPanels] = useState<StockPanel[]>([
    { id: '1', length: 1220, width: 2440, quantity: 2 }
  ])
  
  const [requiredParts, setRequiredParts] = useState<RequiredPart[]>([
    { id: '1', length: 300, width: 600, quantity: 5, label: 'Shelf' },
    { id: '2', length: 400, width: 800, quantity: 3, label: 'Side Panel' },
    { id: '3', length: 600, width: 1200, quantity: 2, label: 'Back Panel' }
  ])
  
  const [settings, setSettings] = useState<CuttingSettings>({
    kerf: 3,
    grainDirection: false,
    trimEdges: false,
    rollMaterial: false,
    edgeBanding: false,
    prioritization: false,
    units: 'mm',
    calculatePanelCount: false,
    optimizationGoal: 'minimize_waste'
  })
  
  const [results, setResults] = useState<OptimizationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showExcelImport, setShowExcelImport] = useState(false)

  // Add new stock panel
  const addStockPanel = () => {
    const newPanel: StockPanel = {
      id: Date.now().toString(),
      length: 1220,
      width: 2440,
      quantity: 1
    }
    setStockPanels([...stockPanels, newPanel])
    
    // Auto-focus the length field of the new panel
    setTimeout(() => {
      const lengthInput = document.querySelector(`input[data-panel-id="${newPanel.id}"][data-field="length"]`) as HTMLInputElement
      if (lengthInput) {
        lengthInput.focus()
        lengthInput.select()
      }
    }, 100)
  }

  // Remove stock panel
  const removeStockPanel = (id: string) => {
    setStockPanels(stockPanels.filter(panel => panel.id !== id))
  }

  // Update stock panel
  const updateStockPanel = (id: string, field: keyof StockPanel, value: number) => {
    setStockPanels(stockPanels.map(panel => 
      panel.id === id ? { ...panel, [field]: value } : panel
    ))
  }

  // Add new required part
  const addRequiredPart = () => {
    const newPart: RequiredPart = {
      id: Date.now().toString(),
      length: 300,
      width: 600,
      quantity: 1,
      label: ''
    }
    setRequiredParts([...requiredParts, newPart])
    
    // Auto-focus the length field of the new part
    setTimeout(() => {
      const lengthInput = document.querySelector(`input[data-part-id="${newPart.id}"][data-field="length"]`) as HTMLInputElement
      if (lengthInput) {
        lengthInput.focus()
        lengthInput.select()
      }
    }, 100)
  }

  // Remove required part
  const removeRequiredPart = (id: string) => {
    setRequiredParts(requiredParts.filter(part => part.id !== id))
  }

  // Update required part
  const updateRequiredPart = (id: string, field: keyof RequiredPart, value: number | string) => {
    setRequiredParts(requiredParts.map(part => 
      part.id === id ? { ...part, [field]: value } : part
    ))
  }

  // Optimization algorithm using 2D bin packing
  const optimizeCutting = async () => {
    setIsCalculating(true)
    
    try {
      // Validate inputs
      if (stockPanels.some(panel => panel.length <= 0 || panel.width <= 0)) {
        alert(t.validationStock)
        setIsCalculating(false)
        return
      }

      // Validate stock panel quantities only if not calculating panel count
      if (!settings.calculatePanelCount && stockPanels.some(panel => panel.quantity <= 0)) {
        alert(t.validationStock)
        setIsCalculating(false)
        return
      }
      
      if (requiredParts.some(part => part.length <= 0 || part.width <= 0 || part.quantity <= 0)) {
        alert(t.validationParts)
        setIsCalculating(false)
        return
      }
      
      // Simulate calculation time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Prepare stock panels for optimization
      const stockPanelsForOptimization = settings.calculatePanelCount 
        ? stockPanels.map(panel => ({ ...panel, quantity: panel.quantity || 1 }))
        : stockPanels
      
      // Run optimization
      const optimizer = new CuttingOptimizer(settings)
      const result = optimizer.optimize(stockPanelsForOptimization, requiredParts)
      
      setResults(result)
    } catch (error) {
      console.error('Optimization error:', error)
      console.error('Error details:', error instanceof Error ? error.message : error)
      alert(`${t.optimizationError}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCalculating(false)
    }
  }

  // Excel import handlers
  const handleStockPanelsImport = (importedPanels: StockPanel[]) => {
    setStockPanels(importedPanels)
  }

  const handleRequiredPartsImport = (importedParts: RequiredPart[]) => {
    setRequiredParts(importedParts)
  }

  // Export functions
  const exportToExcel = () => {
    if (!results) return

    const wb = XLSX.utils.book_new()
    
    // Helper function to format worksheets
    const formatWorksheet = (ws: any, colWidths: number[]) => {
      ws['!cols'] = colWidths.map(width => ({ width }))
      
      // Set row heights for better readability
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
      ws['!rows'] = Array(range.e.r + 1).fill({ hpt: 25 }) // 25pt row height
      
      // Apply wrap text to all cells
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
          if (ws[cellRef]) {
            ws[cellRef].s = {
              alignment: {
                wrapText: true,
                vertical: 'center',
                horizontal: row === 0 || row === 1 ? 'center' : 'left'
              },
              font: {
                bold: row <= 1,
                size: row === 0 ? 14 : 11
              },
              fill: row === 0 ? { fgColor: { rgb: '4472C4' } } : 
                   row === 1 ? { fgColor: { rgb: 'D9E1F2' } } : undefined,
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              }
            }
          }
        }
      }
    }
    
    // Results Summary Sheet
    const summaryData = [
      ['🔧 CUTTING WOOD OPTIMIZATION RESULTS'],
      [`Generated: ${new Date().toLocaleString()} | Units: ${settings.units}`],
      [''],
      ['📊 OPTIMIZATION METRICS', '', ''],
      ['Metric', 'Value', 'Notes'],
      ['Sheets Used', results.usedSheets, 'Total number of material sheets needed'],
      ['Total Waste', `${results.totalWaste.toFixed(2)} ${settings.units}²`, 'Material that will be discarded'],
      ['Material Used', `${results.materialUsed.toFixed(2)} ${settings.units}²`, 'Material actually converted to parts'],
      ['Efficiency', `${results.efficiency.toFixed(1)}%`, 'Percentage of material utilized'],
      ['Estimated Cut Time', `${results.cutTime} minutes`, 'Approximate time needed for cutting'],
      ['Total Parts Placed', results.layouts.reduce((sum, layout) => sum + layout.parts.length, 0), 'Number of parts successfully placed'],
      [''],
      ['⚙️ CUTTING SETTINGS', '', ''],
      ['Kerf (Blade Thickness)', `${settings.kerf} ${settings.units}`, 'Material lost per cut'],
      ['Optimization Goal', settings.optimizationGoal.replace('_', ' ').toUpperCase(), 'Strategy used for optimization']
    ]
    
    if (settings.calculatePanelCount && results.recommendedPanelCount) {
      summaryData.push([''], ['🧮 PANEL RECOMMENDATIONS', '', ''])
      summaryData.push(['Recommended Panels to Buy', results.recommendedPanelCount, 'Based on actual cutting simulation'])
      summaryData.push(['Total Parts Area', `${results.totalPartsArea?.toFixed(2) || '0'} ${settings.units}²`, 'Sum of all individual part areas'])
    }

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    formatWorksheet(summaryWs, [30, 20, 40])
    
    // Merge header cells
    summaryWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, // Generated info
      { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }, // Metrics section
      { s: { r: 12, c: 0 }, e: { r: 12, c: 2 } }  // Settings section
    ]
    
    if (settings.calculatePanelCount) {
      summaryWs['!merges'].push({ s: { r: 16, c: 0 }, e: { r: 16, c: 2 } }) // Panel section
    }
    
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Parts Cut Summary Sheet
    const partsSummaryData = [
      ['🔍 PARTS CUT ANALYSIS'],
      ['Detailed breakdown of required vs actually cut parts'],
      [''],
      ['Part Name', 'Dimensions', 'Required Qty', 'Cut Qty', 'Status', 'Missing', 'Notes']
    ]
    
    const partsSummary = new Map<string, { label: string; required: number; cut: number; dimensions: string; }>()
    
    requiredParts.forEach(part => {
      const key = `${part.length}x${part.width}`
      const existing = partsSummary.get(key) || {
        label: part.label,
        required: 0,
        cut: 0,
        dimensions: `${part.length} × ${part.width} ${settings.units}`
      }
      existing.required += part.quantity
      partsSummary.set(key, existing)
    })
    
    results.layouts.forEach(layout => {
      layout.parts.forEach(placedPart => {
        let matchingPart = requiredParts.find(rp => rp.label === placedPart.label)
        if (!matchingPart) {
          matchingPart = requiredParts.find(rp => 
            (rp.length === placedPart.width && rp.width === placedPart.height) ||
            (rp.length === placedPart.height && rp.width === placedPart.width)
          )
        }
        if (matchingPart) {
          const key = `${matchingPart.length}x${matchingPart.width}`
          const existing = partsSummary.get(key)
          if (existing) {
            existing.cut += 1
          }
        }
      })
    })

    Array.from(partsSummary.entries()).forEach(([, summary]) => {
      const status = summary.cut >= summary.required ? '✅ Complete' : '❌ Incomplete'
      const missing = Math.max(0, summary.required - summary.cut)
      const notes = summary.cut >= summary.required 
        ? 'All required parts successfully cut'
        : `Need to cut ${missing} more piece(s)`
        
      partsSummaryData.push([
        summary.label || 'Unnamed Part',
        summary.dimensions,
        summary.required.toString(),
        summary.cut.toString(),
        status,
        missing.toString(),
        notes
      ])
    })

    const partsSummaryWs = XLSX.utils.aoa_to_sheet(partsSummaryData)
    formatWorksheet(partsSummaryWs, [25, 20, 12, 12, 15, 10, 35])
    
    // Merge headers
    partsSummaryWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }  // Description
    ]
    
    XLSX.utils.book_append_sheet(wb, partsSummaryWs, 'Parts Summary')

    // Cutting Layouts Sheet
    const layoutsData = [
      ['📐 CUTTING LAYOUT INSTRUCTIONS'],
      ['Follow these layouts step-by-step to cut your materials efficiently'],
      [''],
      ['Sheet #', 'Sheet Dimensions', 'Parts Count', 'Efficiency %', 'Parts on This Sheet', 'Cutting Instructions']
    ]
    
    results.layouts.forEach((layout, index) => {
      const sheetSize = `${layout.sheetWidth} × ${layout.sheetHeight} ${settings.units}`
      const partsCount = layout.parts.length
      const sheetArea = layout.sheetWidth * layout.sheetHeight
      const usedArea = layout.parts.reduce((sum, part) => sum + (part.width * part.height), 0)
      const efficiency = `${((usedArea / sheetArea) * 100).toFixed(1)}%`
      
      const partsList = layout.parts.map((part, partIndex) => 
        `${partIndex + 1}. ${part.label || 'Part'} (${part.width}×${part.height}${settings.units})${part.rotated ? ' [ROTATED]' : ''}\n   Position: (${part.x}, ${part.y})`
      ).join('\n')
      
      const instructions = `1. Mark the sheet with dimensions ${sheetSize}\n2. Account for ${settings.kerf}${settings.units} blade thickness\n3. Start cutting from top-left corner\n4. Double-check measurements before cutting\n5. Label each cut piece immediately`
      
      layoutsData.push([
        `Sheet ${index + 1}`,
        sheetSize,
        partsCount.toString(),
        efficiency,
        partsList,
        instructions
      ])
    })

    const layoutsWs = XLSX.utils.aoa_to_sheet(layoutsData)
    formatWorksheet(layoutsWs, [12, 20, 12, 12, 50, 40])
    
    // Merge headers
    layoutsWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }  // Description
    ]
    
    // Set higher row heights for layout instructions
    if (layoutsWs['!rows']) {
      for (let i = 4; i < layoutsData.length; i++) {
        layoutsWs['!rows'][i] = { hpt: 120 } // Taller rows for detailed instructions
      }
    }
    
    XLSX.utils.book_append_sheet(wb, layoutsWs, 'Cutting Instructions')

    // Visual Cutting Diagrams Sheet with Actual Images
    // Note: generateCuttingImage function reserved for future Excel image embedding
    /* const generateCuttingImage = (layout: any, sheetIndex: number): string => {
      // Create canvas for generating the cutting diagram image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Canvas dimensions (scaled down for Excel)
      const canvasWidth = 600
      const canvasHeight = 400
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      
      // Calculate scale factors
      const scaleX = canvasWidth / layout.sheetWidth
      const scaleY = canvasHeight / layout.sheetHeight
      const scale = Math.min(scaleX, scaleY) * 0.9 // Leave some margin
      
      // Center the drawing
      const offsetX = (canvasWidth - layout.sheetWidth * scale) / 2
      const offsetY = (canvasHeight - layout.sheetHeight * scale) / 2
      
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      
      // Draw sheet outline
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.strokeRect(offsetX, offsetY, layout.sheetWidth * scale, layout.sheetHeight * scale)
      
      // Draw sheet label
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `Sheet ${sheetIndex + 1}: ${layout.sheetWidth} × ${layout.sheetHeight} ${settings.units}`,
        canvasWidth / 2,
        30
      )
      
      // Color palette for parts
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
        '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
        '#6C5CE7', '#FD79A8', '#74B9FF', '#00B894', '#FDCB6E'
      ]
      
      // Draw parts
      layout.parts.forEach((part: any, partIndex: number) => {
        const x = offsetX + part.x * scale
        const y = offsetY + part.y * scale
        const width = part.width * scale
        const height = part.height * scale
        
        // Fill part with color
        ctx.fillStyle = colors[partIndex % colors.length]
        ctx.fillRect(x, y, width, height)
        
        // Draw part border
        ctx.strokeStyle = '#333333'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, width, height)
        
        // Draw part label and dimensions
        ctx.fillStyle = '#000000'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        
        const centerX = x + width / 2
        const centerY = y + height / 2
        
        // Part name
        const partName = part.label || `Part ${partIndex + 1}`
        ctx.fillText(partName, centerX, centerY - 8)
        
        // Part dimensions
        const dimensions = `${part.width}×${part.height}${settings.units}`
        ctx.fillText(dimensions, centerX, centerY + 8)
        
        // Rotation indicator
        if (part.rotated) {
          ctx.fillText('↻', centerX, centerY + 22)
        }
      })
      
      // Draw grid lines for better readability
      ctx.strokeStyle = '#E0E0E0'
      ctx.lineWidth = 0.5
      const gridSpacing = 50 * scale
      
      // Vertical grid lines
      for (let x = offsetX; x <= offsetX + layout.sheetWidth * scale; x += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(x, offsetY)
        ctx.lineTo(x, offsetY + layout.sheetHeight * scale)
        ctx.stroke()
      }
      
      // Horizontal grid lines
      for (let y = offsetY; y <= offsetY + layout.sheetHeight * scale; y += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(offsetX, y)
        ctx.lineTo(offsetX + layout.sheetWidth * scale, y)
        ctx.stroke()
      }
      
      // Add efficiency info
      const sheetArea = layout.sheetWidth * layout.sheetHeight
      const usedArea = layout.parts.reduce((sum: number, part: any) => sum + (part.width * part.height), 0)
      const efficiency = ((usedArea / sheetArea) * 100).toFixed(1)
      
      ctx.fillStyle = '#666666'
      ctx.font = '14px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`Efficiency: ${efficiency}%`, 20, canvasHeight - 40)
      ctx.fillText(`Parts: ${layout.parts.length}`, 20, canvasHeight - 20)
      
      // Convert canvas to base64 data URL
      return canvas.toDataURL('image/png')
    } */
    
    // Create diagrams data with images
    const diagramData = [
      ['🎨 CUTTING LAYOUT DIAGRAMS'],
      ['Visual representation of optimized cutting layouts'],
      [''],
      ['Sheet', 'Dimensions', 'Parts Count', 'Efficiency', 'Visual Diagram', 'Parts List']
    ]
    
    results.layouts.forEach((layout, sheetIndex) => {
      const sheetSize = `${layout.sheetWidth} × ${layout.sheetHeight} ${settings.units}`
      const partsCount = layout.parts.length
      const sheetArea = layout.sheetWidth * layout.sheetHeight
      const usedArea = layout.parts.reduce((sum, part) => sum + (part.width * part.height), 0)
      const efficiency = `${((usedArea / sheetArea) * 100).toFixed(1)}%`
      
      // Generate base64 image (for future use)
      // const imageData = generateCuttingImage(layout, sheetIndex)
      
      // Parts list
      const partsList = layout.parts.map((part: any, partIndex: number) => 
        `${partIndex + 1}. ${part.label || 'Part'} (${part.width}×${part.height}${settings.units})${part.rotated ? ' [ROTATED]' : ''}`
      ).join('\n')
      
      diagramData.push([
        `Sheet ${sheetIndex + 1}`,
        sheetSize,
        partsCount.toString(),
        efficiency,
        `[IMAGE: Cutting layout for Sheet ${sheetIndex + 1}]`, // Note: Images in Excel require special handling
        partsList
      ])
    })
    
    const diagramWs = XLSX.utils.aoa_to_sheet(diagramData)
    formatWorksheet(diagramWs, [15, 20, 12, 12, 30, 40])
    
    // Note: Adding actual images to XLSX requires additional libraries
    // For now, we provide image placeholder and detailed text descriptions
    
    XLSX.utils.book_append_sheet(wb, diagramWs, 'Visual Layouts')

    // Panel Breakdown Sheet (if enabled)
    if (settings.calculatePanelCount && results.panelBreakdown && results.panelBreakdown.length > 0) {
      const panelData = [
        ['📊 SHOPPING LIST - PANEL BREAKDOWN'],
        ['Detailed purchase recommendations for each panel size'],
        [''],
        ['Panel Size', 'Buy Qty', 'Used Qty', 'Efficiency %', 'Parts/Sheet', 'Total Parts', 'Shopping Notes']
      ]
      
      results.panelBreakdown.forEach(panel => {
        const shoppingNotes = panel.recommended > panel.used 
          ? `Buy ${panel.recommended} sheets (${panel.recommended - panel.used} extra recommended for contingency)`
          : panel.recommended === panel.used 
          ? 'Perfect quantity - no waste expected'
          : 'Optimal usage achieved'
          
        panelData.push([
          panel.sheetSize,
          panel.recommended.toString(),
          panel.used.toString(),
          `${panel.utilization.toFixed(1)}%`,
          (panel.used > 0 ? Math.round(panel.partsCount / panel.used) : 0).toString(),
          panel.partsCount.toString(),
          shoppingNotes
        ])
      })
      
      const panelWs = XLSX.utils.aoa_to_sheet(panelData)
      formatWorksheet(panelWs, [22, 10, 10, 12, 12, 12, 45])
      
      // Merge headers
      panelWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }  // Description
      ]

      XLSX.utils.book_append_sheet(wb, panelWs, 'Shopping List')
    }

    // Save file with better naming
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const fileName = `CuttingWood_Optimization_${timestamp}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const exportToCSV = () => {
    if (!results) return

    let csvContent = "data:text/csv;charset=utf-8,"
    
    // Add summary
    csvContent += "Optimization Results Summary\n"
    csvContent += "Metric,Value,Unit\n"
    csvContent += `Sheets Used,${results.usedSheets},sheets\n`
    csvContent += `Total Waste,${results.totalWaste.toFixed(2)},${settings.units}²\n`
    csvContent += `Material Used,${results.materialUsed.toFixed(2)},${settings.units}²\n`
    csvContent += `Efficiency,${results.efficiency.toFixed(1)}%,\n`
    csvContent += `Estimated Cut Time,${results.cutTime},minutes\n`
    csvContent += `Total Parts Placed,${results.layouts.reduce((sum, layout) => sum + layout.parts.length, 0)},parts\n`
    
    if (settings.calculatePanelCount && results.recommendedPanelCount) {
      csvContent += `Recommended Panels,${results.recommendedPanelCount},panels\n`
      csvContent += `Total Parts Area,${results.totalPartsArea?.toFixed(2) || '0'},${settings.units}²\n`
    }
    
    csvContent += "\n"
    
    // Add parts summary
    csvContent += "Parts Cut Summary\n"
    csvContent += "Part Label,Dimensions,Required,Cut,Status,Missing\n"
    
    // Same parts summary logic as Excel export
    const partsSummary = new Map<string, { label: string; required: number; cut: number; dimensions: string; }>()
    
    requiredParts.forEach(part => {
      const key = `${part.length}x${part.width}`
      const existing = partsSummary.get(key) || {
        label: part.label,
        required: 0,
        cut: 0,
        dimensions: `${part.length} × ${part.width} ${settings.units}`
      }
      existing.required += part.quantity
      partsSummary.set(key, existing)
    })
    
    results.layouts.forEach(layout => {
      layout.parts.forEach(placedPart => {
        let matchingPart = requiredParts.find(rp => rp.label === placedPart.label)
        if (!matchingPart) {
          matchingPart = requiredParts.find(rp => 
            (rp.length === placedPart.width && rp.width === placedPart.height) ||
            (rp.length === placedPart.height && rp.width === placedPart.width)
          )
        }
        if (matchingPart) {
          const key = `${matchingPart.length}x${matchingPart.width}`
          const existing = partsSummary.get(key)
          if (existing) {
            existing.cut += 1
          }
        }
      })
    })

    Array.from(partsSummary.entries()).forEach(([, summary]) => {
      const status = summary.cut >= summary.required ? 'Complete' : 'Incomplete'
      const missing = Math.max(0, summary.required - summary.cut)
      csvContent += `"${summary.label || 'Unnamed Part'}","${summary.dimensions}",${summary.required},${summary.cut},"${status}",${missing}\n`
    })
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Cutlist_Results_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    // For now, use browser's print functionality
    window.print()
  }

  // Export all cutting diagrams as a single PDF file
  const exportCuttingImages = () => {
    if (!results) return

    // Create PDF document (A4 landscape for better fitting)
    const pdf = new jsPDF('landscape', 'mm', 'a4')
    let isFirstPage = true

    const generateCuttingPage = (layout: any, sheetIndex: number) => {
      // Create canvas for generating the cutting diagram image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // High-resolution canvas for better PDF quality
      const canvasWidth = 1200
      const canvasHeight = 800
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      
      // Calculate scale factors
      const scaleX = canvasWidth / layout.sheetWidth
      const scaleY = canvasHeight / layout.sheetHeight
      const scale = Math.min(scaleX, scaleY) * 0.85 // Leave margin
      
      // Center the drawing
      const offsetX = (canvasWidth - layout.sheetWidth * scale) / 2
      const offsetY = (canvasHeight - layout.sheetHeight * scale) / 2
      
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      
      // Draw title
      ctx.fillStyle = '#2c3e50'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `Sheet ${sheetIndex + 1}: ${layout.sheetWidth} × ${layout.sheetHeight} ${settings.units}`,
        canvasWidth / 2,
        50
      )
      
      // Draw sheet outline
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 4
      ctx.strokeRect(offsetX, offsetY, layout.sheetWidth * scale, layout.sheetHeight * scale)
      
      // Color palette for parts
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
        '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
        '#6C5CE7', '#FD79A8', '#74B9FF', '#00B894', '#FDCB6E'
      ]
      
      // Draw parts
      layout.parts.forEach((part: any, partIndex: number) => {
        const x = offsetX + part.x * scale
        const y = offsetY + part.y * scale
        const width = part.width * scale
        const height = part.height * scale
        
        // Fill part with color
        ctx.fillStyle = colors[partIndex % colors.length]
        ctx.fillRect(x, y, width, height)
        
        // Draw part border
        ctx.strokeStyle = '#2c3e50'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, width, height)
        
        // Draw part label and dimensions
        ctx.fillStyle = '#2c3e50'
        ctx.font = 'bold 18px Arial'
        ctx.textAlign = 'center'
        
        const centerX = x + width / 2
        const centerY = y + height / 2
        
        // Part name
        const partName = part.label || `Part ${partIndex + 1}`
        ctx.fillText(partName, centerX, centerY - 12)
        
        // Part dimensions
        ctx.font = '16px Arial'
        const dimensions = `${part.width} × ${part.height} ${settings.units}`
        ctx.fillText(dimensions, centerX, centerY + 8)
        
        // Rotation indicator
        if (part.rotated) {
          ctx.font = '20px Arial'
          ctx.fillText('↻ ROTATED', centerX, centerY + 32)
        }
      })
      
      // Draw grid lines for measurements
      ctx.strokeStyle = '#E0E0E0'
      ctx.lineWidth = 1
      const gridSpacing = 100 * scale // Every 100 units
      
      // Vertical grid lines
      for (let x = offsetX; x <= offsetX + layout.sheetWidth * scale; x += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(x, offsetY)
        ctx.lineTo(x, offsetY + layout.sheetHeight * scale)
        ctx.stroke()
      }
      
      // Horizontal grid lines
      for (let y = offsetY; y <= offsetY + layout.sheetHeight * scale; y += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(offsetX, y)
        ctx.lineTo(offsetX + layout.sheetWidth * scale, y)
        ctx.stroke()
      }
      
      // Add statistics
      const sheetArea = layout.sheetWidth * layout.sheetHeight
      const usedArea = layout.parts.reduce((sum: number, part: any) => sum + (part.width * part.height), 0)
      const efficiency = ((usedArea / sheetArea) * 100).toFixed(1)
      const wasteArea = sheetArea - usedArea
      
      ctx.fillStyle = '#34495e'
      ctx.font = '20px Arial'
      ctx.textAlign = 'left'
      const statsY = canvasHeight - 120
      ctx.fillText(`📊 Statistics:`, 40, statsY)
      ctx.fillText(`• Parts: ${layout.parts.length}`, 40, statsY + 30)
      ctx.fillText(`• Efficiency: ${efficiency}%`, 40, statsY + 60)
      ctx.fillText(`• Waste: ${wasteArea.toFixed(0)} ${settings.units}²`, 40, statsY + 90)
      
      // Add cutting notes
      ctx.textAlign = 'right'
      ctx.fillText(`⚠️ Remember ${settings.kerf}${settings.units} kerf`, canvasWidth - 40, statsY)
      ctx.fillText(`📐 Start from top-left corner`, canvasWidth - 40, statsY + 30)
      ctx.fillText(`✓ Double-check before cutting`, canvasWidth - 40, statsY + 60)
      
      return canvas
    }

    // Process each layout
    results.layouts.forEach((layout, sheetIndex) => {
      // Add new page for each sheet (except first)
      if (!isFirstPage) {
        pdf.addPage()
      }
      isFirstPage = false

      // Generate canvas for this layout
      const canvas = generateCuttingPage(layout, sheetIndex)
      
      // Convert canvas to image data and add to PDF
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Add image to PDF (fit to page with margins)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      
      pdf.addImage(
        imgData, 
        'PNG', 
        margin, 
        margin, 
        pdfWidth - 2 * margin, 
        pdfHeight - 2 * margin
      )
      
      // Add footer with sheet info
      pdf.setFontSize(10)
      pdf.setTextColor(100)
      pdf.text(
        `Generated on ${new Date().toLocaleString()} | Sheet ${sheetIndex + 1} of ${results.layouts.length}`,
        margin,
        pdfHeight - 5
      )
    })

    // Save the PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    pdf.save(`Cutting_Diagrams_${timestamp}.pdf`)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>
            <span className="material-icons-outlined" style={{fontSize: '2.5rem', marginRight: '10px', verticalAlign: 'middle'}}>
              content_cut
            </span>
            {t.appTitle}
          </h1>
          <div className="language-switcher">
            <span className="material-icons" style={{marginRight: '8px', color: '#007bff'}}>language</span>
            <span style={{fontSize: '0.9rem', color: '#6c757d'}}>Language:</span>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
              className="language-select"
            >
              <option value="en">🇺🇸 English</option>
              <option value="vi">🇻🇳 Tiếng Việt</option>
            </select>
          </div>
        </div>
        <div className="header-info">
          <span className="material-icons" style={{fontSize: '1.2rem'}}>warning</span>
          <span>{t.lookingFor}</span>
          <span className="link">
            <span className="material-icons" style={{fontSize: '1rem', marginRight: '4px'}}>straighten</span>
            {t.linearCalculator}
          </span>
          <span>{t.or}</span>
          <span className="link">
            <span className="material-icons" style={{fontSize: '1rem', marginRight: '4px'}}>calculate</span>
            {t.pieceCalculator}
          </span>
          <span>?</span>
      </div>
        <p className="description">
          {t.description}
        </p>
        <div className="additional-info">
          <span className="material-icons" style={{marginRight: '8px', verticalAlign: 'middle'}}>info</span>
          {t.additionalInfo}
        </div>
      </header>

      <div className="main-content">
        <div className="controls-panel">
          {/* Import Button */}
          <button 
            className="import-btn"
            onClick={() => setShowExcelImport(true)}
          >
            <span className="material-icons" style={{marginRight: '8px'}}>file_download</span>
            {t.importExcel}
          </button>
          
          {/* Units Selector */}
          <div className="units-selector">
            <span className="material-icons" style={{marginRight: '8px'}}>straighten</span>
            <span>{t.units}</span>
            <select 
              value={settings.units} 
              onChange={(e) => setSettings({...settings, units: e.target.value as 'mm' | 'cm' | 'inch'})}
            >
              <option value="mm">{t.genericMetric}</option>
              <option value="cm">{t.centimeters}</option>
              <option value="inch">{t.inches}</option>
            </select>
          </div>

          {/* Settings Row - Essential Settings */}
          <div className="settings-row">
            <div className="setting-group">
              <label>{t.kerfBlade}</label>
              <input 
                type="number" 
                value={settings.kerf}
                onChange={(e) => setSettings({...settings, kerf: Number(e.target.value)})}
                placeholder={t.kerfPlaceholder}
              />
            </div>
            
            <div className="setting-group">
              <label>{t.prices}</label>
              <input type="checkbox" checked={false} readOnly />
            </div>
            
            <div className="setting-group">
              <label>{t.labels}</label>
              <input type="checkbox" checked={true} readOnly />
            </div>
          </div>

          <div className="settings-row">
            <div className="setting-group feature-toggle">
              <label>{t.calculatePanelCount}</label>
              <input 
                type="checkbox" 
                checked={settings.calculatePanelCount}
                onChange={(e) => setSettings({...settings, calculatePanelCount: e.target.checked})}
              />
              <div className="feature-description">
                <span className="material-icons" style={{fontSize: '1rem', marginRight: '4px'}}>info</span>
                {t.panelCountDescription}
              </div>
            </div>
          </div>

          {/* Available Stock Panels */}
          <div className="section">
            <h3>{t.availableStock}</h3>

            <div className="keyboard-shortcuts-info">
              {t.keyboardShortcuts}
            </div>

            {/* Optimization Goal Selector */}
            <div className="optimization-goal-section">
              <h4>{t.optimizationGoal}</h4>
              <div className="goal-options">
                <label className="goal-option">
                  <input
                    type="radio"
                    name="optimizationGoal"
                    value="minimize_waste"
                    checked={settings.optimizationGoal === 'minimize_waste'}
                    onChange={(e) => setSettings({...settings, optimizationGoal: e.target.value as any})}
                  />
                  <span className="goal-icon material-icons">recycling</span>
                  <div className="goal-text">
                    <strong>{t.minimizeWaste}</strong>
                    <small>{t.minimizeWasteDesc}</small>
                  </div>
                </label>

                <label className="goal-option">
                  <input
                    type="radio"
                    name="optimizationGoal"
                    value="minimize_sheets"
                    checked={settings.optimizationGoal === 'minimize_sheets'}
                    onChange={(e) => setSettings({...settings, optimizationGoal: e.target.value as any})}
                  />
                  <span className="goal-icon material-icons">layers</span>
                  <div className="goal-text">
                    <strong>{t.minimizeSheets}</strong>
                    <small>{t.minimizeSheetsDesc}</small>
                  </div>
                </label>

                <label className="goal-option">
                  <input
                    type="radio"
                    name="optimizationGoal"
                    value="maximize_efficiency"
                    checked={settings.optimizationGoal === 'maximize_efficiency'}
                    onChange={(e) => setSettings({...settings, optimizationGoal: e.target.value as any})}
                  />
                  <span className="goal-icon material-icons">speed</span>
                  <div className="goal-text">
                    <strong>{t.maximizeEfficiency}</strong>
                    <small>{t.maximizeEfficiencyDesc}</small>
                  </div>
                </label>
              </div>
            </div>
            <table className="panels-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t.length}</th>
                  <th>{t.width}</th>
                  {!settings.calculatePanelCount && <th>{t.quantity}</th>}
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {stockPanels.map((panel, index) => (
                  <tr key={panel.id}>
                    <td>{index + 1}</td>
                    <td>
                      <input 
                        type="number" 
                        value={panel.length || ''}
                        onChange={(e) => updateStockPanel(panel.id, 'length', Number(e.target.value))}
                        data-panel-id={panel.id}
                        data-field="length"
                        placeholder="Length"
                        onKeyDown={(e) => handleKeyDown(e, 'stock', index, 'length')}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={panel.width || ''}
                        onChange={(e) => updateStockPanel(panel.id, 'width', Number(e.target.value))}
                        data-panel-id={panel.id}
                        data-field="width"
                        placeholder="Width"
                        onKeyDown={(e) => handleKeyDown(e, 'stock', index, 'width')}
                      />
                    </td>
                    {!settings.calculatePanelCount && (
                      <td>
                        <input 
                          type="number" 
                          value={panel.quantity}
                          onChange={(e) => updateStockPanel(panel.id, 'quantity', Number(e.target.value))}
                          data-panel-id={panel.id}
                          data-field="quantity"
                          placeholder="Quantity"
                          onKeyDown={(e) => handleKeyDown(e, 'stock', index, 'quantity')}
                        />
                      </td>
                    )}
                    <td>
                      <button onClick={() => removeStockPanel(panel.id)} className="delete-btn">
                        <span className="material-icons" style={{fontSize: '1rem'}}>delete</span>
                        {t.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-actions">
              <p className="note">{t.stockNote}</p>
              <button onClick={addStockPanel} className="add-btn">
                <span className="material-icons" style={{marginRight: '6px'}}>add</span>
                {t.add}
              </button>
              <button className="csv-btn">
                <span className="material-icons">table_chart</span>
              </button>
            </div>
          </div>

          {/* Required Panels */}
          <div className="section">
            <h3>{t.requiredPanels}</h3>
            <table className="panels-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t.length}</th>
                  <th>{t.width}</th>
                  <th>{t.quantity}</th>
                  <th>{t.label}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {requiredParts.map((part, index) => (
                  <tr key={part.id}>
                    <td>{index + 1}</td>
                    <td>
                      <input 
                        type="number" 
                        value={part.length || ''}
                        onChange={(e) => updateRequiredPart(part.id, 'length', Number(e.target.value))}
                        data-part-id={part.id}
                        data-field="length"
                        placeholder="Length"
                        onKeyDown={(e) => handleKeyDown(e, 'required', index, 'length')}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={part.width || ''}
                        onChange={(e) => updateRequiredPart(part.id, 'width', Number(e.target.value))}
                        data-part-id={part.id}
                        data-field="width"
                        placeholder="Width"
                        onKeyDown={(e) => handleKeyDown(e, 'required', index, 'width')}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={part.quantity}
                        onChange={(e) => updateRequiredPart(part.id, 'quantity', Number(e.target.value))}
                        data-part-id={part.id}
                        data-field="quantity"
                        placeholder="Quantity"
                        onKeyDown={(e) => handleKeyDown(e, 'required', index, 'quantity')}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={part.label}
                        onChange={(e) => updateRequiredPart(part.id, 'label', e.target.value)}
                        data-part-id={part.id}
                        data-field="label"
                        placeholder="Label"
                        onKeyDown={(e) => handleKeyDown(e, 'required', index, 'label')}
                      />
                    </td>
                    <td>
                      <button onClick={() => removeRequiredPart(part.id)} className="delete-btn">
                        <span className="material-icons" style={{fontSize: '1rem'}}>delete</span>
                        {t.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-actions">
              <button onClick={addRequiredPart} className="add-btn">
                <span className="material-icons" style={{marginRight: '6px'}}>add</span>
                {t.add}
              </button>
              <button className="more-btn">
                <span className="material-icons" style={{marginRight: '6px'}}>expand_more</span>
                {t.more}
              </button>
              <button className="csv-btn">
                <span className="material-icons">table_chart</span>
              </button>
            </div>
          </div>

          {/* Calculate Button */}
          <div className="calculate-section">
            <button 
              className="calculate-btn" 
              onClick={optimizeCutting}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <>
                  <span className="material-icons rotating" style={{marginRight: '8px'}}>hourglass_empty</span>
                  {t.calculating}
                </>
              ) : (
                <>
                  <span className="material-icons" style={{marginRight: '8px'}}>play_arrow</span>
                  {t.calculate}
                </>
              )}
            </button>
            <button className="feedback-btn">
              <span className="material-icons" style={{marginRight: '8px'}}>feedback</span>
              {t.feedback}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="results-section">
              <h3>{t.optimizationResults}</h3>
              <div className="results-grid">
                <div className="result-item">
                  <strong>{t.sheetsUsed}</strong> {results.usedSheets}
                </div>
                <div className="result-item">
                  <strong>{t.totalWaste}</strong> {results.totalWaste.toFixed(2)} {settings.units}²
                </div>
                <div className="result-item">
                  <strong>{t.materialUsed}</strong> {results.materialUsed.toFixed(2)} {settings.units}²
                </div>
                <div className="result-item">
                  <strong>{t.efficiency}</strong> {results.efficiency.toFixed(1)}%
                </div>
                <div className="result-item">
                  <strong>{t.cutTime}</strong> {results.cutTime} minutes
                </div>
                <div className="result-item">
                  <strong>{t.totalPartsPlaced}</strong> {results.layouts.reduce((sum, layout) => sum + layout.parts.length, 0)}
                </div>
                {settings.calculatePanelCount && results.recommendedPanelCount && (
                  <>
                    <div className="result-item recommended-panel">
                      <strong>{t.recommendedPanels}</strong> {results.recommendedPanelCount}
                      <div className="recommended-note">
                        {t.recommendedPanelsNote}
                      </div>
                    </div>
                    <div className="result-item">
                      <strong>{t.totalPartsArea}</strong> {results.totalPartsArea?.toFixed(2)} {settings.units}²
                    </div>
                  </>
                )}
              </div>

              {/* Parts Cut Summary */}
              <div className="parts-summary">
                <h3>{t.partsCutSummary}</h3>
                <div className="summary-grid">
                  {(() => {
                    // Calculate parts cut vs required
                    const partsSummary = new Map<string, {
                      label: string;
                      required: number;
                      cut: number;
                      dimensions: string;
                    }>();
                    
                    // Count required parts
                    requiredParts.forEach(part => {
                      const key = `${part.length}x${part.width}`;
                      const existing = partsSummary.get(key) || {
                        label: part.label,
                        required: 0,
                        cut: 0,
                        dimensions: `${part.length} × ${part.width} ${settings.units}`
                      };
                      existing.required += part.quantity;
                      partsSummary.set(key, existing);
                    });
                    
                    // Count cut parts - match by dimensions (considering rotation)
                    results.layouts.forEach(layout => {
                      layout.parts.forEach(placedPart => {
                        // Try to find matching part by dimensions (consider rotation)
                        const placedWidth = placedPart.width;
                        const placedHeight = placedPart.height;
                        
                        // Find matching part by label first, then by dimensions
                        let matchingPart = requiredParts.find(rp => rp.label === placedPart.label);
                        
                        if (!matchingPart) {
                          // If no label match, try to match by dimensions (considering rotation)
                          matchingPart = requiredParts.find(rp => 
                            (rp.length === placedWidth && rp.width === placedHeight) ||
                            (rp.length === placedHeight && rp.width === placedWidth)
                          );
                        }
                        
                        if (matchingPart) {
                          const key = `${matchingPart.length}x${matchingPart.width}`;
                          const existing = partsSummary.get(key);
                          if (existing) {
                            existing.cut += 1;
                          }
                        }
                      });
                    });
                    
                    return Array.from(partsSummary.entries()).map(([key, summary]) => (
                      <div key={key} className={`summary-item ${summary.cut >= summary.required ? 'complete' : 'incomplete'}`}>
                        <div className="summary-header">
                          <strong>{summary.label || 'Unnamed Part'}</strong>
                          <span className="summary-status">
                            {summary.cut >= summary.required ? (
                              <span className="material-icons" style={{color: '#28a745'}}>check_circle</span>
                            ) : (
                              <span className="material-icons" style={{color: '#dc3545'}}>error</span>
                            )}
                          </span>
                        </div>
                        <div className="summary-dimensions">{summary.dimensions}</div>
                        <div className="summary-count">
                          <span className="cut-count">{summary.cut} {t.cut}</span>
                          <span className="separator">{t.of}</span>
                          <span className="required-count">{summary.required} {t.required}</span>
                        </div>
                        {summary.cut < summary.required && (
                          <div className="shortage-warning">
                            <span className="material-icons" style={{fontSize: '0.9rem', marginRight: '4px'}}>warning</span>
                            {summary.required - summary.cut} {t.partsMissing}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Panel Breakdown */}
              {settings.calculatePanelCount && results.panelBreakdown && results.panelBreakdown.length > 0 && (
                <div className="panel-breakdown-section">
                  <h3>{t.panelBreakdown}</h3>
                  <div className="breakdown-grid">
                    {results.panelBreakdown.map((panel, index) => (
                      <div key={index} className="breakdown-card">
                        <div className="breakdown-header">
                          <span className="material-icons">straighten</span>
                          <strong>{panel.sheetSize}</strong>
                        </div>
                        <div className="breakdown-stats">
                          <div className="stat-row">
                            <span className="stat-label">
                              <span className="material-icons stat-icon">shopping_cart</span>
                              {t.recommendedToBuy}
                            </span>
                            <span className="stat-value recommended">{panel.recommended} {t.sheets}</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">
                              <span className="material-icons stat-icon">check_circle</span>
                              {t.actuallyUsed}
                            </span>
                            <span className="stat-value used">{panel.used} {t.sheets}</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">
                              <span className="material-icons stat-icon">pie_chart</span>
                              {t.spaceEfficiency}
                            </span>
                            <span className="stat-value">{panel.utilization.toFixed(1)}%</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">
                              <span className="material-icons stat-icon">dashboard</span>
                              {t.averagePartsPerSheet}
                            </span>
                            <span className="stat-value">{panel.used > 0 ? Math.round(panel.partsCount / panel.used) : 0} {t.pieces}</span>
                          </div>
                        </div>
                        <div className="breakdown-footer">
                          <span className="parts-total">{panel.partsCount} {t.totalParts}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Export Options */}
              <div className="export-section">
                <button 
                  className="back-btn"
                  onClick={() => setResults(null)}
                >
                  <span className="material-icons" style={{marginRight: '8px'}}>arrow_back</span>
                  {t.backToMain}
                </button>
                <button className="export-btn" onClick={exportToPDF}>
                  <span className="material-icons" style={{marginRight: '8px'}}>picture_as_pdf</span>
                  {t.exportPdf}
                </button>
                <button className="export-btn" onClick={exportToExcel}>
                  <span className="material-icons" style={{marginRight: '8px'}}>grid_on</span>
                  {t.exportExcel}
                </button>
                <button className="export-btn" onClick={exportToCSV}>
                  <span className="material-icons" style={{marginRight: '8px'}}>table_chart</span>
                  {t.exportCsv}
                </button>
                <button className="export-btn" onClick={exportCuttingImages}>
                  <span className="material-icons" style={{marginRight: '8px'}}>picture_as_pdf</span>
                  {t.exportImages}
                </button>
                <button className="export-btn" onClick={exportToPDF}>
                  <span className="material-icons" style={{marginRight: '8px'}}>print</span>
                  {t.print}
                </button>
              </div>
              
              {/* Cutting Diagrams */}
              <CuttingDiagram layouts={results.layouts} units={settings.units} />
            </div>
          )}
        </div>
      </div>
      
      {/* Excel Import Modal */}
      {showExcelImport && (
        <ExcelImport
          onStockPanelsImport={handleStockPanelsImport}
          onRequiredPartsImport={handleRequiredPartsImport}
          onClose={() => setShowExcelImport(false)}
        />
      )}
      

    </div>
  )
}

export default App
