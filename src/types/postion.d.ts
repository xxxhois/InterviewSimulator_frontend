export type Position = {
    id: number;//岗位id
    position_name: string;
    company_name?: string;
    position_url: string;
    position_type?: string;  
    position_description: string;
    position_requirements?: string;
};

export type PositionList = {
    count: number;
    previous: string | null;
    next: string | null;
    results: Position[];
};