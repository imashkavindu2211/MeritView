export type StudentResult = {
  id: string;
  nic: string;
  name: string;
  province: string;
  district: string;
  category: string;
  subject: string;
  iq_marks: number;
  gk_marks: number;
  total_marks: number;
  created_at: string;
  exam_date: string;
  paper_number: number;
  papers_count?: number;
  iq_aggregate?: number;
  gk_aggregate?: number;
  total_aggregate?: number;
};

export type StudentRankData = StudentResult & {
  island_rank?: number | null;
  province_rank?: number | null;
  district_rank?: number | null;
};
