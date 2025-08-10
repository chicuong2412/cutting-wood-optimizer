// translations.ts - Internationalization support
export type Language = 'en' | 'vi';

export interface Translations {
  // Header
  appTitle: string;
  headerWarning: string;
  lookingFor: string;
  linearCalculator: string;
  pieceCalculator: string;
  or: string;
  description: string;
  additionalInfo: string;

  // Controls
  importExcel: string;
  units: string;
  genericMetric: string;
  centimeters: string;
  inches: string;

  // Settings
  kerfBlade: string;
  kerfPlaceholder: string;
  labels: string;
  considerGrain: string;
  materialGroups: string;
  prioritization: string;
  edgeBanding: string;
  prices: string;
  trimEdges: string;
  rollMaterial: string;
  beta: string;
  calculatePanelCount: string;
  panelCountDescription: string;
  panelCountMode: string;
  keyboardShortcuts: string;
  optimizationGoal: string;
  minimizeWaste: string;
  minimizeWasteDesc: string;
  minimizeSheets: string;
  minimizeSheetsDesc: string;
  maximizeEfficiency: string;
  maximizeEfficiencyDesc: string;

  // Tables
  availableStock: string;
  requiredPanels: string;
  length: string;
  width: string;
  quantity: string;
  label: string;
  actions: string;
  delete: string;
  add: string;
  more: string;
  stockNote: string;

  // Calculation
  calculate: string;
  calculating: string;
  feedback: string;

  // Results
  optimizationResults: string;
  sheetsUsed: string;
  totalWaste: string;
  materialUsed: string;
  efficiency: string;
  cutTime: string;
  totalPartsPlaced: string;
  partsCutSummary: string;
  recommendedPanels: string;
  totalPartsArea: string;
  recommendedPanelsNote: string;
  panelBreakdown: string;
  utilization: string;
  partsPerSheet: string;
  totalParts: string;
  used: string;
  recommendedToBuy: string;
  actuallyUsed: string;
  spaceEfficiency: string;
  averagePartsPerSheet: string;
  sheets: string;
  pieces: string;
  cut: string;
  of: string;
  required: string;
  partsMissing: string;
  backToMain: string;
  exportPdf: string;
  exportExcel: string;
  exportCsv: string;
  exportImages: string;
  print: string;

  // Cutting Diagrams
  cuttingDiagrams: string;
  sheet: string;
  size: string;
  parts: string;
  partsOnSheet: string;
  position: string;
  rotated: string;
  panels: string;
  total: string;

  // Excel Import
  importFromExcel: string;
  uploadExcelFile: string;
  uploadDescription: string;
  chooseExcelFile: string;
  excelFormat: string;
  formatDescription: string;
  stockMaterialsSheet: string;
  requiredPartsSheet: string;
  downloadTemplate: string;
  tipLabel: string;
  tipDescription: string;

  // Messages
  validationStock: string;
  validationParts: string;
  optimizationError: string;
  importSuccess: string;
  importError: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    appTitle: "Free Cutlist Optimizer",
    headerWarning: "Looking for",
    lookingFor: "Looking for",
    linearCalculator: "linear cut calculator",
    pieceCalculator: "piece count calculator",
    or: "or",
    description: "Powerful cutlist optimizer designed to find optimal cut layouts. Type the sheet or roll length and width, cutting kerf and required panel sizes and quantities. Cutlist optimizer will generate optimal panel nesting plan in couple of seconds.",
    additionalInfo: "The tool will always find the most efficient cutting method to save materials.",

    // Controls
    importExcel: "Import Excel",
    units: "Units:",
    genericMetric: "Generic/Metric (15.75)",
    centimeters: "Centimeters",
    inches: "Inches",

    // Settings
    kerfBlade: "Kerf / Blade thickness",
    kerfPlaceholder: "Thickness of the cutting blade",
    labels: "Labels",
    considerGrain: "Consider grain direction",
    materialGroups: "Material groups",
    prioritization: "Prioritization",
    edgeBanding: "Edge banding",
    prices: "Prices",
    trimEdges: "Trim the edges",
    rollMaterial: "Roll material",
    beta: "Beta",
    calculatePanelCount: "Calculate panel count needed",
    panelCountDescription: "Calculate how many large panels are needed to cut all required pieces",
    panelCountMode: "📋 Panel Count Mode: Enter panel dimensions only (quantity not needed)",
    keyboardShortcuts: "⌨️ Keyboard shortcuts: Enter = next field/row, Tab = next field, Esc = clear field",
    optimizationGoal: "Optimization Goal",
    minimizeWaste: "Minimize Waste",
    minimizeWasteDesc: "Reduce material waste by filling sheets completely",
    minimizeSheets: "Minimize Sheets",
    minimizeSheetsDesc: "Use fewer sheets by packing more parts per sheet",
    maximizeEfficiency: "Maximize Efficiency", 
    maximizeEfficiencyDesc: "Balance between waste reduction and sheet count",

    // Tables
    availableStock: "Available stock panels",
    requiredPanels: "Required panels",
    length: "Length",
    width: "Width",
    quantity: "Quantity",
    label: "Label",
    actions: "Actions",
    delete: "Delete",
    add: "Add",
    more: "More",
    stockNote: "Note: Stock panels quantity is not required if you have many panels of these dimensions.",

