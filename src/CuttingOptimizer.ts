// CuttingOptimizer.ts - 2D Bin Packing Algorithm for Wood Cutting

export interface StockPanel {
  id: string
  length: number
  width: number
  quantity: number
}

export interface RequiredPart {
  id: string
  length: number
  width: number
  quantity: number
  label: string
}

export interface PlacedPart {
  partId: string
  x: number
  y: number
  width: number
  height: number
  label: string
  rotated: boolean
}

export interface SheetLayout {
  sheetId: string
  sheetWidth: number
  sheetHeight: number
  parts: PlacedPart[]
  wasteAreas: Array<{
    x: number
    y: number
    width: number
    height: number
  }>
}

export interface OptimizationResult {
  usedSheets: number
  totalWaste: number
  materialUsed: number
  cutTime: number
  efficiency: number
  layouts: SheetLayout[]
  recommendedPanelCount?: number
  totalPartsArea?: number
  panelBreakdown?: PanelBreakdown[]
}

export interface PanelBreakdown {
  sheetSize: string
  dimensions: { length: number; width: number }
  recommended: number
  used: number
  utilization: number
  partsCount: number
}

export interface CuttingSettings {
  kerf: number
  grainDirection: boolean
  trimEdges: boolean
  rollMaterial: boolean
  edgeBanding: boolean
  prioritization: boolean
  units: 'mm' | 'cm' | 'inch'
  calculatePanelCount: boolean
  optimizationGoal: 'minimize_waste' | 'minimize_sheets' | 'maximize_efficiency'
}

class Rectangle {
  public x: number
  public y: number
  public width: number
  public height: number

  constructor(
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  get right() { return this.x + this.width }
  get bottom() { return this.y + this.height }

  intersects(other: Rectangle): boolean {
    return !(this.right <= other.x || 
             other.right <= this.x || 
             this.bottom <= other.y || 
             other.bottom <= this.y)
  }

  contains(other: Rectangle): boolean {
    return this.x <= other.x && 
           this.y <= other.y && 
           this.right >= other.right && 
           this.bottom >= other.bottom
  }
}

export class CuttingOptimizer {
  private settings: CuttingSettings

  constructor(settings: CuttingSettings) {
    this.settings = settings
  }

  optimize(stockPanels: StockPanel[], requiredParts: RequiredPart[]): OptimizationResult {
    try {
      // Input validation
      if (!stockPanels || stockPanels.length === 0) {
        throw new Error('No stock panels provided')
      }
      if (!requiredParts || requiredParts.length === 0) {
        throw new Error('No required parts provided')
      }
      
      // Expand parts based on quantity
      const allParts = this.expandParts(requiredParts)
      
      if (allParts.length === 0) {
        throw new Error('No parts to optimize after expansion')
      }
      
      // Sort parts by area (largest first) for better packing
      allParts.sort((a, b) => (b.length * b.width) - (a.length * a.width))

      const layouts: SheetLayout[] = []
      const remainingParts = [...allParts]

      // Apply optimization strategy based on goal
      if (this.settings.optimizationGoal === 'minimize_waste') {
        this.optimizeForMinimalWaste(layouts, remainingParts, stockPanels)
      } else if (this.settings.optimizationGoal === 'minimize_sheets') {
        this.optimizeForMinimalSheets(layouts, remainingParts, stockPanels)
      } else {
        this.optimizeForMaximalEfficiency(layouts, remainingParts, stockPanels)
      }

      return this.calculateResults(layouts, allParts, stockPanels)
    } catch (error) {
      console.error('Optimization algorithm error:', error)
      throw error
    }
  }

