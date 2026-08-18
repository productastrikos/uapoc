import React, {
  useState,
  useContext,
  createContext,
  ReactNode,
} from "react";

// Define Language type
export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface LanguageContextType {
  currentLanguage: Language;
  switchLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
];

const translations: Record<string, Record<string, string>> = {
  en: {
    "app.title": "Astrikos AI TAMS",
    "app.subtitle": "Phú Quốc International Airport",
    "nav.aocc": "AOCC Dashboard",
    "nav.airside": "Airside Operations",
    "nav.terminal": "Terminal & Passenger",
    "nav.landside": "Landside & Transport",
    "nav.security": "Security & Safety",
    "nav.maintenance": "Maintenance & Engineering",
    "nav.commercial": "Commercial & Revenue",
    "nav.sustainability": "Sustainability & Environment",
    "nav.sops": "SOP Console",
    "nav.reports": "Analytics & Reporting",
    "search.placeholder":
      "Search flights, assets, incidents... (Press G)",
    "system.status.all_operational": "All Systems Operational",
    "ai.advisory": "AI Advisory System",
    "ai.subtitle":
      "Astrikos S!aP - Sense → Interpret → Act → Predict",
    "kpi.on_time_performance": "On-Time Performance",
    "kpi.avg_taxi_out_time": "Avg Taxi-Out Time",
    "kpi.checkpoint_wait": "Checkpoint Wait P95",
    "kpi.energy_intensity": "Energy Intensity",
    "button.execute_sop": "Execute SOP",
    "button.run_shadow": "Run Shadow",
    "button.view_details": "View Details",
    "digital_twin.title": "Digital Twin",
    "module.coming_soon": "Module under development - Coming soon",
    
    // Security & Safety
    "security.subtitle": "Incident management, CCTV monitoring, and emergency response",
    "security.active_incidents": "Active Incidents",
    "security.cameras_online": "Cameras Online",
    "security.response_time": "Response Time",
    "security.threat_level": "Threat Level",
    "security.incident_management": "Live Incident Management",
    "security.critical": "Critical",
    "security.investigating": "Investigating",
    "security.resolved": "Resolved",
    "security.cctv_monitoring": "CCTV Control Matrix",
    "security.zone_selected": "Zone Selected",
    "security.active_cameras": "Active Cameras",
    "security.active": "Active",
    "security.maintenance": "Maintenance",
    "security.offline": "Offline",
    "security.threat_trends": "Threat Level Trends (24h)",
    "security.incident_types": "Incident Distribution",
    "security.quick_actions": "Emergency Actions",
    "security.lockdown_protocol": "Initiate Lockdown Protocol",
    "security.emergency_broadcast": "Emergency Broadcast",
    "security.camera_sweep": "Automated Camera Sweep",
    "security.access_report": "Generate Access Report",
    "security.emergency_dispatched": "Emergency Response Dispatched",
    "security.camera_control": "Camera Control Activated",
    "security.emergency_response": "Emergency Response",
    "security.view_cameras": "View Cameras",
    "security.action_initiated": "Security Action Initiated",
    "security.incident_details": "Security Incident Details",
    
    // Maintenance & Engineering
    "maintenance.subtitle": "Predictive maintenance, asset health, and work order management",
    "maintenance.active_work_orders": "Active Work Orders",
    "maintenance.asset_health": "Asset Health",
    "maintenance.mtbf": "MTBF",
    "maintenance.cost_savings": "Cost Savings",
    "maintenance.work_order_management": "Work Order Management",
    "maintenance.critical": "Critical",
    "maintenance.high_priority": "High Priority",
    "maintenance.in_progress": "In Progress",
    "maintenance.asset_health_monitoring": "Asset Health Monitoring",
    "maintenance.asset_selected": "Asset Selected",
    "maintenance.excellent": "Excellent",
    "maintenance.good": "Good",
    "maintenance.fair": "Fair",
    "maintenance.poor": "Poor",
    "maintenance.cost_analysis": "Maintenance Cost Analysis",
    "maintenance.preventive": "Preventive",
    "maintenance.corrective": "Corrective",
    "maintenance.emergency": "Emergency",
    "maintenance.predictive_alerts": "Predictive Maintenance Alerts",
    "maintenance.confidence": "AI Confidence",
    "maintenance.alert_details": "Alert Details",
    "maintenance.quick_actions": "Quick Actions",
    "maintenance.create_work_order": "Create Work Order",
    "maintenance.schedule_pm": "Schedule Preventive Maintenance",
    "maintenance.parts_inventory": "Parts Inventory Check",
    "maintenance.technician_dispatch": "Dispatch Technician",
    "maintenance.action_scheduled": "Maintenance Scheduled",
    "maintenance.technician_assigned": "Technician Assigned",
    "maintenance.work_completed": "Work Completed",
    "maintenance.start_work": "Start Work",
    "maintenance.complete": "Mark Complete",
    "maintenance.action_initiated": "Maintenance Action Initiated",
    "maintenance.work_order_details": "Work Order Details",
    
    // Commercial & Revenue
    "commercial.subtitle": "Revenue optimization, retail analytics, and customer satisfaction",
    "commercial.total_revenue": "Total Revenue",
    "commercial.avg_transaction": "Avg Transaction",
    "commercial.conversion_rate": "Conversion Rate",
    "commercial.satisfaction": "Customer Satisfaction",
    "commercial.revenue_optimization": "Revenue Stream Optimization",
    "commercial.exceeding_target": "Exceeding Target",
    "commercial.below_target": "Below Target",
    "commercial.current_revenue": "Current Revenue",
    "commercial.target": "Target",
    "commercial.growth": "Growth",
    "commercial.margin": "Margin",
    "commercial.optimization_opportunities": "Optimization Opportunities",
    "commercial.revenue_trends": "Monthly Revenue Trends",
    "commercial.retail": "Retail",
    "commercial.fnb": "Food & Beverage",
    "commercial.parking": "Parking",
    "commercial.lounges": "VIP Lounges",
    "commercial.customer_satisfaction": "Customer Satisfaction Scores",
    "commercial.feedback_details": "Customer Feedback Details",
    "commercial.conversion_rates": "Service Conversion Rates",
    "commercial.revenue_opportunities": "AI Revenue Opportunities",
    "commercial.premium_services": "Launch Premium Services",
    "commercial.loyalty_program": "Implement Loyalty Program",
    "commercial.digital_marketing": "Digital Marketing Campaign",
    "commercial.space_optimization": "Optimize Space Utilization",
    "commercial.opportunity_selected": "Opportunity Selected",
    "commercial.quick_actions": "Commercial Actions",
    "commercial.launch_promotion": "Launch Promotion",
    "commercial.adjust_pricing": "Adjust Pricing Strategy",
    "commercial.analyze_trends": "Analyze Market Trends",
    "commercial.customer_survey": "Customer Survey",
    "commercial.optimization_applied": "Optimization Applied",
    "commercial.action_initiated": "Commercial Action Initiated",
    "commercial.revenue_details": "Revenue Stream Details",
    
    // Sustainability & Environment
    "sustainability.subtitle": "Carbon tracking, energy management, and environmental compliance",
    "sustainability.energy_savings": "Energy Savings",
    "sustainability.carbon_reduction": "Carbon Reduction",
    "sustainability.waste_diverted": "Waste Diverted",
    "sustainability.water_saved": "Water Conservation",
    "sustainability.environmental_kpis": "Environmental Performance Indicators",
    "sustainability.on_track": "On Track",
    "sustainability.needs_attention": "Needs Attention",
    "sustainability.off_track": "Off Track",
    "sustainability.trend": "Trend",
    "sustainability.deadline": "Target Date",
    "sustainability.active_initiatives": "Active Sustainability Initiatives",
    "sustainability.energy_trends": "Energy Consumption & Renewable Mix",
    "sustainability.total_consumption": "Total Consumption",
    "sustainability.renewable_energy": "Renewable Energy",
    "sustainability.target": "Target",
    "sustainability.emissions_breakdown": "Carbon Emissions by Source",
    "sustainability.waste_management": "Waste Stream Analysis",
    "sustainability.waste_details": "Waste Category Details",
    "sustainability.current": "Current",
    "sustainability.goals_2025": "2025 Sustainability Goals",
    "sustainability.carbon_neutral": "Achieve Carbon Neutral Operations",
    "sustainability.renewable_50": "50% Renewable Energy Mix",
    "sustainability.zero_waste": "Zero Waste to Landfill",
    "sustainability.water_reduction": "20% Water Use Reduction",
    "sustainability.goal_details": "Sustainability Goal Progress",
    "sustainability.quick_actions": "Environmental Actions",
    "sustainability.energy_audit": "Conduct Energy Audit",
    "sustainability.waste_assessment": "Waste Stream Assessment",
    "sustainability.emissions_report": "Generate Emissions Report",
    "sustainability.water_monitoring": "Water Usage Monitoring",
    "sustainability.initiative_activated": "Sustainability Initiative Activated",
    "sustainability.action_initiated": "Environmental Action Initiated",
    "sustainability.metric_details": "Sustainability Metric Details",
  },
  vi: {
    "app.title": "Astrikos AI TAMS",
    "app.subtitle": "Sân bay Quốc tế Phú Quốc",
    "nav.aocc": "Bảng điều khiển AOCC",
    "nav.airside": "Hoạt động phía máy bay",
    "nav.terminal": "Nhà ga & Hành khách",
    "nav.landside": "Phía đất liền & Vận chuyển",
    "nav.security": "An ninh & An toàn",
    "nav.maintenance": "Bảo trì & Kỹ thuật",
    "nav.commercial": "Thương mại & Doanh thu",
    "nav.sustainability": "Bền vững & Môi trường",
    "nav.sops": "Bảng điều khiển SOP",
    "nav.reports": "Phân tích & Báo cáo",
    "search.placeholder":
      "Tìm kiếm chuyến bay, tài sản, sự cố... (Nhấn G)",
    "system.status.all_operational":
      "Tất cả hệ thống hoạt động bình thường",
    "ai.advisory": "Hệ thống tư vấn AI",
    "ai.subtitle":
      "Astrikos S!aP - Cảm nhận → Phân tích → Hành động → Dự đoán",
    "kpi.on_time_performance": "Hiệu suất đúng giờ",
    "kpi.avg_taxi_out_time": "Thời gian lăn trung bình",
    "kpi.checkpoint_wait": "Chờ đợi kiểm soát P95",
    "kpi.energy_intensity": "Cường độ năng lượng",
    "button.execute_sop": "Thực hiện SOP",
    "button.run_shadow": "Chạy mô phỏng",
    "button.view_details": "Xem chi tiết",
    "digital_twin.title": "Mô hình số Phú Quốc",
    "module.coming_soon": "Mô-đun đang phát triển - Sắp ra mắt",
    
    // Security & Safety - Vietnamese
    "security.subtitle": "Quản lý sự cố, giám sát camera và ứng phó khẩn cấp",
    "security.active_incidents": "Sự cố đang hoạt động",
    "security.cameras_online": "Camera trực tuyến",
    "security.response_time": "Thời gian phản hồi",
    "security.threat_level": "Mức độ đe dọa",
    "security.incident_management": "Quản lý sự cố trực tiếp",
    "security.critical": "Nghiêm trọng",
    "security.investigating": "Đang điều tra",
    "security.resolved": "Đã giải quyết",
    "security.cctv_monitoring": "Ma trận kiểm soát CCTV",
    "security.zone_selected": "Đã chọn khu vực",
    "security.active_cameras": "Camera hoạt động",
    "security.active": "Hoạt động",
    "security.maintenance": "Bảo trì",
    "security.offline": "Ngoại tuyến",
    "security.threat_trends": "Xu hướng mức độ đe dọa (24h)",
    "security.incident_types": "Phân loại sự cố",
    "security.quick_actions": "Hành động khẩn cấp",
    "security.lockdown_protocol": "Kích hoạt quy trình phong tỏa",
    "security.emergency_broadcast": "Phát sóng khẩn cấp",
    "security.camera_sweep": "Quét camera tự động",
    "security.access_report": "Tạo báo cáo truy cập",
    "security.emergency_dispatched": "Đã điều động ứng phó khẩn cấp",
    "security.camera_control": "Đã kích hoạt điều khiển camera",
    "security.emergency_response": "Ứng phó khẩn cấp",
    "security.view_cameras": "Xem camera",
    "security.action_initiated": "Đã khởi động hành động an ninh",
    "security.incident_details": "Chi tiết sự cố an ninh",
    
    // Maintenance & Engineering - Vietnamese
    "maintenance.subtitle": "Bảo trì dự báo, sức khỏe tài sản và quản lý lệnh công việc",
    "maintenance.active_work_orders": "Lệnh công việc hoạt động",
    "maintenance.asset_health": "Sức khỏe tài sản",
    "maintenance.mtbf": "MTBF",
    "maintenance.cost_savings": "Tiết kiệm chi phí",
    "maintenance.work_order_management": "Quản lý lệnh công việc",
    "maintenance.critical": "Nghiêm trọng",
    "maintenance.high_priority": "Ưu tiên cao",
    "maintenance.in_progress": "Đang tiến hành",
    "maintenance.asset_health_monitoring": "Giám sát sức khỏe tài sản",
    "maintenance.asset_selected": "Đã chọn tài sản",
    "maintenance.excellent": "Xuất sắc",
    "maintenance.good": "Tốt",
    "maintenance.fair": "Khá",
    "maintenance.poor": "Kém",
    "maintenance.cost_analysis": "Phân tích chi phí bảo trì",
    "maintenance.preventive": "Phòng ngừa",
    "maintenance.corrective": "Khắc phục",
    "maintenance.emergency": "Khẩn cấp",
    "maintenance.predictive_alerts": "Cảnh báo bảo trì dự báo",
    "maintenance.confidence": "Độ tin cậy AI",
    "maintenance.alert_details": "Chi tiết cảnh báo",
    "maintenance.quick_actions": "Hành động nhanh",
    "maintenance.create_work_order": "Tạo lệnh công việc",
    "maintenance.schedule_pm": "Lập lịch bảo trì phòng ngừa",
    "maintenance.parts_inventory": "Kiểm tra tồn kho phụ tùng",
    "maintenance.technician_dispatch": "Điều phái kỹ thuật viên",
    "maintenance.action_scheduled": "Đã lên lịch bảo trì",
    "maintenance.technician_assigned": "Đã giao nhiệm vụ cho kỹ thuật viên",
    "maintenance.work_completed": "Công việc đã hoàn thành",
    "maintenance.start_work": "Bắt đầu công việc",
    "maintenance.complete": "Đánh dấu hoàn thành",
    "maintenance.action_initiated": "Đã khởi động hành động bảo trì",
    "maintenance.work_order_details": "Chi tiết lệnh công việc",
    
    // Commercial & Revenue - Vietnamese  
    "commercial.subtitle": "Tối ưu hóa doanh thu, phân tích bán lẻ và hài lòng khách hàng",
    "commercial.total_revenue": "Tổng doanh thu",
    "commercial.avg_transaction": "Giao dịch trung bình",
    "commercial.conversion_rate": "Tỷ lệ chuyển đổi",
    "commercial.satisfaction": "Hài lòng khách hàng",
    "commercial.revenue_optimization": "Tối ưu hóa dòng doanh thu",
    "commercial.exceeding_target": "Vượt mục tiêu",
    "commercial.below_target": "Dưới mục tiêu",
    "commercial.current_revenue": "Doanh thu hiện tại",
    "commercial.target": "Mục tiêu",
    "commercial.growth": "Tăng trưởng",
    "commercial.margin": "Biên lợi nhuận",
    "commercial.optimization_opportunities": "Cơ hội tối ưu hóa",
    "commercial.revenue_trends": "Xu hướng doanh thu hàng tháng",
    "commercial.retail": "Bán lẻ",
    "commercial.fnb": "Thực phẩm & Đồ uống",
    "commercial.parking": "Bãi đỗ xe",
    "commercial.lounges": "Phòng chờ VIP",
    "commercial.customer_satisfaction": "Điểm hài lòng khách hàng",
    "commercial.feedback_details": "Chi tiết phản hồi khách hàng",
    "commercial.conversion_rates": "Tỷ lệ chuyển đổi dịch vụ",
    "commercial.revenue_opportunities": "Cơ hội doanh thu AI",
    "commercial.premium_services": "Ra mắt dịch vụ cao cấp",
    "commercial.loyalty_program": "Triển khai chương trình khách hàng thân thiết",
    "commercial.digital_marketing": "Chiến dịch tiếp thị số",
    "commercial.space_optimization": "Tối ưu hóa sử dụng không gian",
    "commercial.opportunity_selected": "Đã chọn cơ hội",
    "commercial.quick_actions": "Hành động thương mại",
    "commercial.launch_promotion": "Khởi động khuyến mãi",
    "commercial.adjust_pricing": "Điều chỉnh chiến lược giá",
    "commercial.analyze_trends": "Phân tích xu hướng thị trường",
    "commercial.customer_survey": "Khảo sát khách hàng",
    "commercial.optimization_applied": "Đã áp dụng tối ưu hóa",
    "commercial.action_initiated": "Đã khởi động hành động thương mại",
    "commercial.revenue_details": "Chi tiết dòng doanh thu",
    
    // Sustainability & Environment - Vietnamese
    "sustainability.subtitle": "Theo dõi carbon, quản lý năng lượng và tuân thủ môi trường",
    "sustainability.energy_savings": "Tiết kiệm năng lượng",
    "sustainability.carbon_reduction": "Giảm carbon",
    "sustainability.waste_diverted": "Chuyển hướng rác thải",
    "sustainability.water_saved": "Bảo tồn nước",
    "sustainability.environmental_kpis": "Chỉ số hiệu suất môi trường",
    "sustainability.on_track": "Đúng tiến độ",
    "sustainability.needs_attention": "Cần chú ý",
    "sustainability.off_track": "Lệch tiến độ",
    "sustainability.trend": "Xu hướng",
    "sustainability.deadline": "Ngày mục tiêu",
    "sustainability.active_initiatives": "Sáng kiến bền vững đang hoạt động",
    "sustainability.energy_trends": "Tiêu thụ năng lượng & Hỗn hợp tái tạo",
    "sustainability.total_consumption": "Tổng tiêu thụ",
    "sustainability.renewable_energy": "Năng lượng tái tạo",
    "sustainability.target": "Mục tiêu",
    "sustainability.emissions_breakdown": "Phân tích phát thải carbon theo nguồn",
    "sustainability.waste_management": "Phân tích dòng chất thải",
    "sustainability.waste_details": "Chi tiết danh mục chất thải",
    "sustainability.current": "Hiện tại",
    "sustainability.goals_2025": "Mục tiêu bền vững 2025",
    "sustainability.carbon_neutral": "Đạt hoạt động trung hòa carbon",
    "sustainability.renewable_50": "Hỗn hợp 50% năng lượng tái tạo",
    "sustainability.zero_waste": "Zero chất thải đến bãi rác",
    "sustainability.water_reduction": "Giảm 20% sử dụng nước",
    "sustainability.goal_details": "Tiến độ mục tiêu bền vững",
    "sustainability.quick_actions": "Hành động môi trường",
    "sustainability.energy_audit": "Tiến hành kiểm toán năng lượng",
    "sustainability.waste_assessment": "Đánh giá dòng chất thải",
    "sustainability.emissions_report": "Tạo báo cáo phát thải",
    "sustainability.water_monitoring": "Giám sát sử dụng nước",
    "sustainability.initiative_activated": "Đã kích hoạt sáng kiến bền vững",
    "sustainability.action_initiated": "Đã khởi động hành động môi trường",
    "sustainability.metric_details": "Chi tiết chỉ số bền vững",
  },
};

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    languages[0] // default = English
  );

  const switchLanguage = (language: Language) => {
    setCurrentLanguage(language);
  };

  const t = (key: string): string => {
    const langCode = currentLanguage.code;
    return (
      translations[langCode]?.[key] ??
      translations["en"][key] ?? // fallback to English
      key
    );
  };

  return (
    <LanguageContext.Provider
      value={{ currentLanguage, switchLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Export available languages
export { languages };
