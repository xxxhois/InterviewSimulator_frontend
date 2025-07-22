export type Position = {
    id: number;//岗位id
    position_name: string;
    company_name: string;
    position_url: string;
};

export type PositionList = {
    count: number;
    previous: string | null;
    next: string | null;
    results: Position[];
};