    // Calculation
    calculate: "Calculate",
    calculating: "Calculating...",
    feedback: "Feedback",

    // Results
    optimizationResults: "Optimization Results",
    sheetsUsed: "Sheets Used:",
    totalWaste: "Total Waste:",
    materialUsed: "Material Used:",
    efficiency: "Efficiency:",
    cutTime: "Estimated Cut Time:",
    totalPartsPlaced: "Total Parts Placed:",
    partsCutSummary: "Parts Cut Summary",
    recommendedPanels: "Recommended Panels:",
    totalPartsArea: "Total Parts Area:",
    recommendedPanelsNote: "Based on actual cutting simulation (includes missing parts)",
    panelBreakdown: "Panel Breakdown by Size",
    utilization: "Utilization",
    partsPerSheet: "Parts per Sheet",
    totalParts: "total parts",
    used: "Used",
    recommendedToBuy: "Recommended to Buy",
    actuallyUsed: "Actually Used in Cutting",
    spaceEfficiency: "Space Efficiency",
    averagePartsPerSheet: "Average Parts per Sheet",
    sheets: "sheets",
    pieces: "pieces",
    cut: "cut",
    of: "of",
    required: "required",
    partsMissing: "parts missing",
    backToMain: "Back to Main",
    exportPdf: "Export PDF",
    exportExcel: "Export Excel",
    exportCsv: "Export CSV",
    exportImages: "Export Diagrams PDF",
    print: "Print",

    // Cutting Diagrams
    cuttingDiagrams: "Cutting Diagrams",
    sheet: "Sheet",
    size: "Size:",
    parts: "Parts:",
    partsOnSheet: "Parts on this sheet:",
    position: "Position:",
    rotated: "(rotated)",
    panels: "panels",
    total: "total",

    // Excel Import
    importFromExcel: "Import from Excel",
    uploadExcelFile: "Upload Excel File",
    uploadDescription: "Upload an Excel file (.xlsx, .xls) with your stock materials and required parts.",
    chooseExcelFile: "Choose Excel File",
    excelFormat: "Excel Format",
    formatDescription: "Your Excel file should have the following format:",
    stockMaterialsSheet: "Stock Materials Sheet:",
    requiredPartsSheet: "Required Parts Sheet:",
    downloadTemplate: "Download Template",
    tipLabel: "Tip:",
    tipDescription: 'Name your sheets "Stock Materials" and "Required Parts" for automatic detection, or the importer will try to detect the data automatically.',