  private optimizeForMinimalWaste(layouts: SheetLayout[], remainingParts: RequiredPart[], stockPanels: StockPanel[]) {
    // Strategy: Fill existing sheets completely before creating new ones
    let maxIterations = remainingParts.length * 5
    let iterations = 0
    
    while (remainingParts.length > 0 && iterations < maxIterations) {
      iterations++
      let partPlaced = false
      
      // Sort parts by area to place largest parts first on existing sheets
      remainingParts.sort((a, b) => (b.length * b.width) - (a.length * a.width))
      
      // Try to place parts on existing layouts first
      for (const layout of layouts) {
        const occupiedAreas = layout.parts.map(part => new Rectangle(part.x, part.y, part.width, part.height))
        
        for (let i = 0; i < remainingParts.length; i++) {
          const part = remainingParts[i]
          const placement = this.findBestPosition(part, layout.sheetWidth, layout.sheetHeight, occupiedAreas)
          
          if (placement) {
            layout.parts.push(placement)
            remainingParts.splice(i, 1)
            partPlaced = true
            break
          }
        }
        
        if (partPlaced) break
      }
      
      // If no existing sheet can fit any part, create a new one
      if (!partPlaced) {
        let bestSheet: StockPanel | null = null
        let bestUtilization = 0
        
        // Find the sheet that gives best material utilization
        for (const stockPanel of stockPanels) {
          const maxQuantity = this.settings.calculatePanelCount ? 999 : stockPanel.quantity
          const currentQuantity = layouts.filter(l => 
            l.sheetWidth === stockPanel.length && l.sheetHeight === stockPanel.width
          ).length
          
          if (currentQuantity < maxQuantity) {
            const testLayout = this.packSheet(stockPanel, remainingParts)
            const utilization = this.calculateUtilization(testLayout)
            
            if (testLayout.parts.length > 0 && utilization > bestUtilization) {
              bestSheet = stockPanel
              bestUtilization = utilization
            }
          }
        }
        
        if (bestSheet) {
          const layout = this.packSheet(bestSheet, remainingParts)
          layouts.push(layout)
          
          layout.parts.forEach(placedPart => {
            const index = remainingParts.findIndex(part => part.id === placedPart.partId)
            if (index !== -1) {
              remainingParts.splice(index, 1)
            }
          })
        } else {
          break
        }
      }
    }
  }

  private optimizeForMinimalSheets(layouts: SheetLayout[], remainingParts: RequiredPart[], stockPanels: StockPanel[]) {
    // Strategy: Pack as many parts as possible into each sheet
    while (remainingParts.length > 0) {
      let bestLayout: SheetLayout | null = null
      let maxPartsFitted = 0
      let bestStockPanel: StockPanel | null = null
      
      // Try each stock panel type and find the one that fits most parts
      for (const stockPanel of stockPanels) {
        const maxQuantity = this.settings.calculatePanelCount ? 999 : stockPanel.quantity
        const currentQuantity = layouts.filter(l => 
          l.sheetWidth === stockPanel.length && l.sheetHeight === stockPanel.width
        ).length
        
        if (currentQuantity < maxQuantity) {
          const testLayout = this.packSheet(stockPanel, remainingParts)
          
          if (testLayout.parts.length > maxPartsFitted) {
            bestLayout = testLayout
            maxPartsFitted = testLayout.parts.length
            bestStockPanel = stockPanel
          }
        }
      }
      
      if (bestLayout && bestStockPanel) {
        layouts.push(bestLayout)
        
        bestLayout.parts.forEach(placedPart => {
          const index = remainingParts.findIndex(part => part.id === placedPart.partId)
          if (index !== -1) {
            remainingParts.splice(index, 1)
          }
        })
      } else {
        break
      }
    }
  }

  private optimizeForMaximalEfficiency(layouts: SheetLayout[], remainingParts: RequiredPart[], stockPanels: StockPanel[]) {
    // Strategy: Balance between minimal waste and minimal sheets
    let maxIterations = remainingParts.length * 3
    let iterations = 0
    
    while (remainingParts.length > 0 && iterations < maxIterations) {
      iterations++
      let partPlaced = false
      
      // Try existing layouts first (weighted towards filling gaps)
      for (const layout of layouts) {
        const occupiedAreas = layout.parts.map(part => new Rectangle(part.x, part.y, part.width, part.height))
        
        // Find the part that best fits remaining space
        let bestPart: RequiredPart | null = null
        let bestPartIndex = -1
        let bestFitScore = 0
        
        for (let i = 0; i < remainingParts.length; i++) {
          const part = remainingParts[i]
          const placement = this.findBestPosition(part, layout.sheetWidth, layout.sheetHeight, occupiedAreas)
          
          if (placement) {
            // Score based on how well it fills the space
            const wasteReduction = this.calculateWasteReduction(layout, placement)
            if (wasteReduction > bestFitScore) {
              bestPart = part
              bestPartIndex = i
              bestFitScore = wasteReduction
            }
          }
        }
        
        if (bestPart && bestPartIndex >= 0) {
          const placement = this.findBestPosition(bestPart, layout.sheetWidth, layout.sheetHeight, occupiedAreas)
          if (placement) {
            layout.parts.push(placement)
            remainingParts.splice(bestPartIndex, 1)
            partPlaced = true
            break
          }
        }
      }
      
      // If no part could be placed on existing layouts, create new one
      if (!partPlaced) {
        // Find the most efficient new sheet
        let bestSheet: StockPanel | null = null
        let bestEfficiencyScore = 0
        
        for (const stockPanel of stockPanels) {
          const maxQuantity = this.settings.calculatePanelCount ? 999 : stockPanel.quantity
          const currentQuantity = layouts.filter(l => 
            l.sheetWidth === stockPanel.length && l.sheetHeight === stockPanel.width
          ).length
          
          if (currentQuantity < maxQuantity) {
            const testLayout = this.packSheet(stockPanel, remainingParts)
            const efficiency = this.calculateEfficiencyScore(testLayout)
            
            if (testLayout.parts.length > 0 && efficiency > bestEfficiencyScore) {
              bestSheet = stockPanel
              bestEfficiencyScore = efficiency
            }
          }
        }
        
        if (bestSheet) {
          const layout = this.packSheet(bestSheet, remainingParts)
          layouts.push(layout)
          
          layout.parts.forEach(placedPart => {
            const index = remainingParts.findIndex(part => part.id === placedPart.partId)
            if (index !== -1) {
              remainingParts.splice(index, 1)
            }
          })
        } else {
          break
        }
      }
    }
  }

