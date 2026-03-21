// Example seed script usage
// You can run this file using ts-node or bun if you configure connection to supabase server, 
// or manually execute these inserts in the SQL editor.

export const DUMMY_STUDENTS = [
  {
    nic: "200012345678",
    name: "Kamal Perera",
    province: "Western",
    district: "Colombo",
    category: "Open",
    subject: "Common",
    iq_marks: 85,
    gk_marks: 70,
    total_marks: 155
  },
  {
    nic: "199987654321",
    name: "Nimal Silva",
    province: "Central",
    district: "Kandy",
    category: "Do",
    subject: "Chemistry",
    iq_marks: 90,
    gk_marks: 80,
    total_marks: 170
  },
  {
    nic: "200109876543",
    name: "Sanduni Fernando",
    province: "Southern",
    district: "Galle",
    category: "Open",
    subject: "Common",
    iq_marks: 95,
    gk_marks: 85,
    total_marks: 180
  },
  {
    nic: "200234567890",
    name: "Akindu Wijesinghe",
    province: "Western",
    district: "Gampaha",
    category: "Do",
    subject: "Physics",
    iq_marks: 75,
    gk_marks: 90,
    total_marks: 165
  },
  {
    nic: "199856789012",
    name: "Tharushi De Silva",
    province: "Central",
    district: "Matale",
    category: "Open",
    subject: "Chemistry",
    iq_marks: 88,
    gk_marks: 78,
    total_marks: 166
  }
];

// INSERT INTO public.students_results (nic, name, province, district, category, iq_marks, gk_marks, total_marks) VALUES 
// ('200012345678', 'Kamal Perera', 'Western', 'Colombo', 'Open', 85, 70, 155),
// ...