    // Messages
    validationStock: "Please enter valid dimensions for all stock panels",
    validationParts: "Please enter valid dimensions and quantities for all required parts",
    optimizationError: "An error occurred during optimization. Please check your inputs.",
    importSuccess: "Excel file imported successfully!",
    importError: "Error reading Excel file. Please check the format and try again."
  },

  vi: {
    // Header
    appTitle: "Công Cụ Tối Ưu Hóa Cắt Gỗ Miễn Phí",
    headerWarning: "Đang tìm kiếm",
    lookingFor: "Đang tìm kiếm",
    linearCalculator: "máy tính cắt thẳng",
    pieceCalculator: "máy tính đếm mảnh",
    or: "hoặc",
    description: "Công cụ tối ưu hóa danh sách cắt mạnh mẽ được thiết kế để tìm bố cục cắt tối ưu. Nhập chiều dài và chiều rộng của tấm hoặc cuộn, độ dày lưỡi cắt và kích thước cũng như số lượng tấm cần thiết. Công cụ tối ưu hóa sẽ tạo ra kế hoạch xếp tấm tối ưu trong vài giây.",
    additionalInfo: "ý là mình có kích thước của tấm gỗ lớn, xong rồi kích thước và số lượng mình cần cắt, thì nó tính ra được là cần bao nhiêu tấm gỗ lớn để cắt ra số lượng đó. Đồng thời nó sẽ ra luôn cách cắt ntn cho tiết kiệm nhất.",

    // Controls
    importExcel: "Nhập Excel",
    units: "Đơn vị:",
    genericMetric: "Chung/Mét (15.75)",
    centimeters: "Centimet",
    inches: "Inch",

    // Settings
    kerfBlade: "Độ dày lưỡi cắt",
    kerfPlaceholder: "Độ dày của lưỡi cắt",
    labels: "Nhãn",
    considerGrain: "Xem xét hướng vân gỗ",
    materialGroups: "Nhóm vật liệu",
    prioritization: "Ưu tiên",
    edgeBanding: "Dán cạnh",
    prices: "Giá cả",
    trimEdges: "Cắt tỉa cạnh",
    rollMaterial: "Vật liệu cuộn",
    beta: "Beta",
    calculatePanelCount: "Tính số tấm panel cần thiết",
    panelCountDescription: "Tính toán xem cần bao nhiêu tấm panel lớn để cắt ra tất cả các mảnh nhỏ cần thiết",
    panelCountMode: "📋 Chế độ Tính Panel: Chỉ cần nhập kích thước tấm (không cần số lượng)",
    keyboardShortcuts: "⌨️ Phím tắt: Enter = ô tiếp theo/dòng mới, Tab = ô tiếp theo, Esc = xóa ô",
    optimizationGoal: "Mục tiêu tối ưu hóa",
    minimizeWaste: "Giảm thiểu phế liệu",
    minimizeWasteDesc: "Giảm lãng phí vật liệu bằng cách lấp đầy tấm gỗ hoàn toàn",
    minimizeSheets: "Giảm thiểu số tấm",
    minimizeSheetsDesc: "Sử dụng ít tấm hơn bằng cách xếp nhiều mảnh trên mỗi tấm",
    maximizeEfficiency: "Tối đa hóa hiệu quả",
    maximizeEfficiencyDesc: "Cân bằng giữa giảm phế liệu và số lượng tấm",

    // Tables
    availableStock: "Tấm nguyên liệu có sẵn",
    requiredPanels: "Tấm cần thiết",
    length: "Chiều dài",
    width: "Chiều rộng",
    quantity: "Số lượng",
    label: "Nhãn",
    actions: "Hành động",
    delete: "Xóa",
    add: "Thêm",
    more: "Thêm",
    stockNote: "Lưu ý: Số lượng tấm nguyên liệu không bắt buộc nếu bạn có nhiều tấm với kích thước này.",

    // Calculation
    calculate: "Tính toán",
    calculating: "Đang tính toán...",
    feedback: "Phản hồi",

    // Results
    optimizationResults: "Kết quả tối ưu hóa",
    sheetsUsed: "Số tấm sử dụng:",
    totalWaste: "Tổng phế liệu:",
    materialUsed: "Vật liệu sử dụng:",
    efficiency: "Hiệu suất:",
    cutTime: "Thời gian cắt ước tính:",
    totalPartsPlaced: "Tổng số mảnh đã đặt:",
    partsCutSummary: "Tóm tắt mảnh đã cắt",
    recommendedPanels: "Số tấm gỗ đề xuất:",
    totalPartsArea: "Tổng diện tích mảnh cần cắt:",
    recommendedPanelsNote: "Dựa trên mô phỏng cắt thực tế (bao gồm mảnh còn thiếu)",
    panelBreakdown: "Chi tiết từng loại tấm",
    utilization: "Tỷ lệ sử dụng",
    partsPerSheet: "Mảnh/tấm",
    totalParts: "tổng mảnh",
    used: "Đã dùng",
    recommendedToBuy: "Nên mua",
    actuallyUsed: "Thực tế đã dùng để cắt",
    spaceEfficiency: "Hiệu suất sử dụng không gian",
    averagePartsPerSheet: "Trung bình mảnh/tấm",
    sheets: "tấm",
    pieces: "mảnh",
    cut: "đã cắt",
    of: "trên",
    required: "cần thiết",
    partsMissing: "mảnh còn thiếu",
    backToMain: "Quay lại trang chính",
    exportPdf: "Xuất PDF",
    exportExcel: "Xuất Excel",
    exportCsv: "Xuất CSV",
    exportImages: "Xuất sơ đồ PDF",
    print: "In",

    // Cutting Diagrams
    cuttingDiagrams: "Sơ đồ cắt",
    sheet: "Tấm",
    size: "Kích thước:",
    parts: "Mảnh:",
    partsOnSheet: "Mảnh trên tấm này:",
    position: "Vị trí:",
    rotated: "(đã xoay)",
    panels: "tấm",
    total: "tổng",

    // Excel Import
    importFromExcel: "Nhập từ Excel",
    uploadExcelFile: "Tải lên tệp Excel",
    uploadDescription: "Tải lên tệp Excel (.xlsx, .xls) với nguyên liệu và mảnh cần thiết của bạn.",
    chooseExcelFile: "Chọn tệp Excel",
    excelFormat: "Định dạng Excel",
    formatDescription: "Tệp Excel của bạn nên có định dạng sau:",
    stockMaterialsSheet: "Sheet nguyên liệu:",
    requiredPartsSheet: "Sheet mảnh cần thiết:",
    downloadTemplate: "Tải mẫu",
    tipLabel: "Mẹo:",
    tipDescription: 'Đặt tên các sheet là "Stock Materials" và "Required Parts" để tự động phát hiện, hoặc công cụ nhập sẽ cố gắng phát hiện dữ liệu tự động.',

    // Messages
    validationStock: "Vui lòng nhập kích thước hợp lệ cho tất cả tấm nguyên liệu",
    validationParts: "Vui lòng nhập kích thước và số lượng hợp lệ cho tất cả mảnh cần thiết",
    optimizationError: "Đã xảy ra lỗi trong quá trình tối ưu hóa. Vui lòng kiểm tra dữ liệu đầu vào.",
    importSuccess: "Nhập tệp Excel thành công!",
    importError: "Lỗi đọc tệp Excel. Vui lòng kiểm tra định dạng và thử lại."
  }
};

export const getTranslation = (language: Language): Translations => {
  try {
    return translations[language];
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback to English if there's an issue
    return translations.en;
  }
};