  private calculateUtilization(layout: SheetLayout): number {
    const totalSheetArea = layout.sheetWidth * layout.sheetHeight
    const usedArea = layout.parts.reduce((sum, part) => sum + (part.width * part.height), 0)
    return totalSheetArea > 0 ? usedArea / totalSheetArea : 0
  }

  private calculateWasteReduction(_layout: SheetLayout, _newPart: PlacedPart): number {
    // Simple scoring based on how much area is utilized
    return _newPart.width * _newPart.height
  }

  private calculateEfficiencyScore(layout: SheetLayout): number {
    const utilization = this.calculateUtilization(layout)
    const partCount = layout.parts.length
    // Balance between utilization and number of parts
    return utilization * 0.7 + (partCount / 10) * 0.3
  }

  private expandParts(requiredParts: RequiredPart[]): RequiredPart[] {
    const expanded: RequiredPart[] = []
    
    requiredParts.forEach(part => {
      for (let i = 0; i < part.quantity; i++) {
        expanded.push({
          ...part,
          id: `${part.id}_${i}`,
          quantity: 1
        })
      }
    })
    
    return expanded
  }

  private packSheet(stockPanel: StockPanel, parts: RequiredPart[]): SheetLayout {
    const layout: SheetLayout = {
      sheetId: `sheet_${Date.now()}_${Math.random()}`,
      sheetWidth: stockPanel.length,
      sheetHeight: stockPanel.width,
      parts: [],
      wasteAreas: []
    }

    const placedRectangles: Rectangle[] = []

    for (const part of parts) {
      const placed = this.findBestPosition(
        part,
        stockPanel.length,
        stockPanel.width,
        placedRectangles
      )

      if (placed) {
        layout.parts.push(placed)
        placedRectangles.push(new Rectangle(
          placed.x,
          placed.y,
          placed.width,
          placed.height
        ))
      }
    }

    // Calculate waste areas
    layout.wasteAreas = this.calculateWasteAreas(
      stockPanel.length,
      stockPanel.width,
      placedRectangles
    )

    return layout
  }

  private findBestPosition(
    part: RequiredPart,
    sheetWidth: number,
    sheetHeight: number,
    placedRectangles: Rectangle[]
  ): PlacedPart | null {
    const kerf = this.settings.kerf || 0

    // Try both orientations if grain direction is not considered
    const orientations = this.settings.grainDirection 
      ? [{ width: part.length, height: part.width, rotated: false }]
      : [
          { width: part.length, height: part.width, rotated: false },
          { width: part.width, height: part.length, rotated: true }
        ]

    let bestPosition: PlacedPart | null = null
    let bestScore = Infinity

    for (const orientation of orientations) {
      // Try different positions using bottom-left fill algorithm
      for (let y = 0; y <= sheetHeight - orientation.height; y += kerf || 1) {
        for (let x = 0; x <= sheetWidth - orientation.width; x += kerf || 1) {
          const candidate = new Rectangle(x, y, orientation.width, orientation.height)
          
          // Check if position is valid (no overlap)
          if (this.isValidPosition(candidate, placedRectangles, kerf)) {
            // Score based on position (prefer bottom-left)
            const score = x + y
            
            if (score < bestScore) {
              bestScore = score
              bestPosition = {
                partId: part.id,
                x,
                y,
                width: orientation.width,
                height: orientation.height,
                label: part.label,
                rotated: orientation.rotated
              }
            }
          }
        }
      }
    }

    return bestPosition
  }

