import React from 'react'
import type { SheetLayout } from './CuttingOptimizer'
import { useLanguage } from './LanguageContext'

interface CuttingDiagramProps {
  layouts: SheetLayout[]
  units: string
}

interface GroupedLayout {
  layout: SheetLayout
  count: number
  originalIndices: number[]
}

const CuttingDiagram: React.FC<CuttingDiagramProps> = ({ layouts, units }) => {
  const { t } = useLanguage();
  
  const generateColor = (index: number): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D2B4DE'
    ]
    return colors[index % colors.length]
  }

  const getScale = (layout: SheetLayout): number => {
    const maxDimension = Math.max(layout.sheetWidth, layout.sheetHeight)
    return Math.min(400 / maxDimension, 1)
  }

  // Group identical layouts together - OPTIMIZED VERSION
  const groupIdenticalLayouts = (layouts: SheetLayout[]): GroupedLayout[] => {
    const groupsMap = new Map<string, GroupedLayout>()
    
    layouts.forEach((layout, index) => {
      // Create a simple key for this layout based on dimensions and part arrangement
      const layoutKey = `${layout.sheetWidth}x${layout.sheetHeight}-${layout.parts.length}-${layout.parts.map(p => `${p.width}x${p.height}`).sort().join(',')}`
      
      // O(1) lookup instead of O(n) search
      const existingGroup = groupsMap.get(layoutKey)
      
      if (existingGroup) {
        existingGroup.count++
        existingGroup.originalIndices.push(index)
      } else {
        groupsMap.set(layoutKey, {
          layout,
          count: 1,
          originalIndices: [index]
        })
      }
    })
    
    return Array.from(groupsMap.values())
  }

  const groupedLayouts = groupIdenticalLayouts(layouts)

  return (
    <div className="cutting-diagrams">
      <h3>{t.cuttingDiagrams}</h3>
      <div className="diagrams-grid">
        {groupedLayouts.map((groupedLayout, groupIndex) => {
          const { layout, count } = groupedLayout
          const scale = getScale(layout)
          const svgWidth = layout.sheetWidth * scale
          const svgHeight = layout.sheetHeight * scale

          return (
            <div key={`group-${groupIndex}`} className="diagram-container">
              <div className="sheet-header">
                <h4>
                  {t.sheet} {groupedLayout.originalIndices[0] + 1}
                  {count > 1 && (
                    <span className="sheet-count">
                      {' '}(× {count} {t.panels})
                    </span>
                  )}
                </h4>
                <div className="sheet-size">
                  {t.size} {layout.sheetWidth} × {layout.sheetHeight} {units}
                </div>
              </div>
              <div className="sheet-info">
                <span>
                  {t.parts} {layout.parts.length}
                  {count > 1 && (
                    <span className="total-parts">
                      {' '}({t.total}: {layout.parts.length * count})
                    </span>
                  )}
                </span>
              </div>
              
              <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${layout.sheetWidth} ${layout.sheetHeight}`}
                className="cutting-diagram-svg"
              >
                {/* Sheet background */}
                <rect
                  x="0"
                  y="0"
                  width={layout.sheetWidth}
                  height={layout.sheetHeight}
                  fill="#f8f9fa"
                  stroke="#dee2e6"
                  strokeWidth="2"
                />

                {/* Parts */}
                {layout.parts.map((part, partIndex) => (
                  <g key={part.partId}>
                    <rect
                      x={part.x}
                      y={part.y}
                      width={part.width}
                      height={part.height}
                      fill={generateColor(partIndex)}
                      stroke="#ffffff"
                      strokeWidth="1"
                      opacity="0.8"
                    />
                    
                    {/* Part dimensions at top */}
                    <text
                      x={part.x + part.width / 2}
                      y={part.y + 20}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={Math.max(10, Math.min(part.width / 10, part.height / 8))}
                      fill="#333"
                      fontWeight="bold"
                    >
                      {part.width} × {part.height}
                      {part.rotated && " ↻"}
                    </text>
                    
                    {/* Part label */}
                    <text
                      x={part.x + part.width / 2}
                      y={part.y + part.height / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={Math.max(8, Math.min(part.width / 8, part.height / 4))}
                      fill="#333"
                      fontWeight="600"
                    >
                      {part.label || `P${partIndex + 1}`}
                    </text>
                  </g>
                ))}

                {/* Grid lines for reference */}
                <defs>
                  <pattern
                    id={`grid-${groupIndex}`}
                    width="50"
                    height="50"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke="#dee2e6"
                      strokeWidth="0.5"
                      opacity="0.3"
                    />
                  </pattern>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width={layout.sheetWidth}
                  height={layout.sheetHeight}
                  fill={`url(#grid-${groupIndex})`}
                />
              </svg>

              {/* Parts list for this sheet */}
              <div className="parts-list">
                <h5>{t.partsOnSheet}</h5>
                <div className="parts-grid">
                  {layout.parts.map((part, partIndex) => (
                    <div key={part.partId} className="part-item">
                      <div
                        className="color-indicator"
                        style={{ backgroundColor: generateColor(partIndex) }}
                      ></div>
                      <div className="part-details">
                        <strong>{part.label || `Part ${partIndex + 1}`}</strong>
                        <div className="part-dimensions">
                          {part.width} × {part.height} {units}
                          {part.rotated && ` (${t.rotated})`}
                        </div>
                        <div className="part-position">
                          {t.position} ({part.x}, {part.y})
                        </div>
                        {count > 1 && (
                          <div className="part-count">
                            {t.quantity}: {count} {t.pieces}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CuttingDiagram