  private isValidPosition(
    candidate: Rectangle,
    placedRectangles: Rectangle[],
    kerf: number
  ): boolean {
    for (const placed of placedRectangles) {
      // Create expanded rectangle with kerf spacing
      const expandedPlaced = new Rectangle(
        placed.x - kerf,
        placed.y - kerf,
        placed.width + 2 * kerf,
        placed.height + 2 * kerf
      )
      
      if (candidate.intersects(expandedPlaced)) {
        return false
      }
    }
    return true
  }

  private calculateWasteAreas(
    _sheetWidth: number,
    _sheetHeight: number,
    _placedRectangles: Rectangle[]
  ): Array<{ x: number; y: number; width: number; height: number }> {
    // Simple waste calculation - find largest unused rectangles
    const wasteAreas: Array<{ x: number; y: number; width: number; height: number }> = []
    
    // This is a simplified implementation
    // In a real-world scenario, you'd want a more sophisticated waste calculation
    
    return wasteAreas
  }

  private calculateResults(
    layouts: SheetLayout[],
    allParts: RequiredPart[],
    stockPanels: StockPanel[]
  ): OptimizationResult {
    const totalPartsArea = allParts.reduce((sum, part) => sum + (part.length * part.width), 0)
    const usedSheetArea = layouts.reduce((sum, layout) => sum + (layout.sheetWidth * layout.sheetHeight), 0)
    const usedPartsArea = layouts.reduce((sum, layout) => 
      sum + layout.parts.reduce((partSum, part) => partSum + (part.width * part.height), 0), 0
    )

    // Calculate recommended panel count and breakdown if enabled
    let recommendedPanelCount: number | undefined
    let panelBreakdown: PanelBreakdown[] | undefined
    
    if (this.settings.calculatePanelCount && stockPanels.length > 0) {
      // Create breakdown for each panel type
      const panelStats = new Map<string, {
        dimensions: { length: number; width: number }
        used: number
        totalPartsCount: number
        totalUtilization: number
      }>()
      
      // Count actual usage
      layouts.forEach(layout => {
        const key = `${layout.sheetWidth}x${layout.sheetHeight}`
        const existing = panelStats.get(key) || {
          dimensions: { length: layout.sheetWidth, width: layout.sheetHeight },
          used: 0,
          totalPartsCount: 0,
          totalUtilization: 0
        }
        
        existing.used += 1
        existing.totalPartsCount += layout.parts.length
        
        const sheetArea = layout.sheetWidth * layout.sheetHeight
        const usedArea = layout.parts.reduce((sum, part) => sum + (part.width * part.height), 0)
        existing.totalUtilization += sheetArea > 0 ? (usedArea / sheetArea) : 0
        
        panelStats.set(key, existing)
      })
      
      // Calculate breakdown
      panelBreakdown = Array.from(panelStats.entries()).map(([, stats]) => {
        const avgUtilization = stats.used > 0 ? stats.totalUtilization / stats.used : 0
        
        // Calculate recommended based on remaining parts and efficiency
        const totalPartsPlaced = layouts.reduce((sum, layout) => sum + layout.parts.length, 0)
        const totalPartsRequired = allParts.length
        const remainingParts = totalPartsRequired - totalPartsPlaced
        
        let recommended = stats.used
        if (remainingParts > 0 && stats.used > 0) {
          const avgPartsPerSheet = stats.totalPartsCount / stats.used
          const additionalSheetsNeeded = Math.ceil(remainingParts / Math.max(1, avgPartsPerSheet))
          recommended += additionalSheetsNeeded
        }
        
        return {
          sheetSize: `${stats.dimensions.length} × ${stats.dimensions.width} ${this.settings.units}`,
          dimensions: stats.dimensions,
          recommended,
          used: stats.used,
          utilization: avgUtilization * 100,
          partsCount: stats.totalPartsCount
        }
      })
      
      recommendedPanelCount = panelBreakdown.reduce((sum, panel) => sum + panel.recommended, 0)
    }

    return {
      usedSheets: layouts.length,
      totalWaste: usedSheetArea - usedPartsArea,
      materialUsed: usedPartsArea,
      cutTime: layouts.reduce((sum, layout) => sum + layout.parts.length * 2, 0), // 2 min per cut
      efficiency: usedSheetArea > 0 ? (usedPartsArea / usedSheetArea) * 100 : 0,
      layouts,
      recommendedPanelCount,
      totalPartsArea,
      panelBreakdown
    }
  }
}
